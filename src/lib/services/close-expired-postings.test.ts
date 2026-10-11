// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogEntry, jobPosting } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { daysFromNow, insertJobPosting } from "@/__tests__/pg-fixtures";
import { closeExpiredPostings } from "./close-expired-postings";

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

beforeEach(() => truncateAll(pg));

const statusOf = async (id: string) =>
  (await pg.query.jobPosting.findFirst({ where: eq(jobPosting.id, id) }))!
    .status;

describe("closeExpiredPostings", () => {
  test("transitions expired APPROVED postings to CLOSED and audits each one", async () => {
    const expired = await insertJobPosting(pg, {
      title: "Software Engineer",
      applicationDeadline: daysFromNow(-1),
    });

    const result = await closeExpiredPostings();

    expect(result).toEqual({ closed: 1 });
    const after = await pg.query.jobPosting.findFirst({
      where: eq(jobPosting.id, expired.id),
    });
    expect(after!.status).toBe("CLOSED");
    expect(after!.updatedAt.getTime()).toBeGreaterThanOrEqual(
      expired.updatedAt.getTime(),
    );

    const audits = await pg.select().from(auditLogEntry);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorUserId: null,
      actorRole: null,
      action: "VACANCY_AUTO_CLOSE",
      entityType: "JobPosting",
      entityId: expired.id,
      metadata: {
        title: "Software Engineer",
        employerId: expired.employerId,
        deadline: expired.applicationDeadline.toISOString(),
      },
    });
  });

  test("does not close postings with future deadline", async () => {
    const open = await insertJobPosting(pg, {
      applicationDeadline: daysFromNow(1),
    });

    const result = await closeExpiredPostings();

    expect(result).toEqual({ closed: 0 });
    expect(await statusOf(open.id)).toBe("APPROVED");
    expect(await pg.select().from(auditLogEntry)).toHaveLength(0);
  });

  test("is idempotent — second run does not error or create duplicate logs", async () => {
    await insertJobPosting(pg, { applicationDeadline: daysFromNow(-1) });

    expect(await closeExpiredPostings()).toEqual({ closed: 1 });
    expect(await closeExpiredPostings()).toEqual({ closed: 0 });

    expect(await pg.select().from(auditLogEntry)).toHaveLength(1);
  });

  test("excludes soft-deleted and non-APPROVED postings even if deadline passed", async () => {
    const deleted = await insertJobPosting(pg, {
      applicationDeadline: daysFromNow(-1),
      deletedAt: daysFromNow(-2),
    });
    const pending = await insertJobPosting(pg, {
      applicationDeadline: daysFromNow(-1),
      status: "PENDING",
    });

    const result = await closeExpiredPostings();

    expect(result).toEqual({ closed: 0 });
    expect(await statusOf(deleted.id)).toBe("APPROVED");
    expect(await statusOf(pending.id)).toBe("PENDING");
  });

  test("closes only the expired postings in a mixed batch", async () => {
    const a = await insertJobPosting(pg, {
      applicationDeadline: daysFromNow(-3),
    });
    const b = await insertJobPosting(pg, {
      applicationDeadline: daysFromNow(-1),
    });
    const c = await insertJobPosting(pg, {
      applicationDeadline: daysFromNow(2),
    });

    expect(await closeExpiredPostings()).toEqual({ closed: 2 });
    expect([
      await statusOf(a.id),
      await statusOf(b.id),
      await statusOf(c.id),
    ]).toEqual(["CLOSED", "CLOSED", "APPROVED"]);
  });
});
