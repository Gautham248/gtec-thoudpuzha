import { describe, expect, test, vi, beforeEach } from "vitest";
import { enrollStudentInCourses, unenrollStudentFromCourse } from "./actions";
import { db } from "@/db";
import { getInsertedRows } from "@/__tests__/drizzle-mock";

const mockAuth = vi.hoisted(() => vi.fn());
const mockEnrollmentFindMany = vi.hoisted(() => vi.fn());
const mockEnrollmentCreateMany = vi.hoisted(() => vi.fn());
const mockEnrollmentDelete = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockCandidateFindMany = vi.hoisted(() => vi.fn());
const mockCourseFindMany = vi.hoisted(() => vi.fn());
const mockStudentRecordFindMany = vi.hoisted(() => vi.fn());
const mockAuditCreate = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    studentCourseEnrollment: {
      findMany: mockEnrollmentFindMany,
      createMany: mockEnrollmentCreateMany,
      delete: mockEnrollmentDelete,
    },
    candidateProfile: {
      findMany: mockCandidateFindMany,
    },
    course: {
      findMany: mockCourseFindMany,
    },
    studentRecord: {
      findMany: mockStudentRecordFindMany,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    auditLogEntry: {
      create: mockAuditCreate,
    },
  },
}));

const auditEntries = () => getInsertedRows(db, "auditLogEntry");

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

function makeFormData(entries: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        fd.append(key, v);
      }
    } else {
      fd.append(key, value);
    }
  }
  return fd;
}

