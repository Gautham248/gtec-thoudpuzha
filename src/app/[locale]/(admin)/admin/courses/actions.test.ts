// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { auditLogEntry, course, courseCategory } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  form,
  insertCategory,
  insertCourse,
  session,
} from "@/__tests__/pg-fixtures";
import {
  createCategory,
  createCourse,
  deleteCategory,
  deleteCourse,
  moveCategory,
  updateCourse,
  uploadCourseImage,
} from "./actions";

const mockAuth = vi.hoisted(() => vi.fn());
const mockUploadFile = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@/lib/storage", () => ({ uploadFile: mockUploadFile }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const pg = db as unknown as TestDb;

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  mockAuth.mockResolvedValue(session("admin_1", "CENTRE_STAFF"));
});

const audits = () => pg.select().from(auditLogEntry);

describe("Course creation", () => {
  test("creating a course with a category persists correctly", async () => {
    const category = await insertCategory(pg, { nameEn: "IT" });

    await createCourse(
      form({
        locale: "en",
        titleEn: "Advanced JavaScript",
        slug: "advanced-js",
        categoryId: category.id,
        descriptionEn: "Deep dive into JS",
        durationText: "6 weeks",
        certifications: "CertA, CertB",
        careerOutcomesEn: "Become a JS developer",
        status: "DRAFT",
      }),
    );

    const [row] = await pg.select().from(course);
    expect(row).toMatchObject({
      titleEn: "Advanced JavaScript",
      slug: "advanced-js",
      categoryId: category.id,
      certifications: ["CertA", "CertB"],
      status: "DRAFT",
      featured: false,
      syllabus: null,
    });
    const [audit] = await audits();
    expect(audit).toMatchObject({ action: "course.create", entityId: row.id });
  });

  test("derives the slug from the title and stores a JSON syllabus", async () => {
    await createCourse(
      form({
        locale: "en",
        titleEn: "Tally ERP 9 (GST)",
        syllabus: JSON.stringify({ modules: ["Basics"] }),
        featured: "on",
        status: "PUBLISHED",
      }),
    );

    const [row] = await pg.select().from(course);
    expect(row).toMatchObject({
      slug: "tally-erp-9-gst",
      syllabus: { modules: ["Basics"] },
      featured: true,
      status: "PUBLISHED",
      certifications: [],
    });
  });

  test("a duplicate slug is rejected by the unique constraint", async () => {
    await insertCourse(pg, { slug: "dup" });

    await expect(
      createCourse(form({ locale: "en", titleEn: "X", slug: "dup" })),
    ).rejects.toThrow();
  });
});

describe("Course update / delete", () => {
  test("updateCourse replaces the editable fields", async () => {
    const existing = await insertCourse(pg, { slug: "old", titleEn: "Old" });

    await updateCourse(
      form({
        locale: "en",
        id: existing.id,
        titleEn: "New",
        slug: "new",
        status: "ARCHIVED",
      }),
    );

    const [row] = await pg.select().from(course);
    expect(row).toMatchObject({
      titleEn: "New",
      slug: "new",
      status: "ARCHIVED",
    });
    expect(row.updatedAt.getTime()).toBeGreaterThanOrEqual(
      existing.updatedAt.getTime(),
    );
  });

  test("updating or deleting a missing course fails without auditing", async () => {
    await expect(
      updateCourse(
        form({ locale: "en", id: "missing", titleEn: "X", slug: "x" }),
      ),
    ).rejects.toThrow("Course not found");
    await expect(
      deleteCourse(form({ locale: "en", id: "missing" })),
    ).rejects.toThrow("Course not found");
    expect(await audits()).toHaveLength(0);
  });

  test("deleteCourse removes the row", async () => {
    const existing = await insertCourse(pg);

    await deleteCourse(form({ locale: "en", id: existing.id }));

    expect(await pg.select().from(course)).toHaveLength(0);
  });
});

describe("Course cover image upload", () => {
  test("uploading a course cover image stores it in R2 and persists the URL", async () => {
    const existing = await insertCourse(pg);
    mockUploadFile.mockResolvedValue("course-covers/12345-image.png");
    const file = new File([new Blob(["fake-image-data"])], "cover.png", {
      type: "image/png",
    });

    await uploadCourseImage(
      form({ locale: "en", courseId: existing.id, coverImage: file }),
    );

    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: "cover.png", type: "image/png" }),
      "course-covers",
    );
    const [row] = await pg.select().from(course);
    expect(row.coverImageUrl).toBe("course-covers/12345-image.png");
  });

  test("an empty file input changes nothing", async () => {
    const existing = await insertCourse(pg, { coverImageUrl: "old.png" });

    await uploadCourseImage(
      form({
        locale: "en",
        courseId: existing.id,
        coverImage: new File([], "empty.png"),
      }),
    );

    expect(mockUploadFile).not.toHaveBeenCalled();
    expect((await pg.select().from(course))[0].coverImageUrl).toBe("old.png");
  });
});

describe("Course categories", () => {
  test("createCategory appends to the sort order", async () => {
    await insertCategory(pg, { sortOrder: 5 });

    await createCategory(form({ locale: "en", nameEn: "Design" }));

    const rows = await pg.query.courseCategory.findMany({
      orderBy: (c, { asc }) => asc(c.sortOrder),
    });
    expect(rows.map((r) => [r.nameEn, r.sortOrder]).at(-1)).toEqual([
      "Design",
      6,
    ]);
  });

  test("moveCategory swaps with its neighbour", async () => {
    const a = await insertCategory(pg, { sortOrder: 1 });
    const b = await insertCategory(pg, { sortOrder: 2 });

    await moveCategory(form({ locale: "en", id: a.id, direction: "down" }));

    const rows = await pg.query.courseCategory.findMany({
      orderBy: (c, { asc }) => asc(c.sortOrder),
    });
    expect(rows.map((r) => r.id)).toEqual([b.id, a.id]);
  });

  test("deleting a category keeps its courses, uncategorised (FK is ON DELETE SET NULL)", async () => {
    const category = await insertCategory(pg);
    await insertCourse(pg, { categoryId: category.id });

    await deleteCategory(form({ locale: "en", id: category.id }));

    expect(await pg.select().from(courseCategory)).toHaveLength(0);
    const [row] = await pg.select().from(course);
    expect(row.categoryId).toBeNull();
  });
});

describe("Admin courses authorization", () => {
  test("a student cannot create courses (redirected to forbidden)", async () => {
    mockAuth.mockResolvedValue(session("student_1", "STUDENT"));

    await expect(
      createCourse(form({ locale: "en", titleEn: "X" })),
    ).rejects.toThrow("redirect:/en/forbidden");
    expect(await pg.select().from(course)).toHaveLength(0);
  });
});
