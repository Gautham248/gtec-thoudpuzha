// @vitest-environment node
// The (jobPostingId, candidateProfileId) unique constraint on Application,
// checked against an in-memory Postgres (never the real database).
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { application } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  insertJobPosting,
  insertStudentProfile,
} from "@/__tests__/pg-fixtures";

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

beforeEach(() => truncateAll(pg));

describe("Application DB-level unique constraint", () => {
  test("1. prevents duplicate Application on the same (candidateProfileId, jobPostingId)", async () => {
    const posting = await insertJobPosting(pg);
    const candidate = await insertStudentProfile(pg);

    const [first] = await pg
      .insert(application)
      .values({ jobPostingId: posting.id, candidateProfileId: candidate.id })
      .returning();
    expect(first.id).toBeTruthy();
    expect(first.status).toBe("APPLIED");
    expect(first.appliedAt).toBeInstanceOf(Date);

    await expect(
      pg
        .insert(application)
        .values({ jobPostingId: posting.id, candidateProfileId: candidate.id }),
    ).rejects.toThrow();
    expect(await pg.$count(application)).toBe(1);
  });

  test("the same candidate may apply to different postings", async () => {
    const candidate = await insertStudentProfile(pg);
    const a = await insertJobPosting(pg);
    const b = await insertJobPosting(pg);

    await pg.insert(application).values([
      { jobPostingId: a.id, candidateProfileId: candidate.id },
      { jobPostingId: b.id, candidateProfileId: candidate.id },
    ]);

    expect(await pg.$count(application)).toBe(2);
  });
});
