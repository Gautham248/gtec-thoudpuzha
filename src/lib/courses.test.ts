// @vitest-environment node

import { describe, expect, test, vi, beforeEach } from "vitest";
import { getPublishedCourses } from "@/lib/courses";
import { createCourse, uploadCourseImage } from "@/app/[locale]/(admin)/admin/courses/actions";
import { requireRole, Role } from "@/lib/auth";
import { db } from "@/db";
import { resetMockDb, setMockRows } from "@/__tests__/drizzle-mock";

/* ─── Mock store ─── */
type MockCourse = {
  id: string;
  slug: string;
  titleEn: string;
  titleMl: string | null;
  categoryId: string | null;
  descriptionEn: string | null;
  descriptionMl: string | null;
  durationText: string | null;
  syllabus: unknown;
  certifications: string[];
  careerOutcomesEn: string | null;
  careerOutcomesMl: string | null;
  coverImageUrl: string | null;
  featured: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; nameEn: string; nameMl: string | null } | null;
};

let mockStore: MockCourse[] = [];

const mockCourseCreate = vi.hoisted(() =>
  vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
    const entry: MockCourse = {
      id: "course_" + Date.now(),
      slug: data.slug as string,
      titleEn: data.titleEn as string,
      titleMl: (data.titleMl as string) ?? null,
      categoryId: (data.categoryId as string) ?? null,
      descriptionEn: (data.descriptionEn as string) ?? null,
      descriptionMl: (data.descriptionMl as string) ?? null,
      durationText: (data.durationText as string) ?? null,
      syllabus: data.syllabus ?? null,
      certifications: (data.certifications as string[]) ?? [],
      careerOutcomesEn: (data.careerOutcomesEn as string) ?? null,
      careerOutcomesMl: (data.careerOutcomesMl as string) ?? null,
      coverImageUrl: (data.coverImageUrl as string) ?? null,
      featured: (data.featured as boolean) ?? false,
      status: (data.status as string) ?? "DRAFT",
      createdAt: new Date(),
      updatedAt: new Date(),
      category: data.categoryId
        ? { id: data.categoryId as string, nameEn: "Category", nameMl: null }
        : null,
    };
    mockStore.push(entry);
    return Promise.resolve(entry);
  }),
);

const mockCourseUpdate = vi.hoisted(() => vi.fn());

const mockUploadFile = vi.hoisted(() => vi.fn());
const mockLogAdminAction = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    course: {
      create: mockCourseCreate,
      update: mockCourseUpdate,
    },
    courseCategory: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: mockUserFindUnique,
    },
  },
}));

vi.mock("@/db", async () => (await import("@/__tests__/drizzle-mock")).mockDbModule());

