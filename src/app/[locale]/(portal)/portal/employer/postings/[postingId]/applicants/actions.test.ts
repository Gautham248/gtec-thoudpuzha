// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { application } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  insertEmployer,
  insertJobPosting,
  insertStudentProfile,
  insertUser,
} from "@/__tests__/pg-fixtures";
import { updateApplicationStatus } from "./actions";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

const pg = db as unknown as TestDb;

let applicationId: string;

const signIn = (userId: string, role: string) =>
  mockAuth.mockResolvedValue({ userId, sessionClaims: { metadata: { role } } });

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  await insertUser(pg, { id: "user_emp_1", role: "EMPLOYER" });
  const employer = await insertEmployer(pg, {
    userId: "user_emp_1",
    companyName: "Acme Corp",
  });
  const posting = await insertJobPosting(pg, { employerId: employer.id });
  const candidate = await insertStudentProfile(pg);
  [{ id: applicationId }] = await pg
    .insert(application)
    .values({
      jobPostingId: posting.id,
      candidateProfileId: candidate.id,
      status: "VIEWED",
      statusUpdatedAt: new Date("2026-01-01"),
    })
    .returning({ id: application.id });
  signIn("user_emp_1", "EMPLOYER");
});

const current = async () => (await pg.select().from(application))[0];

describe("updateApplicationStatus", () => {
  test.each(["SHORTLISTED", "REJECTED", "HIRED"] as const)(
    "4/5. employer can move a VIEWED application to %s",
    async (status) => {
      const result = await updateApplicationStatus(applicationId, status);

      expect(result).toEqual({ success: true });
      const app = await current();
      expect(app.status).toBe(status);
      expect(app.statusUpdatedAt.getTime()).toBeGreaterThan(
        new Date("2026-01-01").getTime(),
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/employer");
    },
  );

  test("employer from another company cannot update application", async () => {
    await insertUser(pg, { id: "user_emp_2", role: "EMPLOYER" });
    await insertEmployer(pg, {
      userId: "user_emp_2",
      companyName: "Rival Ltd",
    });
    signIn("user_emp_2", "EMPLOYER");

    const result = await updateApplicationStatus(applicationId, "HIRED");

    expect(result).toEqual({ error: "Forbidden" });
    expect((await current()).status).toBe("VIEWED");
  });

  test("non-employer cannot update status", async () => {
    signIn("user_student_1", "STUDENT");

    const result = await updateApplicationStatus(applicationId, "HIRED");

    expect(result).toEqual({ error: "Forbidden" });
    expect((await current()).status).toBe("VIEWED");
  });

  test("an unknown application is reported, not updated", async () => {
    expect(await updateApplicationStatus("missing", "HIRED")).toEqual({
      error: "Application not found",
    });
  });
});
