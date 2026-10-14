// @vitest-environment node
// The production seed, run against an in-memory Postgres (never a real database).
import { beforeAll, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import * as t from "@/db/schema";
import { type TestDb } from "@/__tests__/pg-test-db";
import { runSeed, type SeedDb } from "./run";
import {
  CATEGORIES,
  CERTIFICATION_PARTNERS,
  COURSES,
  FLASH_NEWS,
  GALLERY_CATEGORIES,
  NEWS_EVENTS,
  SEED_JOB_POSTINGS,
  SKILLS,
  STUDENT_RECORDS,
  WHY_CHOOSE_US_CARDS,
} from "./data";

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;
const seed = () => runSeed(pg as unknown as SeedDb);

async function counts() {
  return {
    categories: await pg.$count(t.courseCategory),
    courses: await pg.$count(t.course),
    partners: await pg.$count(t.certificationPartner),
    galleryCategories: await pg.$count(t.galleryCategory),
    settings: await pg.$count(t.siteSettings),
    whyCards: await pg.$count(t.whyChooseUsCard),
    news: await pg.$count(t.newsEvent),
    flash: await pg.$count(t.flashNewsItem),
    skills: await pg.$count(t.skill),
    students: await pg.$count(t.studentRecord),
    employers: await pg.$count(t.employerProfile),
    postings: await pg.$count(t.jobPosting),
  };
}

describe("runSeed", () => {
  beforeAll(async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    await seed();
  }, 60_000);

  test("creates every seeded record", async () => {
    expect(await counts()).toEqual({
      categories: CATEGORIES.length,
      courses: COURSES.length,
      partners: CERTIFICATION_PARTNERS.length,
      galleryCategories: GALLERY_CATEGORIES.length,
      settings: 1,
      whyCards: WHY_CHOOSE_US_CARDS.length,
      news: NEWS_EVENTS.length,
      flash: FLASH_NEWS.length,
      skills: SKILLS.length,
      students: STUDENT_RECORDS.length,
      employers: 1,
      postings: SEED_JOB_POSTINGS.length,
    });
  });

  test("links courses to their categories and postings to seeded skills", async () => {
    const courses = await pg.query.course.findMany({ with: { category: true } });
    expect(courses.every((c) => c.category !== null)).toBe(true);

    const skillIds = new Set((await pg.select({ id: t.skill.id }).from(t.skill)).map((s) => s.id));
    const postings = await pg.select().from(t.jobPosting);
    expect(postings.every((p) => (p.skillIds ?? []).every((id) => skillIds.has(id)))).toBe(true);
    expect(postings.every((p) => p.applicationDeadline > new Date())).toBe(true);
  });

  test("is idempotent: running it again creates no duplicates", async () => {
    const before = await counts();

    await seed();

    expect(await counts()).toEqual(before);
  }, 60_000);
});
