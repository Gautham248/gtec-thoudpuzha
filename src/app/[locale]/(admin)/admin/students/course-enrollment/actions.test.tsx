import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { enrollStudentInCourses, unenrollStudentFromCourse } from "./actions";
import EnrollmentDashboard from "./enrollment-dashboard";
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
const mockRouterPush = vi.hoisted(() => vi.fn());

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
  useRouter: () => ({ push: mockRouterPush }),
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

const stubCourses = [
  { id: "c1", titleEn: "Python Programming" },
  { id: "c2", titleEn: "Data Science" },
  { id: "c3", titleEn: "Web Development" },
];

function makeStudent(
  id: string,
  name: string,
  phone: string,
  studentId: string,
  studentRecordId: string,
  enrollmentRefs: Array<{
    id: string;
    courseId: string;
    course: { id: string; titleEn: string };
  }>,
) {
  return {
    id,
    fullName: name,
    phone,
    studentId,
    studentRecordId,
    enrollments: enrollmentRefs.map((e) => ({
      ...e,
      enrolledAt: new Date("2025-01-15"),
    })),
  };
}

const students = [
  makeStudent("cp1", "Alice Johnson", "9876543210", "GTEC001", "sr1", [
    {
      id: "enc1",
      courseId: "c1",
      course: { id: "c1", titleEn: "Python Programming" },
    },
    {
      id: "enc2",
      courseId: "c2",
      course: { id: "c2", titleEn: "Data Science" },
    },
  ]),
  makeStudent("cp2", "Bob Smith", "9876543211", "GTEC002", "sr2", [
    {
      id: "enc3",
      courseId: "c1",
      course: { id: "c1", titleEn: "Python Programming" },
    },
  ]),
  makeStudent("cp3", "Carol Williams", "9876543212", "GTEC003", "sr3", []),
];

const baseProps = {
  students,
  courses: stubCourses,
  locale: "en",
  selectedStudentProfileId: null,
};

// ─── Component Tests (requirements 1-3) ──────────────────────────

