// @vitest-environment node
import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import {
  auditLogEntry,
  studentCourseEnrollment,
  studentProgressEntry,
  timetableEntry,
} from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  insertCourse,
  insertStudentProfile,
  insertUser,
} from "@/__tests__/pg-fixtures";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

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
  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
  });

  test("3. admin entry of a timetable entry against a course persists correctly", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const course = await insertCourse(pg);

    const { addTimetableEntry } = await import("./actions");

    const formData = new FormData();
    formData.append("courseId", course.id);
    formData.append("contentText", "Week 1: Intro\nWeek 2: Basics");
    formData.append("locale", "en");

    await addTimetableEntry(formData);

    const [entry] = await pg.select().from(timetableEntry);
    expect(entry).toMatchObject({
      courseId: course.id,
      contentText: "Week 1: Intro\nWeek 2: Basics",
    });

    const audits = await pg.select().from(auditLogEntry);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "timetableEntry.create",
      entityType: "TimetableEntry",
      entityId: entry.id,
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/en/admin/timetable-progress",
    );
  });
});

describe("addProgressEntry (admin server action)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
  });

  test("3. admin entry of a progress note against a specific student persists correctly and is immediately visible to that student", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const course = await insertCourse(pg);
    const student = await insertStudentProfile(pg);

    const { addProgressEntry } = await import("./actions");

    const formData = new FormData();
    formData.append("studentProfileId", student.id);
    formData.append("courseId", course.id);
    formData.append("noteEn", "Showing good progress in module 2");
    formData.append("locale", "en");

    await addProgressEntry(formData);

    const [entry] = await pg.select().from(studentProgressEntry);
    expect(entry).toMatchObject({
      studentProfileId: student.id,
      courseId: course.id,
      noteEn: "Showing good progress in module 2",
    });

    const audits = await pg.select().from(auditLogEntry);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "studentProgressEntry.create",
      entityType: "StudentProgressEntry",
      entityId: entry.id,
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/en/admin/timetable-progress",
    );

    // The student can see the entry right away on their progress page.
    mockAuth.mockResolvedValue({
      userId: student.userId,
      sessionClaims: { metadata: { role: "STUDENT" } },
    });
    const html = await renderProgress();

    expect(html).toContain("Showing good progress in module 2");
    expect(html).toContain(course.titleEn);
  });
});

async function signedInStudent(userId: string) {
  await insertUser(pg, { id: userId, role: "STUDENT" });
  mockAuth.mockResolvedValue({
    userId,
    sessionClaims: { metadata: { role: "STUDENT" } },
  });
  return insertStudentProfile(pg, { userId });
}

async function renderProgress() {
  const { default: MyProgressPage } =
    await import("@/app/[locale]/(portal)/portal/student/resources/progress/page");
  const { renderToString } = await import("react-dom/server");
  return renderToString(
    await MyProgressPage({ params: Promise.resolve({ locale: "en" }) }),
  );
}

async function renderTimetable() {
  const { default: TimetablePage } =
    await import("@/app/[locale]/(portal)/portal/student/resources/timetable/page");
  const { renderToString } = await import("react-dom/server");
  return renderToString(
    await TimetablePage({ params: Promise.resolve({ locale: "en" }) }),
  );
}

describe("Progress isolation — student sees own entries only", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
  });

  test("1. a student sees only their own progress entries, never another student's, even within the same course", async () => {
    const course = await insertCourse(pg, { titleEn: "Course 1" });
    await insertUser(pg, { id: "student_b", role: "STUDENT" });
    const studentB = await insertStudentProfile(pg, { userId: "student_b" });
    const studentA = await signedInStudent("student_a");
    await pg.insert(studentProgressEntry).values([
      {
        studentProfileId: studentA.id,
        courseId: course.id,
        noteEn: "Student A's progress note",
      },
      {
        studentProfileId: studentB.id,
        courseId: course.id,
        noteEn: "Student B's progress note",
      },
    ]);

    const html = await renderProgress();

    expect(html).toContain("Student A&#x27;s progress note");
    expect(html).not.toContain("Student B");
  });

  test("a student with no progress entries sees an empty state", async () => {
    await signedInStudent("student_empty");

    const html = await renderProgress();

    expect(html).toContain("My Progress");
    expect(html).toContain("No progress entries recorded yet.");
  });
});

describe("Timetable — course-scoped retrieval", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
  });

  test("2. a student sees their enrolled course's timetable, correctly scoped", async () => {
    const profile = await signedInStudent("student_1");
    const courseA = await insertCourse(pg, { titleEn: "Course A" });
    const courseB = await insertCourse(pg, { titleEn: "Course B" });
    const courseC = await insertCourse(pg, { titleEn: "Course C" });
    await pg.insert(studentCourseEnrollment).values([
      { studentProfileId: profile.id, courseId: courseA.id },
      { studentProfileId: profile.id, courseId: courseB.id },
    ]);
    await pg.insert(timetableEntry).values([
      { courseId: courseA.id, contentText: "Course A weekly schedule" },
      { courseId: courseC.id, contentText: "Course C weekly schedule" },
    ]);

    const html = await renderTimetable();

    expect(html).toContain("Course A weekly schedule");
    expect(html).toContain("Course A");
    // Course B has no timetable entries, Course C isn't enrolled
    expect(html).not.toContain("Course B");
    expect(html).not.toContain("Course C");
  });

  test("a student enrolled in no courses sees an empty state", async () => {
    await signedInStudent("student_noenroll");

    const html = await renderTimetable();

    expect(html).toContain("Timetable");
    expect(html).toContain("aren&#x27;t enrolled");
    expect(html).toContain("Contact the centre");
  });
});

describe("Admin entry flow — role gating", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
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

    expect(await pg.select().from(timetableEntry)).toHaveLength(0);
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

    expect(await pg.select().from(studentProgressEntry)).toHaveLength(0);
  });
});
