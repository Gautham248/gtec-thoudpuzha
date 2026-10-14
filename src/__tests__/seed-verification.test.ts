/**
 * Seed verification tests — run against a seeded staging/production database.
 *
 * These tests are gated behind SEED_VERIFICATION=true to avoid failing in normal
 * dev/CI where no seed data is present in the database.
 *
 * To run: SEED_VERIFICATION=true DATABASE_URL=<staging-db-url> npm run test
 *
 * Without SEED_VERIFICATION, only data-integrity checks (unique slugs, non-empty
 * arrays, etc.) and placeholder-content detection patterns are verified.
 */
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { and, count, eq, gt, isNull, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as t from "@/db/schema";
import * as relations from "@/db/relations";
import {
  COURSES,
  CERTIFICATION_PARTNERS,
  CATEGORIES,
  GALLERY_CATEGORIES,
  NEWS_EVENTS,
  FLASH_NEWS,
  GALLERY_ITEMS,
  PLACEMENT_SUPPORT_GALLERY_ITEMS,
  SKILLS,
  STUDENT_RECORDS,
  SEED_JOB_POSTINGS,
} from "@/db/seed/data";

/* ─── Placeholder detection patterns ─── */

const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /coming soon/i,
  /placeholder/i,
  /test course/i,
  /test item/i,
  /tbd/i,
  /todo/i,
  /sample/i,
];

function isPlaceholder(text: string | null | undefined): boolean {
  if (!text) return false;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(text));
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ─── Data-integrity checks (no DB needed) ─── */

