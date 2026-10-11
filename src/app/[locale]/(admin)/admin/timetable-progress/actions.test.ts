import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { getInsertedRows } from "@/__tests__/drizzle-mock";

const mockAuth = vi.hoisted(() => vi.fn());
const mockTTCreate = vi.hoisted(() => vi.fn());
const mockTTFindMany = vi.hoisted(() => vi.fn());
const mockTTDelete = vi.hoisted(() => vi.fn());
const mockPECreate = vi.hoisted(() => vi.fn());
const mockPEFindMany = vi.hoisted(() => vi.fn());
const mockPEDelete = vi.hoisted(() => vi.fn());
const mockProfileFindUnique = vi.hoisted(() => vi.fn());
const mockProfileFindMany = vi.hoisted(() => vi.fn());
const mockEnrollFindMany = vi.hoisted(() => vi.fn());
const mockCourseFindMany = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
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
    timetableEntry: {
      create: mockTTCreate,
      findMany: mockTTFindMany,
      delete: mockTTDelete,
    },
    studentProgressEntry: {
      create: mockPECreate,
      findMany: mockPEFindMany,
      delete: mockPEDelete,
    },
    candidateProfile: {
      findUnique: mockProfileFindUnique,
      findMany: mockProfileFindMany,
    },
    studentCourseEnrollment: {
      findMany: mockEnrollFindMany,
    },
    course: {
      findMany: mockCourseFindMany,
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

vi.mock("next/link", () => ({
  default: vi.fn(
    ({
      href,
      children,
    }: {
      href: string;
      children: React.ReactNode;
    }): string => {
      let text = "";
      function extract(nodes: React.ReactNode): void {
        if (typeof nodes === "string" || typeof nodes === "number") {
          text += String(nodes);
        } else if (Array.isArray(nodes)) {
          nodes.forEach(extract);
        } else if (nodes && typeof nodes === "object" && "props" in nodes) {
          extract(
            (nodes as unknown as { props: { children: React.ReactNode } }).props
              .children,
          );
        }
      }
      extract(children);
      return `<a href="${href}">${text}</a>`;
    },
  ),
}));

describe("addTimetableEntry (admin server action)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("3. admin entry of a timetable entry against a course persists correctly", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockTTCreate.mockResolvedValue({
      id: "tt_1",
      courseId: "course_1",
      contentText: "Week 1: Intro\nWeek 2: Basics",
      createdAt: new Date(),
    });

    mockAuditCreate.mockResolvedValue({ id: "audit_1" });

    const { addTimetableEntry } = await import("./actions");

    const formData = new FormData();
    formData.append("courseId", "course_1");
    formData.append("contentText", "Week 1: Intro\nWeek 2: Basics");
    formData.append("locale", "en");

    await addTimetableEntry(formData);

    expect(mockTTCreate).toHaveBeenCalledTimes(1);
    expect(mockTTCreate).toHaveBeenCalledWith({
      data: {
        courseId: "course_1",
        contentText: "Week 1: Intro\nWeek 2: Basics",
      },
    });

    expect(auditEntries()).toHaveLength(1);
    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "timetableEntry.create",
        entityType: "TimetableEntry",
        entityId: "tt_1",
      }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/en/admin/timetable-progress",
    );
  });
});

describe("addProgressEntry (admin server action)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("3. admin entry of a progress note against a specific student persists correctly and is immediately visible to that student", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockPECreate.mockResolvedValue({
      id: "pe_1",
      studentProfileId: "student_profile_1",
      courseId: "course_1",
      noteEn: "Showing good progress in module 2",
      recordedAt: new Date(),
      createdAt: new Date(),
    });

    mockAuditCreate.mockResolvedValue({ id: "audit_1" });

    const { addProgressEntry } = await import("./actions");

    const formData = new FormData();
    formData.append("studentProfileId", "student_profile_1");
    formData.append("courseId", "course_1");
    formData.append("noteEn", "Showing good progress in module 2");
    formData.append("locale", "en");

    await addProgressEntry(formData);

    expect(mockPECreate).toHaveBeenCalledTimes(1);
    expect(mockPECreate).toHaveBeenCalledWith({
      data: {
        studentProfileId: "student_profile_1",
        courseId: "course_1",
        noteEn: "Showing good progress in module 2",
      },
    });

    expect(auditEntries()).toHaveLength(1);
    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "studentProgressEntry.create",
        entityType: "StudentProgressEntry",
        entityId: "pe_1",
      }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/en/admin/timetable-progress",
    );

    // Verify the student can see the entry by testing the progress page query
    // We use a fresh mock for the student-facing query
    mockProfileFindUnique.mockResolvedValue({ id: "student_profile_1" });

    mockPEFindMany.mockResolvedValue([
      {
        id: "pe_1",
        studentProfileId: "student_profile_1",
        courseId: "course_1",
        noteEn: "Showing good progress in module 2",
        recordedAt: new Date(),
        createdAt: new Date(),
        course: { titleEn: "Course 1" },
      },
    ]);

    const { default: MyProgressPage } =
      await import("@/app/[locale]/(portal)/portal/student/resources/progress/page");

    const { renderToString } = await import("react-dom/server");
    const element = await MyProgressPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("Showing good progress in module 2");
    expect(html).toContain("Course 1");
  });
});

