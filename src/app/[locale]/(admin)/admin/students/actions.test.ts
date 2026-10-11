// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { auditLogEntry, studentRecord } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { form, session } from "@/__tests__/pg-fixtures";
import {
  bulkImportStudents,
  createStudentRecord,
  updateStudentEmail,
} from "./actions";
import StudentsPage from "./page";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

const pg = db as unknown as TestDb;

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
});

const records = () =>
  pg.query.studentRecord.findMany({
    orderBy: (r, { asc }) => asc(r.studentId),
  });
const audits = () => pg.select().from(auditLogEntry);

const valid = {
  studentId: "GTEC001",
  fullName: "John Doe",
  phone: "9876543210",
  email: "john@example.com",
  locale: "en",
};

describe("createStudentRecord", () => {
  test("1. single-entry creation succeeds with valid data", async () => {
    await createStudentRecord(form(valid));

    const [record] = await records();
    expect(record).toMatchObject({
      studentId: "GTEC001",
      fullName: "John Doe",
      phone: "9876543210",
      email: "john@example.com",
      linkedUserId: null,
    });
    expect(await audits()).toEqual([
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "studentRecord.create",
        entityType: "StudentRecord",
        entityId: record.id,
      }),
    ]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/students");
  });

  test("throws on duplicate studentId", async () => {
    await pg
      .insert(studentRecord)
      .values({
        studentId: "GTEC001",
        fullName: "Existing",
        phone: "0000000000",
      });

    await expect(createStudentRecord(form(valid))).rejects.toThrow(
      'Student ID "GTEC001" already exists',
    );
    expect(await records()).toHaveLength(1);
    expect(await audits()).toHaveLength(0);
  });

  test("rejects when email is missing", async () => {
    const { email: _email, ...noEmail } = valid;

    await expect(createStudentRecord(form(noEmail))).rejects.toThrow(
      "studentId, fullName, phone, and email are required",
    );
    expect(await records()).toHaveLength(0);
  });

  test("rejects an invalid email format", async () => {
    await expect(
      createStudentRecord(form({ ...valid, email: "not-an-email" })),
    ).rejects.toThrow('"not-an-email" is not a valid email address');
    expect(await records()).toHaveLength(0);
  });

  test("is denied to an employer", async () => {
    mockAuth.mockResolvedValue(session("employer_1", "EMPLOYER"));

    await expect(createStudentRecord(form(valid))).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect(await records()).toHaveLength(0);
  });
});

describe("bulkImportStudents", () => {
  const csv = [
    "studentId,fullName,phone,email",
    "GTEC001,Alice,1111111111,alice@example.com",
    "GTEC002,Bob,2222222222,bob@example.com",
    "GTEC003,Carol,3333333333,carol@example.com",
    "GTEC004,Dave,4444444444,dave@example.com",
    "GTEC005,Eve,5555555555,eve@example.com",
  ].join("\n");

  test("2. CSV bulk import with 5 valid rows creates 5 StudentRecord rows", async () => {
    const results = await bulkImportStudents(form({ csv, locale: "en" }));

    expect(results).toHaveLength(5);
    results.forEach((r) => expect(r.success).toBe(true));
    expect((await records()).map((r) => [r.studentId, r.fullName])).toEqual([
      ["GTEC001", "Alice"],
      ["GTEC002", "Bob"],
      ["GTEC003", "Carol"],
      ["GTEC004", "Dave"],
      ["GTEC005", "Eve"],
    ]);
    expect(await audits()).toEqual([
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "studentRecord.bulkImport",
        entityType: "StudentRecord",
        entityId: "bulk",
      }),
    ]);
  });

  test("3. CSV bulk with one duplicate and four valid rows creates 4 and reports duplicate", async () => {
    await pg
      .insert(studentRecord)
      .values({
        studentId: "GTEC003",
        fullName: "Existing Carol",
        phone: "3333333333",
      });

    const results = await bulkImportStudents(form({ csv, locale: "en" }));

    const failures = results.filter((r) => !r.success);
    expect(results.filter((r) => r.success)).toHaveLength(4);
    expect(failures).toHaveLength(1);
    expect(failures[0].studentId).toBe("GTEC003");
    expect(failures[0].error).toContain("Duplicate");

    const all = await records();
    expect(all).toHaveLength(5);
    expect(all.find((r) => r.studentId === "GTEC003")?.fullName).toBe(
      "Existing Carol",
    );
  });
});

describe("updateStudentEmail — backfill for records created before email was required", () => {
  test("updates the record's email and logs the admin action", async () => {
    const [record] = await pg
      .insert(studentRecord)
      .values({ studentId: "GTEC-TEST-001", fullName: "Old", phone: "1" })
      .returning();

    await updateStudentEmail(
      form({ recordId: record.id, email: "student@example.com", locale: "en" }),
    );

    expect((await records())[0].email).toBe("student@example.com");
    expect(await audits()).toEqual([
      expect.objectContaining({
        action: "studentRecord.updateEmail",
        entityId: record.id,
      }),
    ]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/students");
  });

  test("rejects an invalid email", async () => {
    await expect(
      updateStudentEmail(form({ recordId: "sr_1", email: "bad" })),
    ).rejects.toThrow('"bad" is not a valid email address');
  });

  test("fails for an unknown record without auditing", async () => {
    await expect(
      updateStudentEmail(
        form({ recordId: "missing", email: "a@b.co", locale: "en" }),
      ),
    ).rejects.toThrow("Student record not found");
    expect(await audits()).toHaveLength(0);
  });
});

describe("StudentsPage permission gate", () => {
  test("4. /admin/students is denied to an employer-role user (403)", async () => {
    mockAuth.mockResolvedValue(session("employer_1", "EMPLOYER"));

    await expect(
      StudentsPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
