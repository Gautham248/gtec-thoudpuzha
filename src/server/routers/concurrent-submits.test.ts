// @vitest-environment node
// Double-clicks and retries: two identical requests at once must leave one row
// and give the second caller the friendly outcome, never a constraint error.
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import {
  application,
  employerProfile,
  galleryCategory,
  studentCourseEnrollment,
  studentRecord,
} from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  insertCourse,
  insertJobPosting,
  insertStaff,
  insertStudentProfile,
  insertUser,
  session,
} from "@/__tests__/pg-fixtures";
import { api } from "@/server/action";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@/lib/role-fallback", () => ({ fetchRoleFromApi: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("@/lib/rate-limiter", () => ({
  getClientIp: vi.fn(async () => "127.0.0.1"),
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}));

const pg = db as unknown as TestDb;

/** Both outcomes of two simultaneous calls, as values or error messages. */
async function twice<T>(call: () => Promise<T>) {
  const settled = await Promise.allSettled([call(), call()]);
  return settled.map((s) =>
    s.status === "fulfilled"
      ? s.value
      : `throws: ${(s.reason as Error).message}`,
  );
}

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
});

describe("concurrent identical submits", () => {
  test("applyToJob: one application, the other caller is told ALREADY_APPLIED", async () => {
    await insertUser(pg, { id: "user_1", role: "JOB_SEEKER" });
    await insertStudentProfile(pg, {
      userId: "user_1",
      fullName: "John Doe",
      dateOfBirth: new Date("2000-01-01"),
      phone: "9999999999",
      email: "john@example.com",
      educationalQualification: "GRADUATE",
      yearOfPassing: 2022,
      address: "Test",
      languagesKnown: ["English"],
      preferredJobLocation: "Kochi",
      preferredJobType: "FULL_TIME",
    });
    const posting = await insertJobPosting(pg);
    mockAuth.mockResolvedValue(session("user_1", "JOB_SEEKER"));

    const results = await twice(() =>
      api().portal.jobs.applyToJob({ jobPostingId: posting.id }),
    );

    expect(results).toEqual(
      expect.arrayContaining([{ applied: true }, { error: "ALREADY_APPLIED" }]),
    );
    expect(await pg.$count(application)).toBe(1);
  });

  test("enroll: courses enrolled once, the other request reports them skipped", async () => {
    await insertStaff(pg, "staff_1");
    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
    await insertUser(pg, { id: "student_1", role: "STUDENT" });
    const profile = await insertStudentProfile(pg, { userId: "student_1" });
    const a = await insertCourse(pg, { titleEn: "Course A" });
    const b = await insertCourse(pg, { titleEn: "Course B" });

    const results = await twice(() =>
      api().admin.courseEnrollment.enroll({
        studentProfileId: profile.id,
        courseIds: [a.id, b.id],
      }),
    );

    expect(await pg.$count(studentCourseEnrollment)).toBe(2);
    const redirects = results.map(String).sort();
    expect(redirects[0]).toMatch(
      /created=0&skipped=2&skippedCourses=Course%20/,
    );
    expect(redirects[1]).toMatch(/created=2&skipped=0/);
  });

  test("students.create: one record, the other caller gets 'already exists'", async () => {
    await insertStaff(pg, "staff_1");
    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
    const input = {
      studentId: "GTEC900",
      fullName: "Asha",
      phone: "9876543210",
      email: "asha@example.com",
    };

    const results = await twice(() => api().admin.students.create(input));

    expect(results).toEqual(
      expect.arrayContaining([
        undefined,
        'throws: Student ID "GTEC900" already exists',
      ]),
    );
    expect(await pg.$count(studentRecord)).toBe(1);
  });

  test("students.bulkImport: each student imported once, the other run reports duplicates", async () => {
    await insertStaff(pg, "staff_1");
    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
    const csv = "GTEC901,Asha,9876543210,asha@example.com";

    const results = (await twice(() =>
      api().admin.students.bulkImport({ csv }),
    )) as { success: boolean; error?: string }[][];

    expect(results.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ success: true }),
        expect.objectContaining({
          success: false,
          error: 'Duplicate studentId "GTEC901"',
        }),
      ]),
    );
    expect(await pg.$count(studentRecord)).toBe(1);
  });

  test("gallery.createCategory: both categories created with distinct slugs", async () => {
    await insertStaff(pg, "staff_1");
    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));

    const results = await twice(() =>
      api().admin.gallery.createCategory({ nameEn: "Campus Life" }),
    );

    expect(results).toEqual([undefined, undefined]);
    const slugs = (await pg.select().from(galleryCategory)).map((c) => c.slug);
    expect(slugs).toHaveLength(2);
    expect(new Set(slugs).size).toBe(2);
    expect(slugs).toContain("campus-life");
  });

  test("employer.register: one profile, both callers land on the status page", async () => {
    await insertUser(pg, { id: "emp_1", role: "EMPLOYER" });
    mockAuth.mockResolvedValue(session("emp_1", "EMPLOYER"));
    const input = {
      companyName: "Acme",
      industrySector: "IT_SOFTWARE",
      contactPersonName: "Ravi",
      designation: "HR",
      phone: "9876543210",
      email: "hr@acme.com",
      companyAddress: "Thodupuzha",
      hasWebsite: "no",
      employeeCountRange: "RANGE_1_10",
      aboutCompany: "We hire.",
    };

    const results = await twice(() => api().portal.employer.register(input));

    expect(results).toEqual([
      "throws: redirect:/portal/employer/register/status",
      "throws: redirect:/portal/employer/register/status",
    ]);
    expect(await pg.$count(employerProfile)).toBe(1);
  });
});
