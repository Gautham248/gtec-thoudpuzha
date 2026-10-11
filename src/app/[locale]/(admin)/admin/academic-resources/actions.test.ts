// @vitest-environment node
import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { academicResource, auditLogEntry } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertCourse } from "@/__tests__/pg-fixtures";

const mockAuth = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockFindManyCourses = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

// Admin actions write through Drizzle (in-memory Postgres here); the
// student-facing ResourceList below still reads through Prisma until the
// portal moves to Drizzle.
vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

vi.mock("@/lib/db", () => ({
  prisma: {
    academicResource: {
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
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("uploadResource (admin server action)", () => {
  let courseId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
    courseId = (await insertCourse(pg)).id;
  });

  test("1. uploading a NOTE resource persists with the right type and courseId", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const { uploadResource } = await import("./actions");

    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("type", "NOTE");
    formData.append("title", "Introduction to Programming");
    formData.append("fileUrl", "https://example.com/notes.pdf");
    formData.append("locale", "en");

    await uploadResource(formData);

    const [resource] = await pg.select().from(academicResource);
    expect(resource).toMatchObject({
      courseId,
      type: "NOTE",
      title: "Introduction to Programming",
      fileUrl: "https://example.com/notes.pdf",
      embedUrl: null,
    });

    const audits = await pg.select().from(auditLogEntry);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "academicResource.upload",
      entityType: "AcademicResource",
      entityId: resource.id,
    });

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

    expect(await pg.select().from(academicResource)).toHaveLength(0);
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
