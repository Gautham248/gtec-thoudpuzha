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
