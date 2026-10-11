import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { getInsertedRows } from "@/__tests__/drizzle-mock";

const mockAuth = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockFindManyCourses = vi.hoisted(() => vi.fn());
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
    academicResource: {
      create: mockCreate,
      delete: mockDelete,
      findMany: mockFindMany,
    },
    studentCourseEnrollment: {
      findMany: mockFindMany,
    },
    candidateProfile: {
      findUnique: mockFindUnique,
    },
    course: {
      findMany: mockFindManyCourses,
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

describe("uploadResource (admin server action)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("1. uploading a NOTE resource persists with the right type and courseId", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockCreate.mockResolvedValue({
      id: "res_1",
      courseId: "course_1",
      type: "NOTE",
      title: "Introduction to Programming",
      fileUrl: "https://example.com/notes.pdf",
      uploadedAt: new Date(),
      createdAt: new Date(),
    });

    mockAuditCreate.mockResolvedValue({ id: "audit_1" });

    const { uploadResource } = await import("./actions");

    const formData = new FormData();
    formData.append("courseId", "course_1");
    formData.append("type", "NOTE");
    formData.append("title", "Introduction to Programming");
    formData.append("fileUrl", "https://example.com/notes.pdf");
    formData.append("locale", "en");

    await uploadResource(formData);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        courseId: "course_1",
        type: "NOTE",
        title: "Introduction to Programming",
        fileUrl: "https://example.com/notes.pdf",
      },
    });

    expect(auditEntries()).toHaveLength(1);
    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "academicResource.upload",
        entityType: "AcademicResource",
        entityId: "res_1",
      }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/en/admin/academic-resources",
    );
  });

  test("4. admin upload flow is denied to a student-role user (403)", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });

    const { uploadResource } = await import("./actions");

    const formData = new FormData();
    formData.append("courseId", "course_1");
    formData.append("type", "NOTE");
    formData.append("title", "Test");
    formData.append("locale", "en");

    await expect(uploadResource(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );

    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ResourceList tests need component-style mocking — we test the RSC logic
// by importing and rendering the component as the student-dashboard tests do.
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

describe("ResourceList — student-facing course-scoped retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockReset();
    mockFindUnique.mockReset();
    mockFindManyCourses.mockReset();
  });

  test("2. a student enrolled in Course A sees Course A's notes but NOT Course B's notes", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    mockFindUnique.mockResolvedValue({ id: "profile_1" });

    // Student is enrolled in Course A and Course B
    mockFindMany
      .mockResolvedValueOnce([
        { courseId: "course_a" },
        { courseId: "course_b" },
      ]) // enrollments
      .mockResolvedValueOnce([
        {
          id: "res_a1",
          courseId: "course_a",
          type: "NOTE",
          title: "Course A Notes 1",
          fileUrl: null,
          uploadedAt: new Date(),
          createdAt: new Date(),
          course: { titleEn: "Course A" },
        },
        {
          id: "res_a2",
          courseId: "course_a",
          type: "NOTE",
          title: "Course A Notes 2",
          fileUrl: null,
          uploadedAt: new Date(),
          createdAt: new Date(),
          course: { titleEn: "Course A" },
        },
      ]); // resources — only Course A's notes

    mockFindManyCourses.mockResolvedValue([
      { id: "course_a", titleEn: "Course A" },
      { id: "course_b", titleEn: "Course B" },
    ]);

    const { ResourceList } =
      await import("@/app/[locale]/(portal)/portal/student/resources/resource-list");

    const { renderToString } = await import("react-dom/server");
    const element = await ResourceList({
      type: "NOTE",
      title: "Study Notes",
      locale: "en",
    });
    const html = renderToString(element);

    // Course A's notes appear
    expect(html).toContain("Course A Notes 1");
    expect(html).toContain("Course A Notes 2");
    expect(html).toContain("Course A");

    // Course B's resources are never shown — the component skips courses
    // with zero matching resources.
    expect(html).not.toContain("Course B Notes");
  });

  test("3. a student with zero course enrollments sees an empty state, not an error", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_2",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    mockFindUnique.mockResolvedValue({ id: "profile_2" });

    // No enrollments
    mockFindMany.mockResolvedValue([]);

    const { ResourceList } =
      await import("@/app/[locale]/(portal)/portal/student/resources/resource-list");

    const { renderToString } = await import("react-dom/server");
    const element = await ResourceList({
      type: "NOTE",
      title: "Study Notes",
      locale: "en",
    });
    const html = renderToString(element);

    expect(html).toContain("Study Notes");
    expect(html).toContain("aren&#x27;t enrolled");
    expect(html).toContain("Contact the centre");
    expect(html).not.toContain("error");
    expect(html).not.toContain("Error");
  });
});
