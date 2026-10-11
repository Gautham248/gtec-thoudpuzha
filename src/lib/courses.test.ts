// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { getPublishedCourses } from "@/lib/courses";
import { requireRole, Role } from "@/lib/auth";
import { db } from "@/db";
import { failMockQuery, setMockRows } from "@/__tests__/drizzle-mock";

// "@/db" is the in-memory fake installed by src/__tests__/setup.ts.
// Admin course actions are covered in app/[locale]/(admin)/admin/courses/actions.test.ts.

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

function course(overrides: Record<string, unknown>) {
  return {
    id: "c",
    slug: "c",
    titleEn: "Course",
    status: "PUBLISHED",
    featured: false,
    certifications: [],
    syllabus: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: null,
    ...overrides,
  };
}

describe("getPublishedCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("a DRAFT course is not returned by getPublishedCourses()", async () => {
    setMockRows(db, "course", [
      course({ id: "c_draft", slug: "draft-course", status: "DRAFT" }),
    ]);

    expect(await getPublishedCourses()).toHaveLength(0);
  });

  test("a PUBLISHED course is returned by getPublishedCourses()", async () => {
    setMockRows(db, "course", [
      course({
        id: "c_pub",
        slug: "published-course",
        titleEn: "Published Course",
        descriptionEn: "A published course",
        durationText: "3 months",
        category: { id: "cat_1", nameEn: "IT", nameMl: null, sortOrder: 0 },
      }),
    ]);

    const result = await getPublishedCourses();

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("published-course");
    expect(result[0].titleEn).toBe("Published Course");
    expect(result[0]).not.toHaveProperty("status");
    expect(result[0]).not.toHaveProperty("syllabus");
    expect(result[0].category?.nameEn).toBe("IT");
  });

  test("orders featured courses first, then newest", async () => {
    setMockRows(db, "course", [
      course({ id: "old", slug: "old", createdAt: new Date(2026, 0, 1) }),
      course({ id: "new", slug: "new", createdAt: new Date(2026, 0, 5) }),
      course({
        id: "featured-old",
        slug: "featured-old",
        featured: true,
        createdAt: new Date(2026, 0, 2),
      }),
    ]);

    const result = await getPublishedCourses();

    expect(result.map((c) => c.slug)).toEqual(["featured-old", "new", "old"]);
  });

  test("returns an empty list instead of throwing when the database fails", async () => {
    failMockQuery(db, "course");

    await expect(getPublishedCourses()).resolves.toEqual([]);
  });
});

describe("Admin courses authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
