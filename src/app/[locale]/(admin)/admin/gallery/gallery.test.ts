// @vitest-environment node

import { describe, expect, test, vi, beforeEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockItemCreate = vi.hoisted(() => vi.fn());
const mockItemAggregate = vi.hoisted(() => vi.fn());
const mockItemDelete = vi.hoisted(() => vi.fn());
const mockItemFindMany = vi.hoisted(() => vi.fn());
const mockCatAggregate = vi.hoisted(() => vi.fn());
const mockAuditCreate = vi.hoisted(() => vi.fn());
const mockUploadFile = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

const mockUserFindUnique = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    galleryItem: {
      create: mockItemCreate,
      aggregate: mockItemAggregate,
      delete: mockItemDelete,
      findMany: mockItemFindMany,
    },
    galleryCategory: {
      aggregate: mockCatAggregate,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    auditLogEntry: {
      create: mockAuditCreate,
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAdminAction: mockAuditCreate,
}));

vi.mock("@/lib/storage", () => ({
  uploadFile: mockUploadFile,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: vi.fn(),
}));

/* ─── Helpers ─── */

function setMockAuth(userId: string, role: string) {
  mockAuth.mockResolvedValue({
    userId,
    sessionClaims: { metadata: { role } },
  });
}

function fakeFile(name: string, type: string): File {
  return new File([Buffer.from("fake-image-data")], name, { type });
}

/* ─── Tests ─── */

describe("uploadGalleryImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItemCreate.mockReset();
    mockItemAggregate.mockReset();
    mockCatAggregate.mockReset();
    mockAuditCreate.mockReset();
    mockUploadFile.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("1. bulk-uploading 3 images to a category creates 3 GalleryItem rows", async () => {
    setMockAuth("staff_1", "CENTRE_STAFF");

    mockCatAggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
    mockItemAggregate.mockResolvedValue({ _max: { sortOrder: -1 } });

    let callCount = 0;
    mockItemCreate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        callCount++;
        return Promise.resolve({
          id: `gi_${callCount}`,
          categoryId: data.categoryId,
          mediaType: data.mediaType,
          url: data.url,
          captionEn: data.captionEn ?? null,
          captionMl: data.captionMl ?? null,
          sortOrder: data.sortOrder,
          createdAt: new Date(),
        });
      },
    );

    mockUploadFile.mockResolvedValue("gallery/12345-img1.png");

    const formData = new FormData();
    formData.append("locale", "en");
    formData.append("categoryId", "cat_1");
    formData.append("files", fakeFile("img1.png", "image/png"));
    formData.append("files", fakeFile("img2.png", "image/png"));
    formData.append("files", fakeFile("img3.png", "image/png"));

    const { uploadGalleryImages } = await import("./actions");
    await uploadGalleryImages(formData);

    expect(mockItemCreate).toHaveBeenCalledTimes(3);
    expect(callCount).toBe(3);

    expect(mockItemCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        categoryId: "cat_1",
        mediaType: "IMAGE",
      }),
    });
  });

  test("2. bulk upload writes exactly one audit log entry summarizing the batch", async () => {
    setMockAuth("staff_1", "CENTRE_STAFF");

    mockCatAggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
    mockItemAggregate.mockResolvedValue({ _max: { sortOrder: -1 } });

    mockUploadFile.mockResolvedValue("gallery/12345-img.png");

    let callCount = 0;
    mockItemCreate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        callCount++;
        return Promise.resolve({
          id: `gi_${callCount}`,
          categoryId: data.categoryId,
          mediaType: data.mediaType,
          url: data.url,
          captionEn: null,
          captionMl: null,
          sortOrder: data.sortOrder,
          createdAt: new Date(),
        });
      },
    );

    const formData = new FormData();
    formData.append("locale", "en");
    formData.append("categoryId", "cat_1");
    formData.append("files", fakeFile("a.png", "image/png"));
    formData.append("files", fakeFile("b.png", "image/png"));

    const { uploadGalleryImages } = await import("./actions");
    await uploadGalleryImages(formData);

    // Audit called once, not per file
    expect(mockAuditCreate).toHaveBeenCalledTimes(1);
    expect(mockAuditCreate).toHaveBeenCalledWith({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "gallery.bulkUpload",
      entityType: "GalleryItem",
      entityId: "cat_1",
      metadata: expect.objectContaining({
        categoryId: "cat_1",
        count: 2,
        itemIds: ["gi_1", "gi_2"],
      }),
    });
  });
});

describe("addVideoItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItemCreate.mockReset();
    mockItemAggregate.mockReset();
    mockAuditCreate.mockReset();
    mockUploadFile.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("3. adding a VIDEO-type item stores the external URL without attempting an R2 upload", async () => {
    setMockAuth("staff_1", "CENTRE_STAFF");

    mockItemAggregate.mockResolvedValue({ _max: { sortOrder: -1 } });

    mockItemCreate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: "gi_video_1",
          categoryId: data.categoryId,
          mediaType: data.mediaType,
          url: data.url,
          captionEn: data.captionEn ?? null,
          captionMl: data.captionMl ?? null,
          sortOrder: data.sortOrder,
          createdAt: new Date(),
        }),
    );

    const formData = new FormData();
    formData.append("locale", "en");
    formData.append("categoryId", "cat_1");
    formData.append("url", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    formData.append("captionEn", "A cool video");

    const { addVideoItem } = await import("./actions");
    await addVideoItem(formData);

    // Stored with the external URL
    expect(mockItemCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        categoryId: "cat_1",
        mediaType: "VIDEO",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        captionEn: "A cool video",
      }),
    });

    // R2 uploadFile should NOT have been called
    expect(mockUploadFile).not.toHaveBeenCalled();

    // Audit logged
    expect(mockAuditCreate).toHaveBeenCalledTimes(1);
    expect(mockAuditCreate).toHaveBeenCalledWith({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "gallery.addVideo",
      entityType: "GalleryItem",
      entityId: "gi_video_1",
      metadata: expect.objectContaining({
        categoryId: "cat_1",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      }),
    });
  });
});

describe("GalleryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  test("4. /admin/gallery is denied to an employer-role user (403)", async () => {
    mockAuth.mockResolvedValue({
      userId: "employer_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    const { default: GalleryPage } = await import("./page");

    await expect(
      GalleryPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
