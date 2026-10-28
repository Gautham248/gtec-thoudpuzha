// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { course } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertCourse } from "@/__tests__/pg-fixtures";

const mockLogAdminAction = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockRevalidateTag = vi.hoisted(() => vi.fn());

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: mockRevalidateTag,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAdminAction: mockLogAdminAction,
}));

vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(() =>
    Promise.resolve({
      authorized: true,
      userId: "test-user-id",
      role: "SUPER_ADMIN",
    }),
  ),
  Role: { CENTRE_STAFF: "CENTRE_STAFF", SUPER_ADMIN: "SUPER_ADMIN" },
}));

const { saveCourseContent, getCourseContent } =
  await import("@/app/[locale]/(admin)/admin/courses/[courseId]/content/actions");

const pg = db as unknown as TestDb;
let courseId: string;

function makeFormData(
  overrides: Record<string, string> = {},
  omit: string[] = [],
) {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    locale: "en",
    courseId,
    contentBlocks: JSON.stringify({
      heroTaglineEn: "Test tagline",
      courseLists: [],
    }),
  };
  for (const [key, val] of Object.entries(defaults)) {
    if (!omit.includes(key)) fd.append(key, val);
  }
  for (const [key, val] of Object.entries(overrides)) {
    fd.set(key, val);
  }
  return fd;
}

const storedContent = async () =>
  (await pg.select().from(course))[0].contentBlocks;

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  courseId = (
    await insertCourse(pg, { slug: "test-course", titleEn: "Test Course" })
  ).id;
});

describe("saveCourseContent", () => {
  test("saves valid content, audits it and revalidates the public course page", async () => {
    await saveCourseContent(makeFormData());

    expect(await storedContent()).toEqual(
      expect.objectContaining({
        heroTaglineEn: "Test tagline",
        courseLists: [],
      }),
    );
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "courseContent.save",
        entityId: courseId,
        metadata: { titleEn: "Test Course" },
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/courses/test-course");
    // The cached course list carries contentBlocks, so the tag must be busted too.
    expect(mockRevalidateTag).toHaveBeenCalledWith("published-courses", "max");
  });

  test("fails for an unknown course without auditing", async () => {
    await expect(
      saveCourseContent(makeFormData({ courseId: "missing" })),
    ).rejects.toThrow("Course not found");
    expect(mockLogAdminAction).not.toHaveBeenCalled();
  });

  test("rejects invalid JSON content", async () => {
    await expect(
      saveCourseContent(makeFormData({ contentBlocks: "not-json" })),
    ).rejects.toThrow("Invalid JSON");
    expect(await storedContent()).toBeNull();
  });

  test("rejects missing content data", async () => {
    await expect(
      saveCourseContent(makeFormData({}, ["contentBlocks"])),
    ).rejects.toThrow("Missing content data");
  });

  test("rejects missing courseId", async () => {
    await expect(
      saveCourseContent(makeFormData({}, ["courseId"])),
    ).rejects.toThrow("Missing courseId");
  });

  test("rejects content with empty course list heading", async () => {
    await expect(
      saveCourseContent(
        makeFormData({
          contentBlocks: JSON.stringify({
            courseLists: [
              {
                type: "course_list",
                heading: "",
                items: [{ code: "ABC", name: "Test" }],
              },
            ],
          }),
        }),
      ),
    ).rejects.toThrow();
    expect(await storedContent()).toBeNull();
  });
});

describe("getCourseContent", () => {
  test("returns null when no content", async () => {
    expect(await getCourseContent(courseId)).toBeNull();
    expect(await getCourseContent("missing")).toBeNull();
  });

  test("returns parsed content when valid", async () => {
    await pg
      .update(course)
      .set({ contentBlocks: { heroTaglineEn: "Test", courseLists: [] } });

    const result = await getCourseContent(courseId);

    expect(result).toEqual(expect.objectContaining({ heroTaglineEn: "Test" }));
  });

  test("returns null for malformed JSON", async () => {
    await pg
      .update(course)
      .set({ contentBlocks: { courseLists: "not-an-array" } });

    expect(await getCourseContent(courseId)).toBeNull();
  });
});