describe("Seed data integrity (no DB required)", () => {
  test("Seed data courses array has unique slugs", () => {
    const slugs = COURSES.map((c) => slugFromName(c.titleEn));
    const unique = new Set(slugs);
    expect(slugs.length).toBe(unique.size);
  });

  test("Seed data courses all have PUBLISHED status", () => {
    const unpublished = COURSES.filter((c) => c.status !== "PUBLISHED");
    expect(unpublished).toHaveLength(0);
  });

  test("Seed data partners array has unique names", () => {
    const names = CERTIFICATION_PARTNERS.map((p) => p.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  });

  test("Seed data news events have unique slugs", () => {
    const slugs = NEWS_EVENTS.map((n) => n.slug);
    const unique = new Set(slugs);
    expect(slugs.length).toBe(unique.size);
  });

  test("All seed data arrays are non-empty", () => {
    expect(COURSES.length).toBeGreaterThan(0);
    expect(CERTIFICATION_PARTNERS.length).toBeGreaterThan(0);
    expect(CATEGORIES.length).toBeGreaterThan(0);
    expect(GALLERY_CATEGORIES.length).toBeGreaterThan(0);
    expect(NEWS_EVENTS.length).toBeGreaterThan(0);
    expect(FLASH_NEWS.length).toBeGreaterThan(0);
    expect(GALLERY_ITEMS.length).toBeGreaterThan(0);
    expect(PLACEMENT_SUPPORT_GALLERY_ITEMS.length).toBeGreaterThan(0);
    expect(SKILLS.length).toBeGreaterThan(0);
    expect(STUDENT_RECORDS.length).toBeGreaterThan(0);
    expect(SEED_JOB_POSTINGS.length).toBeGreaterThan(0);
  });
});

/* ─── DB-backed verification (gated by SEED_VERIFICATION=true) ─── */

const shouldVerifySeed =
  process.env.SEED_VERIFICATION === "true" && !!process.env.DATABASE_URL;

describe.skipIf(!shouldVerifySeed)(
  "Seed verification — set SEED_VERIFICATION=true + DATABASE_URL",
  () => {
    // Read-only checks. A direct connection, because "@/db" is mocked in tests.
    let pool: pg.Pool;
    let db: NodePgDatabase<typeof t & typeof relations>;

    const countOf = async (table: PgTable, where?: SQL) =>
      (await db.select({ n: count() }).from(table).where(where))[0].n;

    beforeAll(() => {
      pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
      db = drizzle(pool, { schema: { ...t, ...relations } });
    });

    afterAll(async () => {
      await pool?.end();
    });

    test("1. Course catalog record count matches seed data count", async () => {
      expect(await countOf(t.course)).toBe(COURSES.length);
    });

    test("1b. Course categories count matches seed data", async () => {
      expect(await countOf(t.courseCategory)).toBe(CATEGORIES.length);
    });

    test("1c. Certification partners count matches seed data", async () => {
      expect(await countOf(t.certificationPartner)).toBe(
        CERTIFICATION_PARTNERS.length,
      );
    });

    test("1d. Gallery categories count matches seed data", async () => {
      expect(await countOf(t.galleryCategory)).toBe(GALLERY_CATEGORIES.length);
    });

    test("1e. News & events count matches seed data", async () => {
      expect(await countOf(t.newsEvent)).toBe(NEWS_EVENTS.length);
    });

    test("1f. Published courses match expected slugs", async () => {
      const expectedSlugs = COURSES.map((c) => slugFromName(c.titleEn)).sort();
      const slugs = (
        await db.query.course.findMany({
          columns: { slug: true },
          orderBy: (c, { asc }) => asc(c.slug),
        })
      ).map((r) => r.slug);
      expect(slugs.sort()).toEqual(expectedSlugs);
    });

    test("2. No StudentRecord has a duplicate studentId", async () => {
      const records = await db.query.studentRecord.findMany({
        columns: { studentId: true },
      });
      const ids = records.map((r) => r.studentId);
      expect(ids.length).toBe(new Set(ids).size);
    });

    test("3a. No Course has a placeholder title", async () => {
      const courses = await db.query.course.findMany({
        columns: { titleEn: true, slug: true },
      });
      expect(courses.filter((c) => isPlaceholder(c.titleEn))).toHaveLength(0);
    });

    test("3b. No NewsEvent has a placeholder title", async () => {
      const items = await db.query.newsEvent.findMany({
        columns: { titleEn: true, slug: true },
      });
      expect(items.filter((i) => isPlaceholder(i.titleEn))).toHaveLength(0);
    });

    test("3c. No GalleryItem has a placeholder caption", async () => {
      const items = await db.query.galleryItem.findMany({
        columns: { captionEn: true },
      });
      const offenders = items.filter(
        (i) => i.captionEn && isPlaceholder(i.captionEn),
      );
      expect(offenders).toHaveLength(0);
    });

    test("4. Sample StudentRecord exists with valid fields for Sprint 4 flow", async () => {
      expect(await countOf(t.studentRecord)).toBeGreaterThan(0);

      const sample = await db.query.studentRecord.findFirst({
        columns: { studentId: true, fullName: true, phone: true },
      });
      expect(sample!.studentId).toBeTruthy();
      expect(sample!.fullName).toBeTruthy();
      expect(sample!.phone).toBeTruthy();
      expect(sample!.phone).toMatch(/^\+?91?\d{10}$/);
    });

    test("5a. Flash news count matches seed data", async () => {
      expect(await countOf(t.flashNewsItem)).toBeGreaterThanOrEqual(
        FLASH_NEWS.length,
      );
    });

    test("5b. Skills count matches seed data", async () => {
      expect(await countOf(t.skill)).toBeGreaterThanOrEqual(SKILLS.length);
    });

    test("5c. Gallery items exist across categories", async () => {
      const expectedItemCount =
        GALLERY_ITEMS.length + PLACEMENT_SUPPORT_GALLERY_ITEMS.length;
      expect(await countOf(t.galleryItem)).toBeGreaterThanOrEqual(
        expectedItemCount,
      );
    });

    test("5d. Seed employer and job postings exist", async () => {
      const employer = await db.query.employerProfile.findFirst({
        where: (e, { eq }) => eq(e.status, "APPROVED"),
      });
      expect(employer).toBeTruthy();

      const approvedJobs = await countOf(
        t.jobPosting,
        and(
          eq(t.jobPosting.status, "APPROVED"),
          isNull(t.jobPosting.deletedAt),
          gt(t.jobPosting.applicationDeadline, new Date()),
        ),
      );
      expect(approvedJobs).toBeGreaterThan(0);
    });
  },
);
