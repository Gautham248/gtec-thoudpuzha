// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  daysFromNow,
  insertEmployer,
  insertJobPosting,
} from "@/__tests__/pg-fixtures";
import { getActiveJobPostings, getJobDetail } from "./jobs";

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

beforeEach(() => truncateAll(pg));

describe("getActiveJobPostings", () => {
  test("excludes PENDING, REJECTED, CLOSED, and soft-deleted postings", async () => {
    const live = await insertJobPosting(pg, { status: "APPROVED" });
    await insertJobPosting(pg, { status: "PENDING" });
    await insertJobPosting(pg, { status: "REJECTED" });
    await insertJobPosting(pg, { status: "CLOSED" });
    await insertJobPosting(pg, {
      status: "APPROVED",
      deletedAt: daysFromNow(-1),
    });

    const results = await getActiveJobPostings();

    expect(results.map((r) => r.id)).toEqual([live.id]);
  });

  test("excludes postings past their applicationDeadline", async () => {
    const open = await insertJobPosting(pg, {
      applicationDeadline: daysFromNow(1),
    });
    await insertJobPosting(pg, { applicationDeadline: daysFromNow(-1) });

    const results = await getActiveJobPostings();

    expect(results.map((r) => r.id)).toEqual([open.id]);
  });

  test("filters by job type correctly", async () => {
    const partTime = await insertJobPosting(pg, { jobType: "PART_TIME" });
    await insertJobPosting(pg, { jobType: "FULL_TIME" });

    const results = await getActiveJobPostings({ jobType: "PART_TIME" });

    expect(results.map((r) => r.id)).toEqual([partTime.id]);
  });

  test("filters by skill id correctly", async () => {
    const withSkill = await insertJobPosting(pg, {
      skillIds: ["skill_1", "skill_2"],
    });
    await insertJobPosting(pg, { skillIds: ["skill_3"] });
    await insertJobPosting(pg, { skillIds: [] });

    const results = await getActiveJobPostings({ skillId: "skill_2" });

    expect(results.map((r) => r.id)).toEqual([withSkill.id]);
  });

  test("filters by location (case-insensitive match on employer address)", async () => {
    const kochiEmployer = await insertEmployer(pg, {
      companyAddress: "Kochi, Kerala",
    });
    const blrEmployer = await insertEmployer(pg, {
      companyAddress: "Bangalore, Karnataka",
    });
    const kochi = await insertJobPosting(pg, { employerId: kochiEmployer.id });
    await insertJobPosting(pg, { employerId: blrEmployer.id });

    const results = await getActiveJobPostings({ location: "KOCHI" });

    expect(results.map((r) => r.id)).toEqual([kochi.id]);
    expect(results[0].employer).toEqual({
      companyName: "Tech Corp",
      companyAddress: "Kochi, Kerala",
    });
  });

  test("returns newest postings first", async () => {
    const older = await insertJobPosting(pg, { createdAt: daysFromNow(-5) });
    const newer = await insertJobPosting(pg, { createdAt: daysFromNow(-1) });

    const results = await getActiveJobPostings();

    expect(results.map((r) => r.id)).toEqual([newer.id, older.id]);
  });

  test("PRIVATE-salary posting indicates 'disclosed at interview' label", async () => {
    await insertJobPosting(pg, {
      salaryVisibility: "PRIVATE",
      salaryMin: null,
      salaryMax: null,
    });

    const [posting] = await getActiveJobPostings();

    expect(posting.salaryVisibility).toBe("PRIVATE");
    // The render-time label is determined by salaryVisibility === "DISCLOSE"
    const label =
      posting.salaryVisibility === "DISCLOSE"
        ? "Salary disclosed"
        : "Salary: disclosed at interview";
    expect(label).toBe("Salary: disclosed at interview");
  });
});

describe("getJobDetail", () => {
  test("returns an active posting with its employer details", async () => {
    const employer = await insertEmployer(pg, { companyName: "Acme" });
    const posting = await insertJobPosting(pg, {
      employerId: employer.id,
      title: "Dev",
    });

    const detail = await getJobDetail(posting.id);

    expect(detail?.title).toBe("Dev");
    expect(detail?.employer).toEqual({
      companyName: "Acme",
      companyAddress: "Kochi, Kerala",
      industrySector: "IT_SOFTWARE",
      employeeCountRange: "RANGE_11_50",
      aboutCompany: "About",
    });
  });

  test("returns null for expired, unapproved, deleted or unknown postings", async () => {
    const expired = await insertJobPosting(pg, {
      applicationDeadline: daysFromNow(-1),
    });
    const pending = await insertJobPosting(pg, { status: "PENDING" });
    const deleted = await insertJobPosting(pg, { deletedAt: daysFromNow(-1) });

    for (const id of [expired.id, pending.id, deleted.id, "missing"]) {
      expect(await getJobDetail(id)).toBeNull();
    }
  });
});
