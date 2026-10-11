// @vitest-environment node
import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { academicResource, auditLogEntry } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertCourse } from "@/__tests__/pg-fixtures";

// --- Test 4: embed URL derivation (pure utility, no mocks needed) ---

describe("deriveEmbedUrl (video URL utility)", () => {
  test("4. converts YouTube watch URL to embed URL", async () => {
    const { deriveEmbedUrl } = await import("@/lib/video");
    const result = deriveEmbedUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(result).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  test("converts youtu.be short URL to embed URL", async () => {
    const { deriveEmbedUrl } = await import("@/lib/video");
    const result = deriveEmbedUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(result).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  test("converts Vimeo URL to player URL", async () => {
    const { deriveEmbedUrl } = await import("@/lib/video");
    const result = deriveEmbedUrl("https://vimeo.com/123456789");
    expect(result).toBe("https://player.vimeo.com/video/123456789");
  });
});

describe("validateVideoUrl (video URL utility)", () => {
  test("2. rejects a non-allowed host URL with a clear validation error", async () => {
    const { validateVideoUrl } = await import("@/lib/video");
    const result = validateVideoUrl("https://dailymotion.com/video/abc123");
    expect(result).toBe("Only YouTube and Vimeo URLs are allowed.");
  });

  test("accepts a valid YouTube URL", async () => {
    const { validateVideoUrl } = await import("@/lib/video");
    const result = validateVideoUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(result).toBeNull();
  });

  test("accepts a valid Vimeo URL", async () => {
    const { validateVideoUrl } = await import("@/lib/video");
    const result = validateVideoUrl("https://vimeo.com/123456789");
    expect(result).toBeNull();
  });

  test("rejects invalid URL format", async () => {
    const { validateVideoUrl } = await import("@/lib/video");
    const result = validateVideoUrl("not-a-url");
    expect(result).toBe("Invalid URL format.");
  });
});

// --- Hoisted mocks shared by action + component tests ---

const mockAuth = vi.hoisted(() => vi.fn());
const mockAcFindMany = vi.hoisted(() => vi.fn());
const mockEnrollFindMany = vi.hoisted(() => vi.fn());
const mockProfileFindUnique = vi.hoisted(() => vi.fn());
const mockCourseFindMany = vi.hoisted(() => vi.fn());
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
// student-facing VideoLectureList still reads through Prisma until the portal
// moves to Drizzle.
vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

vi.mock("@/lib/db", () => ({
  prisma: {
    academicResource: {
      findMany: mockAcFindMany,
    },
    studentCourseEnrollment: {
      findMany: mockEnrollFindMany,
    },
    candidateProfile: {
      findUnique: mockProfileFindUnique,
    },
    course: {
      findMany: mockCourseFindMany,
    },
  },
}));

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

describe("uploadResource — LECTURE type (admin server action)", () => {
  let courseId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
    courseId = (await insertCourse(pg)).id;
  });

  test("1. adding a LECTURE resource with a valid YouTube URL succeeds", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const { uploadResource } =
      await import("@/app/[locale]/(admin)/admin/academic-resources/actions");

    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("type", "LECTURE");
    formData.append("title", "React Hooks Explained");
    formData.append("embedUrl", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    formData.append("locale", "en");

    await uploadResource(formData);

    const [resource] = await pg.select().from(academicResource);
    expect(resource).toMatchObject({
      courseId,
      type: "LECTURE",
      title: "React Hooks Explained",
      fileUrl: null,
      embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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

  test("2. adding a LECTURE resource with a non-allowed host URL is rejected", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const { uploadResource } =
      await import("@/app/[locale]/(admin)/admin/academic-resources/actions");

    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("type", "LECTURE");
    formData.append("title", "Bad Host Lecture");
    formData.append("embedUrl", "https://dailymotion.com/video/abc123");
    formData.append("locale", "en");

    await expect(uploadResource(formData)).rejects.toThrow(
      "Only YouTube and Vimeo URLs are allowed.",
    );

    expect(await pg.select().from(academicResource)).toHaveLength(0);
  });
});

describe("VideoLectureList — course-scoped retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("3. a student sees only their enrolled course's lecture videos, correctly embedded", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    // Profile exists
    mockProfileFindUnique.mockResolvedValue({ id: "profile_1" });

    // Student is enrolled in Course A only
    mockEnrollFindMany.mockResolvedValue([{ courseId: "course_a" }]);

    // Only Course A has LECTURE resources
    mockAcFindMany.mockResolvedValue([
      {
        id: "lec_a1",
        courseId: "course_a",
        type: "LECTURE",
        title: "Course A Lecture 1",
        fileUrl: null,
        embedUrl: "https://www.youtube.com/watch?v=abc123",
        uploadedAt: new Date(),
        createdAt: new Date(),
        course: { titleEn: "Course A" },
      },
    ]);

    mockCourseFindMany.mockResolvedValue([
      { id: "course_a", titleEn: "Course A" },
    ]);

    const { VideoLectureList } =
      await import("@/app/[locale]/(portal)/portal/student/resources/video-lecture-list");

    const { renderToString } = await import("react-dom/server");
    const element = await VideoLectureList({ locale: "en" });
    const html = renderToString(element);

    // Course A's lectures appear
    expect(html).toContain("Course A Lecture 1");
    expect(html).toContain("Course A");

    // The embed URL is derived to its embeddable form
    expect(html).toContain("www.youtube.com/embed/abc123");

    // Course B is never mentioned since student isn't enrolled
    expect(html).not.toContain("Course B");
  });
});