vi.mock("@/lib/audit", () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock("@/lib/storage", () => ({
  uploadFile: mockUploadFile,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { auth as clerkAuth } from "@clerk/nextjs/server";

function setMockAuth(userId: string, role: Role) {
  const clerkMock = clerkAuth as unknown as ReturnType<typeof vi.fn>;
  clerkMock.mockResolvedValue({
    userId,
    sessionClaims: { metadata: { role } },
  });
}

/* ───────────────────── Tests ───────────────────── */

describe("getPublishedCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = [];
    resetMockDb(db);
  });

  test("a DRAFT course is not returned by getPublishedCourses()", async () => {
    mockStore.push({
      id: "c_draft",
      slug: "draft-course",
      titleEn: "Draft Course",
      titleMl: null,
      categoryId: null,
      descriptionEn: null,
      descriptionMl: null,
      durationText: null,
      syllabus: null,
      certifications: [],
      careerOutcomesEn: null,
      careerOutcomesMl: null,
      coverImageUrl: null,
      featured: false,
      status: "DRAFT",
      createdAt: new Date(),
      updatedAt: new Date(),
      category: null,
    });

    setMockRows(db, "course", mockStore);
    const result = await getPublishedCourses();
    expect(result).toHaveLength(0);
  });

  test("a PUBLISHED course is returned by getPublishedCourses()", async () => {
    mockStore.push({
      id: "c_pub",
      slug: "published-course",
      titleEn: "Published Course",
      titleMl: null,
      categoryId: null,
      descriptionEn: "A published course",
      descriptionMl: null,
      durationText: "3 months",
      syllabus: null,
      certifications: [],
      careerOutcomesEn: null,
      careerOutcomesMl: null,
      coverImageUrl: null,
      featured: false,
      status: "PUBLISHED",
      createdAt: new Date(),
      updatedAt: new Date(),
      category: { id: "cat_1", nameEn: "IT", nameMl: null },
    });

    setMockRows(db, "course", mockStore);
    const result = await getPublishedCourses();

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("published-course");
    expect(result[0].titleEn).toBe("Published Course");
    expect(result[0]).not.toHaveProperty("status");
    expect(result[0]).not.toHaveProperty("syllabus");
    expect(result[0].category?.nameEn).toBe("IT");
  });

  test("orders featured courses first, then newest", async () => {
    const make = (slug: string, featured: boolean, day: number) => ({
      id: slug, slug, titleEn: slug, status: "PUBLISHED", featured,
      createdAt: new Date(2026, 0, day), certifications: [], category: null,
    });
    setMockRows(db, "course", [
      make("old", false, 1),
      make("new", false, 5),
      make("featured-old", true, 2),
    ]);

    const result = await getPublishedCourses();

    expect(result.map((c) => c.slug)).toEqual(["featured-old", "new", "old"]);
  });

  test("returns an empty list instead of throwing when the database fails", async () => {
    const { failMockQuery } = await import("@/__tests__/drizzle-mock");
    failMockQuery(db, "course");

    await expect(getPublishedCourses()).resolves.toEqual([]);
  });
});

describe("Course creation with category", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = [];
    setMockAuth("admin_1", Role.CENTRE_STAFF);
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("creating a course with a category persists correctly", async () => {
    const formData = new FormData();
    formData.set("locale", "en");
    formData.set("titleEn", "Advanced JavaScript");
    formData.set("slug", "advanced-js");
    formData.set("categoryId", "cat_1");
    formData.set("descriptionEn", "Deep dive into JS");
    formData.set("durationText", "6 weeks");
    formData.set("certifications", "CertA, CertB");
    formData.set("careerOutcomesEn", "Become a JS developer");
    formData.set("status", "DRAFT");

    await createCourse(formData);

    expect(mockCourseCreate).toHaveBeenCalledTimes(1);
    expect(mockCourseCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        titleEn: "Advanced JavaScript",
        slug: "advanced-js",
        categoryId: "cat_1",
        certifications: ["CertA", "CertB"],
        status: "DRAFT",
      }),
    });
  });
});

describe("Admin courses authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("/admin/courses is denied to a student-role user (403)", async () => {
    setMockAuth("student_1", Role.STUDENT);

    const result = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.reason).toBe("forbidden");
    }
  });

  test("centre-staff IS authorized for admin courses", async () => {
    setMockAuth("staff_1", Role.CENTRE_STAFF);

    const result = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.role).toBe(Role.CENTRE_STAFF);
    }
  });
});

describe("Course cover image upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = [];
    setMockAuth("admin_1", Role.CENTRE_STAFF);
    mockUploadFile.mockResolvedValue("course-covers/12345-image.png");
    mockCourseUpdate.mockResolvedValue({ id: "course_1" });
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("uploading a course cover image stores it in R2 and persists the URL", async () => {
    const blob = new Blob(["fake-image-data"], { type: "image/png" });
    const file = new File([blob], "cover.png", { type: "image/png" });

    const formData = new FormData();
    formData.set("locale", "en");
    formData.set("courseId", "course_1");
    formData.set("coverImage", file);

    await uploadCourseImage(formData);

    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: "cover.png", type: "image/png" }),
      "course-covers",
    );

    expect(mockCourseUpdate).toHaveBeenCalledWith({
      where: { id: "course_1" },
      data: { coverImageUrl: "course-covers/12345-image.png" },
    });
  });
});
