// Insert helpers for pg-test-db: valid rows with sensible defaults, so a test
// only spells out the fields it is actually about.

import * as t from "@/db/schema";
import type { TestDb } from "./pg-test-db";

type Insert<T extends { $inferInsert: unknown }> = Partial<T["$inferInsert"]>;

const DAY = 24 * 60 * 60 * 1000;
export const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

let seq = 0;
const next = (prefix: string) => `${prefix}_${++seq}`;

export async function insertUser(
  db: TestDb,
  values: Insert<typeof t.user> = {},
) {
  const [row] = await db
    .insert(t.user)
    .values({ id: next("user"), role: "STUDENT", ...values })
    .returning();
  return row;
}

export async function insertEmployer(
  db: TestDb,
  values: Insert<typeof t.employerProfile> = {},
) {
  const userId =
    values.userId ?? (await insertUser(db, { role: "EMPLOYER" })).id;
  const [row] = await db
    .insert(t.employerProfile)
    .values({
      companyName: "Tech Corp",
      industrySector: "IT_SOFTWARE",
      contactPersonName: "Contact",
      designation: "HR",
      phone: "9876543210",
      email: "hr@example.com",
      companyAddress: "Kochi, Kerala",
      employeeCountRange: "RANGE_11_50",
      aboutCompany: "About",
      status: "APPROVED",
      ...values,
      userId,
    })
    .returning();
  return row;
}

export async function insertJobPosting(
  db: TestDb,
  values: Insert<typeof t.jobPosting> = {},
) {
  const employerId = values.employerId ?? (await insertEmployer(db)).id;
  const [row] = await db
    .insert(t.jobPosting)
    .values({
      title: "Software Engineer",
      jobType: "FULL_TIME",
      applicationDeadline: daysFromNow(30),
      description: "A great job",
      status: "APPROVED",
      ...values,
      employerId,
    })
    .returning();
  return row;
}

export async function insertCourse(
  db: TestDb,
  values: Insert<typeof t.course> = {},
) {
  const slug = values.slug ?? next("course");
  const [row] = await db
    .insert(t.course)
    .values({ titleEn: slug, status: "PUBLISHED", ...values, slug })
    .returning();
  return row;
}

export async function insertCategory(
  db: TestDb,
  values: Insert<typeof t.courseCategory> = {},
) {
  const [row] = await db
    .insert(t.courseCategory)
    .values({ nameEn: next("Category"), ...values })
    .returning();
  return row;
}

export async function insertGalleryCategory(
  db: TestDb,
  values: Insert<typeof t.galleryCategory> = {},
) {
  const slug = values.slug ?? next("gallery");
  const [row] = await db
    .insert(t.galleryCategory)
    .values({ nameEn: slug, ...values, slug })
    .returning();
  return row;
}

export async function insertSiteSettings(
  db: TestDb,
  values: Insert<typeof t.siteSettings> = {},
  cards: Insert<typeof t.whyChooseUsCard>[] = [],
) {
  const [settings] = await db.insert(t.siteSettings).values(values).returning();
  if (cards.length) {
    await db.insert(t.whyChooseUsCard).values(
      cards.map((c, i) => ({
        titleEn: `Card ${i}`,
        descriptionEn: `Description ${i}`,
        icon: "AWARD" as const,
        sortOrder: i,
        ...c,
        siteSettingsId: settings.id,
      })),
    );
  }
  return settings;
}

export async function insertStudentProfile(
  db: TestDb,
  values: Insert<typeof t.candidateProfile> = {},
) {
  const userId = values.userId ?? (await insertUser(db)).id;
  const [row] = await db
    .insert(t.candidateProfile)
    .values({ fullName: "Student", ...values, userId })
    .returning();
  return row;
}

/** FormData from a plain object (arrays become repeated fields). */
export function form(
  fields: Record<string, string | File | (string | File)[]>,
) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of [value].flat()) fd.append(key, v);
  }
  return fd;
}

/** Clerk `auth()` result for a signed-in user with a role claim. */
export function session(userId: string, role: string) {
  return { userId, sessionClaims: { metadata: { role } } };
}
