import { describe, expect, test, vi, beforeEach } from "vitest";
import { createFlashNews } from "./actions";
import { db } from "@/db";
import { getInsertedRows } from "@/__tests__/drizzle-mock";

const mockAuth = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockAggregate = vi.hoisted(() => vi.fn());
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
    flashNewsItem: {
      create: mockCreate,
      aggregate: mockAggregate,
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
  revalidateTag: vi.fn(),
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

describe("createFlashNews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
    mockAggregate.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("writes an audit log entry when creating a flash news item", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockCreate.mockResolvedValue({
      id: "fn_1",
      textEn: "New flash news",
      textMl: null,
      link: null,
      active: true,
      expiresAt: null,
      sortOrder: 1,
    });

    mockAggregate.mockResolvedValue({ _max: { sortOrder: 0 } });

    mockAuditCreate.mockResolvedValue({
      id: "audit_1",
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "flashNews.create",
      entityType: "FlashNewsItem",
      entityId: "fn_1",
    });

    const formData = new FormData();
    formData.append("textEn", "New flash news");
    formData.append("locale", "en");

    await createFlashNews(formData);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        textEn: "New flash news",
        textMl: null,
        link: null,
        expiresAt: null,
        sortOrder: 1,
      },
    });

    expect(auditEntries()).toHaveLength(1);
    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "flashNews.create",
        entityType: "FlashNewsItem",
        entityId: "fn_1",
      }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/flash-news");
  });
});

describe("FlashNewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  test("is denied to a job_seeker-role user", async () => {
    mockAuth.mockResolvedValue({
      userId: "job_seeker_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });

    const { default: FlashNewsPage } = await import("./page");

    await expect(
      FlashNewsPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