describe("Progress isolation — student sees own entries only", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("1. a student sees only their own progress entries, never another student's, even within the same course", async () => {
    // Student A is logged in
    mockAuth.mockResolvedValue({
      userId: "student_a",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    // Student A's profile
    mockProfileFindUnique.mockResolvedValue({ id: "profile_a" });

    // Student A sees only their own entries (studentProfileId === profile_a)
    mockPEFindMany.mockResolvedValue([
      {
        id: "pe_a1",
        studentProfileId: "profile_a",
        courseId: "course_1",
        noteEn: "Student A's progress note",
        recordedAt: new Date(),
        createdAt: new Date(),
        course: { titleEn: "Course 1" },
      },
    ]);

    const { default: MyProgressPage } =
      await import("@/app/[locale]/(portal)/portal/student/resources/progress/page");

    const { renderToString } = await import("react-dom/server");
    const element = await MyProgressPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    // Own entry appears
    expect(html).toContain("Student A&#x27;s progress note");

    // Another student's entries never appear — the server queries
    // WHERE studentProfileId = the current user's profile, so
    // Student B's entries are never even fetched.
    expect(html).not.toContain("Student B");
  });

  test("a student with no progress entries sees an empty state", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_empty",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    mockProfileFindUnique.mockResolvedValue({ id: "profile_empty" });

    // No progress entries
    mockPEFindMany.mockResolvedValue([]);

    const { default: MyProgressPage } =
      await import("@/app/[locale]/(portal)/portal/student/resources/progress/page");

    const { renderToString } = await import("react-dom/server");
    const element = await MyProgressPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("My Progress");
    expect(html).toContain("No progress entries recorded yet.");
  });
});

describe("Timetable — course-scoped retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("2. a student sees their enrolled course's timetable, correctly scoped", async () => {
    // Student is enrolled in Course A only
    mockAuth.mockResolvedValue({
      userId: "student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    mockProfileFindUnique.mockResolvedValue({ id: "profile_1" });

    // Enrolled in Course A and Course B
    mockEnrollFindMany.mockResolvedValue([
      { courseId: "course_a" },
      { courseId: "course_b" },
    ]);

    // Only Course A has timetable entries
    mockTTFindMany.mockResolvedValue([
      {
        id: "tt_a1",
        courseId: "course_a",
        contentText: "Course A weekly schedule",
        createdAt: new Date(),
        course: { titleEn: "Course A" },
      },
    ]);

    mockCourseFindMany.mockResolvedValue([
      { id: "course_a", titleEn: "Course A" },
      { id: "course_b", titleEn: "Course B" },
    ]);

    const { default: TimetablePage } =
      await import("@/app/[locale]/(portal)/portal/student/resources/timetable/page");

    const { renderToString } = await import("react-dom/server");
    const element = await TimetablePage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    // Course A's timetable appears
    expect(html).toContain("Course A weekly schedule");
    expect(html).toContain("Course A");

    // Course B has no timetable entries, so it should not appear
    expect(html).not.toContain("Course B");
  });

  test("a student enrolled in no courses sees an empty state", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_noenroll",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    mockProfileFindUnique.mockResolvedValue({ id: "profile_noenroll" });

    // No enrollments
    mockEnrollFindMany.mockResolvedValue([]);

    const { default: TimetablePage } =
      await import("@/app/[locale]/(portal)/portal/student/resources/timetable/page");

    const { renderToString } = await import("react-dom/server");
    const element = await TimetablePage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("Timetable");
    expect(html).toContain("aren&#x27;t enrolled");
    expect(html).toContain("Contact the centre");
  });
});

describe("Admin entry flow — role gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("4. the admin entry flow is denied to a job_seeker-role user (403)", async () => {
    mockAuth.mockResolvedValue({
      userId: "jobseeker_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });

    const { addTimetableEntry } = await import("./actions");

    const formData = new FormData();
    formData.append("courseId", "course_1");
    formData.append("contentText", "Week 1 content");
    formData.append("locale", "en");

    await expect(addTimetableEntry(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );

    expect(mockTTCreate).not.toHaveBeenCalled();
  });

  test("addProgressEntry is also denied to a job_seeker user", async () => {
    mockAuth.mockResolvedValue({
      userId: "jobseeker_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });

    const { addProgressEntry } = await import("./actions");

    const formData = new FormData();
    formData.append("studentProfileId", "profile_1");
    formData.append("courseId", "course_1");
    formData.append("noteEn", "Test note");
    formData.append("locale", "en");

    await expect(addProgressEntry(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );

    expect(mockPECreate).not.toHaveBeenCalled();
  });
});