describe("EnrollmentDashboard component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouterPush.mockClear();
  });

  test("1. table renders all students with correct enrollment counts and course names", () => {
    render(<EnrollmentDashboard {...baseProps} />);

    // All 3 student names
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carol Williams").length).toBeGreaterThan(0);

    // Student IDs (human-readable)
    expect(screen.getAllByText("GTEC001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GTEC002").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GTEC003").length).toBeGreaterThan(0);

    // Phones
    expect(screen.getAllByText("9876543210").length).toBeGreaterThan(0);
    expect(screen.getAllByText("9876543211").length).toBeGreaterThan(0);
    expect(screen.getAllByText("9876543212").length).toBeGreaterThan(0);

    // Alice has 2 enrollments: badge "2" and course names
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Python Programming, Data Science").length,
    ).toBeGreaterThan(0);

    // Bob has 1 enrollment: course name appears (also in dropdown, so multiple hits)
    const pythonHits = screen.getAllByText("Python Programming");
    expect(pythonHits.length).toBeGreaterThanOrEqual(2);

    // Carol has 0: "None"
    expect(screen.getAllByText("None").length).toBeGreaterThan(0);
  });

  test("2. course filter narrows the table to only students enrolled in the selected course", () => {
    render(<EnrollmentDashboard {...baseProps} />);

    const select = screen.getByLabelText("Course Filter") as HTMLSelectElement;

    // Select "Python Programming"
    fireEvent.change(select, { target: { value: "c1" } });

    // Alice and Bob (both in Python) should show; Carol should not
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.queryByText("Carol Williams")).toBeNull();

    // Switch to "Data Science"
    fireEvent.change(select, { target: { value: "c2" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bob Smith")).toBeNull();
    expect(screen.queryByText("Carol Williams")).toBeNull();

    // Switch to "Web Development" — no one enrolled
    fireEvent.change(select, { target: { value: "c3" } });
    expect(screen.getByText("No students found.")).toBeTruthy();

    // Back to All
    fireEvent.change(select, { target: { value: "" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carol Williams").length).toBeGreaterThan(0);
  });

  test("3. name / Student-ID search filters the table", () => {
    render(<EnrollmentDashboard {...baseProps} />);

    const input = screen.getByPlaceholderText("Name or Student ID…");

    // Search by name
    fireEvent.change(input, { target: { value: "bob" } });
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.queryByText("Alice Johnson")).toBeNull();
    expect(screen.queryByText("Carol Williams")).toBeNull();

    // Search by Student ID
    fireEvent.change(input, { target: { value: "GTEC003" } });
    expect(screen.getAllByText("Carol Williams").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bob Smith")).toBeNull();

    // Search by partial ID
    fireEvent.change(input, { target: { value: "GTEC00" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carol Williams").length).toBeGreaterThan(0);

    // No match
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No students found.")).toBeTruthy();

    // Clear search — all back
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carol Williams").length).toBeGreaterThan(0);
  });

  test("course filter and search work together", () => {
    render(<EnrollmentDashboard {...baseProps} />);

    const select = screen.getByLabelText("Course Filter") as HTMLSelectElement;
    const input = screen.getByPlaceholderText("Name or Student ID…");

    // Filter to Python course (Alice + Bob)
    fireEvent.change(select, { target: { value: "c1" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);

    // Now search "alice" within Python students
    fireEvent.change(input, { target: { value: "alice" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bob Smith")).toBeNull();
  });
});

// ─── Action Tests (requirements 4-7) ─────────────────────────────

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

  test("4. enrolling in multiple courses in one submission creates the right rows, and re-selecting already-enrolled is skipped", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockEnrollmentFindMany.mockResolvedValue([
      { courseId: "c2", course: { titleEn: "Data Science" } },
    ]);
    mockEnrollmentCreateMany.mockResolvedValue({ count: 2 });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });

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

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/en/admin/students/course-enrollment",
    );
  });

  test("4b. all courses are new — none skipped", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockEnrollmentFindMany.mockResolvedValue([]);
    mockEnrollmentCreateMany.mockResolvedValue({ count: 3 });
    mockAuditCreate.mockResolvedValue({ id: "audit_2" });

    const fd = makeFormData({
      studentProfileId: "cp_1",
      courseIds: ["c1", "c2", "c3"],
      locale: "en",
    });

    await expect(enrollStudentInCourses(fd)).rejects.toThrow();

    expect(mockEnrollmentCreateMany).toHaveBeenCalledWith({
      data: [
        { studentProfileId: "cp_1", courseId: "c1" },
        { studentProfileId: "cp_1", courseId: "c2" },
        { studentProfileId: "cp_1", courseId: "c3" },
      ],
    });

    const auditMeta = auditEntries()[0].metadata as Record<string, unknown>;
    expect(auditMeta.createdCourseIds).toEqual(["c1", "c2", "c3"]);
    expect(auditMeta.skippedCourseIds).toEqual([]);
  });

  test("4c. all courses already enrolled — none created", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockEnrollmentFindMany.mockResolvedValue([
      { courseId: "c1", course: { titleEn: "Python Programming" } },
      { courseId: "c2", course: { titleEn: "Data Science" } },
    ]);
    mockAuditCreate.mockResolvedValue({ id: "audit_3" });

    const fd = makeFormData({
      studentProfileId: "cp_1",
      courseIds: ["c1", "c2"],
      locale: "en",
    });

    await expect(enrollStudentInCourses(fd)).rejects.toThrow("redirect:");

    expect(mockEnrollmentCreateMany).not.toHaveBeenCalled();
  });

  test("6a. STUDENT role is denied (403) — enroll action", async () => {
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

  test("6b. JOB_SEEKER role is denied (403) — enroll action", async () => {
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

  test("6c. EMPLOYER role is denied (403) — enroll action", async () => {
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

  test("5. unenrolling removes the correct StudentCourseEnrollment row and no others", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockEnrollmentDelete.mockResolvedValue({ id: "enc_1" });
    mockAuditCreate.mockResolvedValue({ id: "audit_4" });

    const fd = makeFormData({
      enrollmentId: "enc_1",
      studentProfileId: "cp_1",
      courseTitle: "Python Programming",
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

  test("6d. STUDENT role is denied (403) — unenroll action", async () => {
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

  test("6e. JOB_SEEKER role is denied (403) — unenroll action", async () => {
    mockAuth.mockResolvedValue({
      userId: "jobseeker_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
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

  test("6f. EMPLOYER role is denied (403) — unenroll action", async () => {
    mockAuth.mockResolvedValue({
      userId: "employer_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
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
});

describe("page auth gate (requirement 6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockCandidateFindMany.mockReset();
    mockCourseFindMany.mockReset();
    mockStudentRecordFindMany.mockReset();
    mockUserFindUnique.mockReset();
  });

  test("6g. STUDENT role is denied (403) from the page", async () => {
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

  test("6h. JOB_SEEKER role is denied (403) from the page", async () => {
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

  test("6i. EMPLOYER role is denied (403) from the page", async () => {
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

describe("audit log on enrollment (requirement 7)", () => {
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
    mockStudentRecordFindMany.mockReset();
    mockEnrollmentDelete.mockReset();
  });

  test("7a. enrollment writes a valid audit log entry", async () => {
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

    const auditData = auditEntries()[0];
    expect(auditData.actorUserId).toBe("staff_1");
    expect(auditData.actorRole).toBe("CENTRE_STAFF");
    expect(auditData.action).toBe("studentCourseEnrollment.enroll");
    expect(auditData.entityType).toBe("StudentCourseEnrollment");
    expect(auditData.entityId).toBe("cp_1");
    expect(auditData.metadata.createdCourseIds).toEqual(["c1"]);
    expect(auditData.metadata.skippedCourseIds).toEqual([]);
  });

  test("7b. unenrollment writes a valid audit log entry", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockEnrollmentDelete.mockResolvedValue({ id: "enc_1" });
    mockAuditCreate.mockResolvedValue({ id: "audit_6" });

    const fd = makeFormData({
      enrollmentId: "enc_1",
      studentProfileId: "cp_1",
      courseTitle: "Python Programming",
      locale: "en",
    });

    await expect(unenrollStudentFromCourse(fd)).rejects.toThrow();

    expect(auditEntries()).toHaveLength(1);

    const auditData = auditEntries()[0];
    expect(auditData.actorUserId).toBe("staff_1");
    expect(auditData.actorRole).toBe("CENTRE_STAFF");
    expect(auditData.action).toBe("studentCourseEnrollment.unenroll");
    expect(auditData.entityType).toBe("StudentCourseEnrollment");
    expect(auditData.entityId).toBe("enc_1");
  });
});
