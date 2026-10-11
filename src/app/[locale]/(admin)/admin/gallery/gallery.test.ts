// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogEntry, galleryCategory, galleryItem } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { form, insertGalleryCategory, session } from "@/__tests__/pg-fixtures";

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

function fakeFile(name: string, type: string): File {
  return new File([Buffer.from("fake-image-data")], name, { type });
}

const items = (categoryId: string) =>
  pg.query.galleryItem.findMany({
    where: eq(galleryItem.categoryId, categoryId),
    orderBy: (i, { asc }) => asc(i.sortOrder),
  });

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
});

describe("uploadGalleryImages", () => {
  test("1. bulk-uploading 3 images to a category creates 3 GalleryItem rows in order", async () => {
    const category = await insertGalleryCategory(pg);
    let n = 0;
    mockUploadFile.mockImplementation(async () => `gallery/img-${++n}.png`);

    const { uploadGalleryImages } = await import("./actions");
    await uploadGalleryImages(
      form({
        locale: "en",
        categoryId: category.id,
        captionEn: "<b>Annual day</b>",
        files: [
          fakeFile("img1.png", "image/png"),
          fakeFile("img2.png", "image/png"),
          fakeFile("img3.png", "image/png"),
        ],
      }),
    );

    const rows = await items(category.id);
    expect(rows.map((r) => [r.mediaType, r.url, r.sortOrder])).toEqual([
      ["IMAGE", "gallery/img-1.png", 0],
      ["IMAGE", "gallery/img-2.png", 1],
      ["IMAGE", "gallery/img-3.png", 2],
    ]);
    // Captions are stripped of HTML.
    expect(rows.every((r) => r.captionEn === "Annual day")).toBe(true);
  });

  test("appends after the category's existing items", async () => {
    const category = await insertGalleryCategory(pg);
    await pg
      .insert(galleryItem)
      .values({
        categoryId: category.id,
        mediaType: "IMAGE",
        url: "old",
        sortOrder: 4,
      });
    mockUploadFile.mockResolvedValue("gallery/new.png");

    const { uploadGalleryImages } = await import("./actions");
    await uploadGalleryImages(
      form({
        locale: "en",
        categoryId: category.id,
        files: [fakeFile("a.png", "image/png")],
      }),
    );

    expect((await items(category.id)).map((r) => r.sortOrder)).toEqual([4, 5]);
  });

  test("2. bulk upload writes exactly one audit log entry summarizing the batch", async () => {
    const category = await insertGalleryCategory(pg);
    mockUploadFile.mockResolvedValue("gallery/img.png");

    const { uploadGalleryImages } = await import("./actions");
    await uploadGalleryImages(
      form({
        locale: "en",
        categoryId: category.id,
        files: [fakeFile("a.png", "image/png"), fakeFile("b.png", "image/png")],
      }),
    );

    const created = await items(category.id);
    const audits = await pg.select().from(auditLogEntry);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "gallery.bulkUpload",
      entityType: "GalleryItem",
      entityId: category.id,
      metadata: {
        categoryId: category.id,
        count: 2,
        itemIds: created.map((r) => r.id),
      },
    });
  });

  test("rejects an upload with no files", async () => {
    const category = await insertGalleryCategory(pg);
    const { uploadGalleryImages } = await import("./actions");

    await expect(
      uploadGalleryImages(form({ locale: "en", categoryId: category.id })),
    ).rejects.toThrow("No files provided");
  });
});

describe("addVideoItem", () => {
  test("3. adding a VIDEO-type item stores the external URL without attempting an R2 upload", async () => {
    const category = await insertGalleryCategory(pg);

    const { addVideoItem } = await import("./actions");
    await addVideoItem(
      form({
        locale: "en",
        categoryId: category.id,
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        captionEn: "A cool video",
      }),
    );

    const [video] = await items(category.id);
    expect(video).toMatchObject({
      mediaType: "VIDEO",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      captionEn: "A cool video",
      sortOrder: 0,
    });
    expect(mockUploadFile).not.toHaveBeenCalled();

    const [audit] = await pg.select().from(auditLogEntry);
    expect(audit).toMatchObject({
      action: "gallery.addVideo",
      entityType: "GalleryItem",
      entityId: video.id,
      metadata: {
        categoryId: category.id,
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    });
  });
});

describe("gallery categories", () => {
  test("createCategory gives a unique slug and appends to the sort order", async () => {
    await insertGalleryCategory(pg, {
      slug: "annual-day",
      nameEn: "Annual Day",
      sortOrder: 3,
    });

    const { createCategory } = await import("./actions");
    await createCategory(form({ locale: "en", nameEn: "Annual Day" }));

    const rows = await pg.query.galleryCategory.findMany({
      orderBy: (c, { asc }) => asc(c.sortOrder),
    });
    expect(rows).toHaveLength(2);
    expect(rows[1].sortOrder).toBe(4);
    expect(rows[1].slug).toMatch(/^annual-day-\d+$/);
  });

  test("deleteCategory removes the category and (via ON DELETE CASCADE) its items", async () => {
    const category = await insertGalleryCategory(pg);
    await pg
      .insert(galleryItem)
      .values({ categoryId: category.id, mediaType: "IMAGE", url: "x" });

    const { deleteCategory } = await import("./actions");
    await deleteCategory(
      form({ locale: "en", id: category.id, nameEn: category.nameEn }),
    );

    expect(await pg.select().from(galleryCategory)).toHaveLength(0);
    expect(await pg.select().from(galleryItem)).toHaveLength(0);
    const [audit] = await pg.select().from(auditLogEntry);
    expect(audit).toMatchObject({
      action: "galleryCategory.delete",
      entityId: category.id,
    });
  });

  test("moveCategory swaps sort order with its neighbour", async () => {
    const a = await insertGalleryCategory(pg, { sortOrder: 1 });
    const b = await insertGalleryCategory(pg, { sortOrder: 2 });

    const { moveCategory } = await import("./actions");
    await moveCategory(form({ locale: "en", id: b.id, direction: "up" }));

    const rows = await pg.query.galleryCategory.findMany({
      orderBy: (c, { asc }) => asc(c.sortOrder),
    });
    expect(rows.map((r) => r.id)).toEqual([b.id, a.id]);
  });

  test("deleting a gallery item that no longer exists fails without auditing", async () => {
    const { deleteGalleryItem } = await import("./actions");

    await expect(
      deleteGalleryItem(form({ locale: "en", id: "gone" })),
    ).rejects.toThrow("Gallery item not found");
    expect(await pg.select().from(auditLogEntry)).toHaveLength(0);
  });
});

describe("GalleryPage", () => {
  test("4. /admin/gallery is denied to an employer-role user (403)", async () => {
    mockAuth.mockResolvedValue(session("employer_1", "EMPLOYER"));

    const { default: GalleryPage } = await import("./page");

    await expect(
      GalleryPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
