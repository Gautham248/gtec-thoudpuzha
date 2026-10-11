import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  createNewsEvent,
  togglePublishNewsEvent,
  deleteNewsEvent as _deleteNewsEvent,
} from "./actions";

const mockAuth = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
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
    newsEvent: {
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    auditLogEntry: {
      create: mockAuditCreate,
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: vi.fn(),
}));

describe("createNewsEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("writes an audit log entry when creating a news item", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockCreate.mockResolvedValue({
      id: "ne_1",
      type: "NEWS",
      titleEn: "Test news",
      titleMl: null,
      bodyEn: "Body content",
      bodyMl: null,
      coverImageUrl: null,
      eventDate: null,
      slug: "test-news",
      publishedAt: new Date("2026-07-23"),
    });

    mockAuditCreate.mockResolvedValue({
      id: "audit_1",
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "newsEvent.create",
      entityType: "NewsEvent",
      entityId: "ne_1",
    });

    const formData = new FormData();
    formData.append("type", "NEWS");
    formData.append("titleEn", "Test news");
    formData.append("bodyEn", "Body content");
    formData.append("locale", "en");
    formData.append("publishNow", "on");

    await createNewsEvent(formData);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        type: "NEWS",
        titleEn: "Test news",
        titleMl: null,
        bodyEn: "Body content",
        bodyMl: null,
        coverImageUrl: null,
        eventDate: null,
        slug: "test-news",
        publishedAt: expect.any(Date),
      },
    });

    expect(mockAuditCreate).toHaveBeenCalledTimes(1);
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "newsEvent.create",
        entityType: "NewsEvent",
        entityId: "ne_1",
      }),
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/news-events");
  });

  test("publishing a draft makes it immediately visible (revalidates public path)", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockUpdate.mockResolvedValue({
      id: "ne_1",
      type: "NEWS",
      titleEn: "Test news",
      publishedAt: new Date("2026-07-23"),
    });

    mockAuditCreate.mockResolvedValue({
      id: "audit_1",
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "newsEvent.publish",
      entityType: "NewsEvent",
      entityId: "ne_1",
    });

    const formData = new FormData();
    formData.append("id", "ne_1");
    formData.append("publish", "true");
    formData.append("locale", "en");

    await togglePublishNewsEvent(formData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "ne_1" },
      data: { publishedAt: expect.any(Date) },
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/news-events");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/news");
  });
});

describe("NewsEventsPage permission gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  test("is denied to a student-role user", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    const { default: NewsEventsPage } = await import("./page");

    await expect(
      NewsEventsPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