describe("enrollStudentInCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockEnrollmentFindMany.mockReset();
    mockEnrollmentCreateMany.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("1. Centre Staff can enroll a student in multiple courses in one submission", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockEnrollmentFindMany.mockResolvedValue([]);
    mockEnrollmentCreateMany.mockResolvedValue({ count: 3 });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });

    const fd = makeFormData({
      studentProfileId: "cp_1",
      courseIds: ["c1", "c2", "c3"],
      locale: "en",
    });

    await expect(enrollStudentInCourses(fd)).rejects.toThrow(
      "redirect:/en/admin/students/course-enrollment",
    );

    expect(mockEnrollmentFindMany).toHaveBeenCalledWith({
      where: { studentProfileId: "cp_1", courseId: { in: ["c1", "c2", "c3"] } },
      select: { courseId: true, course: { select: { titleEn: true } } },
    });

    expect(mockEnrollmentCreateMany).toHaveBeenCalledTimes(1);
    expect(mockEnrollmentCreateMany).toHaveBeenCalledWith({
      data: [
        { studentProfileId: "cp_1", courseId: "c1" },
        { studentProfileId: "cp_1", courseId: "c2" },
        { studentProfileId: "cp_1", courseId: "c3" },
      ],
    });

    expect(auditEntries()).toHaveLength(1);
    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "studentCourseEnrollment.enroll",
        entityType: "StudentCourseEnrollment",
        entityId: "cp_1",
      }),
    );

    const auditMeta = auditEntries()[0].metadata as Record<string, unknown>;
    expect(auditMeta.createdCourseIds).toEqual(["c1", "c2", "c3"]);
    expect(auditMeta.skippedCourseIds).toEqual([]);

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/en/admin/students/course-enrollment",
    );
  });

  test("2. already-enrolled courses are skipped gracefully, others still succeed", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockEnrollmentFindMany.mockResolvedValue([
      { courseId: "c2", course: { titleEn: "Course Two" } },
    ]);
    mockEnrollmentCreateMany.mockResolvedValue({ count: 2 });
    mockAuditCreate.mockResolvedValue({ id: "audit_2" });

    const fd = makeFormData({
      studentProfileId: "cp_1",
      courseIds: ["c1", "c2", "c3"],
      locale: "en",
    });

    await expect(enrollStudentInCourses(fd)).rejects.toThrow(
      "redirect:/en/admin/students/course-enrollment",
    );

    expect(mockEnrollmentCreateMany).toHaveBeenCalledWith({
      data: [
        { studentProfileId: "cp_1", courseId: "c1" },
        { studentProfileId: "cp_1", courseId: "c3" },
      ],
    });

    const auditMeta = auditEntries()[0].metadata as Record<string, unknown>;
    expect(auditMeta.createdCourseIds).toEqual(["c1", "c3"]);
    expect(auditMeta.skippedCourseIds).toEqual(["c2"]);
  });

  test("3a. STUDENT role is denied (403) — enroll action", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    const fd = makeFormData({
      studentProfileId: "cp_1",
      courseIds: ["c1"],
      locale: "en",
    });

    await expect(enrollStudentInCourses(fd)).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect(mockEnrollmentCreateMany).not.toHaveBeenCalled();
  });

  test("3b. JOB_SEEKER role is denied (403) — enroll action", async () => {
    mockAuth.mockResolvedValue({
      userId: "jobseeker_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });

    const fd = makeFormData({
      studentProfileId: "cp_1",
      courseIds: ["c1"],
      locale: "en",
    });

    await expect(enrollStudentInCourses(fd)).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect(mockEnrollmentCreateMany).not.toHaveBeenCalled();
  });

  test("3c. EMPLOYER role is denied (403) — enroll action", async () => {
    mockAuth.mockResolvedValue({
      userId: "employer_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    const fd = makeFormData({
      studentProfileId: "cp_1",
      courseIds: ["c1"],
      locale: "en",
    });

    await expect(enrollStudentInCourses(fd)).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect(mockEnrollmentCreateMany).not.toHaveBeenCalled();
  });

  test("3d. STUDENT role is denied (403) — unenroll action", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    const fd = makeFormData({
      enrollmentId: "enc_1",
      studentProfileId: "cp_1",
      locale: "en",
    });

    await expect(unenrollStudentFromCourse(fd)).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect(mockEnrollmentDelete).not.toHaveBeenCalled();
  });

  test("3e. page component redirects STUDENT role", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    const { default: CourseEnrollmentPage } = await import("./page");

    await expect(
      CourseEnrollmentPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("3f. page component redirects JOB_SEEKER role", async () => {
    mockAuth.mockResolvedValue({
      userId: "jobseeker_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });

    const { default: CourseEnrollmentPage } = await import("./page");

    await expect(
      CourseEnrollmentPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("3g. page component redirects EMPLOYER role", async () => {
    mockAuth.mockResolvedValue({
      userId: "employer_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    const { default: CourseEnrollmentPage } = await import("./page");

    await expect(
      CourseEnrollmentPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});

describe("unenrollStudentFromCourse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockEnrollmentDelete.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("4. unenrolling removes the StudentCourseEnrollment row and writes audit", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockEnrollmentDelete.mockResolvedValue({ id: "enc_1" });
    mockAuditCreate.mockResolvedValue({ id: "audit_3" });

    const fd = makeFormData({
      enrollmentId: "enc_1",
      studentProfileId: "cp_1",
      courseTitle: "Course One",
      locale: "en",
    });

    await expect(unenrollStudentFromCourse(fd)).rejects.toThrow(
      "redirect:/en/admin/students/course-enrollment",
    );

    expect(mockEnrollmentDelete).toHaveBeenCalledWith({
      where: { id: "enc_1" },
    });

    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "studentCourseEnrollment.unenroll",
        entityType: "StudentCourseEnrollment",
        entityId: "enc_1",
      }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/en/admin/students/course-enrollment",
    );
  });
});

describe("audit log on enrollment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockEnrollmentFindMany.mockReset();
    mockEnrollmentCreateMany.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
    mockCandidateFindMany.mockReset();
    mockCourseFindMany.mockReset();
    mockEnrollmentDelete.mockReset();
  });

  test("5. enrollment writes a valid audit log entry", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockEnrollmentFindMany.mockResolvedValue([]);
    mockEnrollmentCreateMany.mockResolvedValue({ count: 1 });
    mockAuditCreate.mockResolvedValue({ id: "audit_5" });

    const fd = makeFormData({
      studentProfileId: "cp_1",
      courseIds: ["c1"],
      locale: "en",
    });

    await expect(enrollStudentInCourses(fd)).rejects.toThrow();

    expect(auditEntries()).toHaveLength(1);

    expect(auditEntries()[0]).toMatchObject({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "studentCourseEnrollment.enroll",
      entityType: "StudentCourseEnrollment",
      entityId: "cp_1",
      metadata: { createdCourseIds: ["c1"], skippedCourseIds: [] },
    });
  });
});
