// @vitest-environment node
// Enroll / unenroll actions and the page's role gate, against an in-memory
// Postgres. The EnrollmentDashboard UI is covered in actions.test.tsx.
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { auditLogEntry, studentCourseEnrollment } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  form,
  insertCourse,
  insertStudentProfile,
  session,
} from "@/__tests__/pg-fixtures";
import { enrollStudentInCourses, unenrollStudentFromCourse } from "./actions";
import CourseEnrollmentPage from "./page";

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
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

const pg = db as unknown as TestDb;

let studentId: string;
let c1: string, c2: string, c3: string;

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
  studentId = (await insertStudentProfile(pg, { isVerifiedStudent: true })).id;
  c1 = (await insertCourse(pg, { titleEn: "Python Programming" })).id;
  c2 = (await insertCourse(pg, { titleEn: "Data Science" })).id;
  c3 = (await insertCourse(pg, { titleEn: "Web Development" })).id;
});

const enrolledCourseIds = async (profileId = studentId) =>
  (await pg.select().from(studentCourseEnrollment))
    .filter((e) => e.studentProfileId === profileId)
    .map((e) => e.courseId)
    .sort();
const audits = () => pg.select().from(auditLogEntry);
const enroll = (courseIds: string[]) =>
  enrollStudentInCourses(
    form({ studentProfileId: studentId, courseIds, locale: "en" }),
  );

describe("enrollStudentInCourses", () => {
  test("1. Centre Staff can enroll a student in multiple courses in one submission", async () => {
    await expect(enroll([c1, c2, c3])).rejects.toThrow(
      `redirect:/en/admin/students/course-enrollment?studentProfileId=${studentId}&created=3&skipped=0&skippedCourses=`,
    );

    expect(await enrolledCourseIds()).toEqual([c1, c2, c3].sort());
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/en/admin/students/course-enrollment",
    );
  });

  test("2. already-enrolled courses are skipped gracefully, others still succeed", async () => {
    await pg
      .insert(studentCourseEnrollment)
      .values({ studentProfileId: studentId, courseId: c2 });

    await expect(enroll([c1, c2, c3])).rejects.toThrow(
      "&created=2&skipped=1&skippedCourses=Data%20Science",
    );

    expect(await enrolledCourseIds()).toEqual([c1, c2, c3].sort());
    const [audit] = await audits();
    expect(audit.metadata).toEqual({
      createdCourseIds: [c1, c3],
      skippedCourseIds: [c2],
    });
  });

  test("all courses already enrolled — none created", async () => {
    await pg.insert(studentCourseEnrollment).values([
      { studentProfileId: studentId, courseId: c1 },
      { studentProfileId: studentId, courseId: c2 },
    ]);

    await expect(enroll([c1, c2])).rejects.toThrow("&created=0&skipped=2");
    expect(await enrolledCourseIds()).toEqual([c1, c2].sort());
  });

  test("5. enrollment writes a valid audit log entry", async () => {
    await expect(enroll([c1])).rejects.toThrow("redirect:");

    expect(await audits()).toEqual([
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "studentCourseEnrollment.enroll",
        entityType: "StudentCourseEnrollment",
        entityId: studentId,
        metadata: { createdCourseIds: [c1], skippedCourseIds: [] },
      }),
    ]);
  });

  test("requires a student and at least one course", async () => {
    await expect(
      enrollStudentInCourses(
        form({ studentProfileId: studentId, locale: "en" }),
      ),
    ).rejects.toThrow(
      "studentProfileId and at least one courseIds is required",
    );
  });
});

describe("unenrollStudentFromCourse", () => {
  test("4. unenrolling removes only that StudentCourseEnrollment row and writes audit", async () => {
    const other = await insertStudentProfile(pg);
    const [keep, remove] = await pg
      .insert(studentCourseEnrollment)
      .values([
        { studentProfileId: studentId, courseId: c1 },
        { studentProfileId: studentId, courseId: c2 },
        { studentProfileId: other.id, courseId: c2 },
      ])
      .returning();

    await expect(
      unenrollStudentFromCourse(
        form({
          enrollmentId: remove.id,
          studentProfileId: studentId,
          courseTitle: "Data Science",
          locale: "en",
        }),
      ),
    ).rejects.toThrow("&unenrolled=true&unenrolledCourse=Data%20Science");

    expect(await enrolledCourseIds()).toEqual([keep.courseId]);
    expect(await enrolledCourseIds(other.id)).toEqual([c2]);
    expect(await audits()).toEqual([
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "studentCourseEnrollment.unenroll",
        entityType: "StudentCourseEnrollment",
        entityId: remove.id,
        metadata: { studentProfileId: studentId, courseTitle: "Data Science" },
      }),
    ]);
  });

  test("unenrolling a missing enrollment fails without auditing", async () => {
    await expect(
      unenrollStudentFromCourse(
        form({
          enrollmentId: "missing",
          studentProfileId: studentId,
          locale: "en",
        }),
      ),
    ).rejects.toThrow("Enrollment not found");
    expect(await audits()).toHaveLength(0);
  });
});

describe("role gate", () => {
  test.each(["STUDENT", "JOB_SEEKER", "EMPLOYER"])(
    "%s is denied (403) — enroll action",
    async (role) => {
      mockAuth.mockResolvedValue(session("someone", role));

      await expect(enroll([c1])).rejects.toThrow("redirect:/en/forbidden");
      expect(await enrolledCourseIds()).toEqual([]);
    },
  );

  test.each(["STUDENT", "JOB_SEEKER", "EMPLOYER"])(
    "%s is denied (403) — unenroll action",
    async (role) => {
      const [enrollment] = await pg
        .insert(studentCourseEnrollment)
        .values({ studentProfileId: studentId, courseId: c1 })
        .returning();
      mockAuth.mockResolvedValue(session("someone", role));

      await expect(
        unenrollStudentFromCourse(
          form({
            enrollmentId: enrollment.id,
            studentProfileId: studentId,
            locale: "en",
          }),
        ),
      ).rejects.toThrow("redirect:/en/forbidden");
      expect(await enrolledCourseIds()).toEqual([c1]);
    },
  );

  test.each(["STUDENT", "JOB_SEEKER", "EMPLOYER"])(
    "%s is redirected from the page",
    async (role) => {
      mockAuth.mockResolvedValue(session("someone", role));

      await expect(
        CourseEnrollmentPage({
          params: Promise.resolve({ locale: "en" }),
          searchParams: Promise.resolve({}),
        }),
      ).rejects.toThrow("redirect:/en/forbidden");
    },
  );
});
