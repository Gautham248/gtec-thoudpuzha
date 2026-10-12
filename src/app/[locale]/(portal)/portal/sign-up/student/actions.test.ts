// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { candidateProfile, studentRecord, user } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertStudentProfile, insertUser } from "@/__tests__/pg-fixtures";
import { finalizeStudentVerification, lookupStudentRecord } from "./actions";

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockClerkClient = vi.hoisted(() => vi.fn());
const mockUpdateUser = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockCheckRateLimit = vi.hoisted(() =>
  vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 })),
);
const mockGetClientIp = vi.hoisted(() =>
  vi.fn(() => Promise.resolve("127.0.0.1")),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: mockGetClientIp,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkClient: mockClerkClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

const pg = db as unknown as TestDb;

async function insertRecord(
  values: Partial<typeof studentRecord.$inferInsert> = {},
) {
  const [row] = await pg
    .insert(studentRecord)
    .values({
      id: "sr_1",
      studentId: "GTEC001",
      fullName: "Alice",
      phone: "9876543210",
      email: "alice@example.com",
      ...values,
    })
    .returning();
  return row;
}

function lookupForm(studentId: string, phone: string) {
  const fd = new FormData();
  fd.append("studentId", studentId);
  fd.append("phone", phone);
  return fd;
}

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
});

// ─── Tests: lookupStudentRecord ─────────────────────────────────────────────

describe("lookupStudentRecord", () => {
  test("1. Correct Student ID + phone pair returns success with studentRecordId and email", async () => {
    await insertRecord();

    const result = await lookupStudentRecord(
      lookupForm("GTEC001", "9876543210"),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.studentRecordId).toBe("sr_1");
      expect(result.email).toBe("alice@example.com");
    }
  });

  test("2. Incorrect Student ID or phone shows generic non-revealing error", async () => {
    await insertRecord();

    for (const [id, phone] of [
      ["GTEC001", "0000000000"],
      ["GTEC999", "9876543210"],
    ]) {
      const result = await lookupStudentRecord(lookupForm(id, phone));
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "We couldn't verify these details — please contact the centre.",
      );
    }
  });

  test("4. Already-linked StudentRecord is rejected with specific error", async () => {
    await insertRecord({ linkedUserId: "user_existing" });

    const result = await lookupStudentRecord(
      lookupForm("GTEC001", "9876543210"),
    );

    expect(result.success).toBe(false);
    expect("alreadyLinked" in result && result.alreadyLinked).toBe(true);
    expect(result.error).toBe(
      "This Student ID has already been registered — if this is you, please sign in instead.",
    );
  });

  test("6. StudentRecord with no email on file is rejected with a clear message (pending admin backfill)", async () => {
    // Records created before email became required for sign-up have no email
    // and must get an actionable error rather than a crash later on.
    await insertRecord({ email: null });

    const result = await lookupStudentRecord(
      lookupForm("GTEC001", "9876543210"),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Your record doesn't have an email on file yet — please contact the centre to add one before verifying.",
    );
  });

  test("returns error if studentId or phone are missing", async () => {
    const result1 = await lookupStudentRecord(new FormData());
    expect(result1.success).toBe(false);
    expect(result1.error).toBe(
      "Please provide both Student ID and phone number.",
    );

    const result2 = await lookupStudentRecord(lookupForm("GTEC001", ""));
    expect(result2.success).toBe(false);
  });
});

// ─── Tests: finalizeStudentVerification ──────────────────────────────────────

describe("finalizeStudentVerification", () => {
  beforeEach(() => {
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
    mockClerkClient.mockResolvedValue({
      users: { updateUser: mockUpdateUser },
    });
    mockAuth.mockResolvedValue({ userId: "user_test_1" });
  });

  test("3. Successful OTP entry sets role=STUDENT, isVerifiedStudent=true, links StudentRecord", async () => {
    await insertRecord();

    await expect(finalizeStudentVerification("sr_1")).rejects.toThrow(
      "redirect:/portal/student/biodata",
    );

    expect(mockUpdateUser).toHaveBeenCalledWith("user_test_1", {
      publicMetadata: { role: "STUDENT" },
    });
    expect(
      await pg.select({ id: user.id, role: user.role }).from(user),
    ).toEqual([{ id: "user_test_1", role: "STUDENT" }]);
    expect(await pg.select().from(candidateProfile)).toEqual([
      expect.objectContaining({
        userId: "user_test_1",
        isVerifiedStudent: true,
        studentRecordId: "sr_1",
      }),
    ]);
    const [record] = await pg.select().from(studentRecord);
    expect(record.linkedUserId).toBe("user_test_1");
  });

  test("an existing User row (e.g. created earlier) gets its role set to STUDENT", async () => {
    await insertRecord();
    await insertUser(pg, { id: "user_test_1", role: "JOB_SEEKER" });

    await expect(finalizeStudentVerification("sr_1")).rejects.toThrow(
      "redirect:",
    );

    const [row] = await pg.select().from(user);
    expect(row.role).toBe("STUDENT");
  });

  test("is all-or-nothing: if the profile can't be created, nothing is linked", async () => {
    await insertRecord();
    // A profile already exists for this user → the profile insert fails.
    await insertUser(pg, { id: "user_test_1", role: "JOB_SEEKER" });
    await insertStudentProfile(pg, { userId: "user_test_1" });

    await expect(finalizeStudentVerification("sr_1")).rejects.toThrow();

    const [record] = await pg.select().from(studentRecord);
    expect(record.linkedUserId).toBeNull();
    const [row] = await pg.select().from(user);
    expect(row.role).toBe("JOB_SEEKER"); // role change rolled back too
  });

  test("redirects to sign-in if unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(finalizeStudentVerification("sr_1")).rejects.toThrow(
      "redirect:/sign-in",
    );

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  test("redirects to sign-up page if record not found or already linked", async () => {
    await expect(finalizeStudentVerification("sr_missing")).rejects.toThrow(
      "redirect:/portal/sign-up/student",
    );

    await insertRecord({ linkedUserId: "user_other" });
    await expect(finalizeStudentVerification("sr_1")).rejects.toThrow(
      "redirect:/portal/sign-up/student",
    );
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
