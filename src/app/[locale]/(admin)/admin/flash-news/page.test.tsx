// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { auditLogEntry, flashNewsItem } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { form, session } from "@/__tests__/pg-fixtures";
import {
  createFlashNews,
  deleteFlashNews,
  moveFlashNews,
  toggleFlashNewsActive,
} from "./actions";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: vi.fn(),
}));

const pg = db as unknown as TestDb;

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
});

const ordered = () =>
  pg.query.flashNewsItem.findMany({
    orderBy: (f, { asc }) => asc(f.sortOrder),
  });

describe("createFlashNews", () => {
  test("creates an active item at the end of the list and writes an audit log entry", async () => {
    await pg.insert(flashNewsItem).values({ textEn: "Existing", sortOrder: 3 });

    await createFlashNews(form({ textEn: "New flash news", locale: "en" }));

    const items = await ordered();
    expect(items[1]).toMatchObject({
      textEn: "New flash news",
      textMl: null,
      link: null,
      expiresAt: null,
      active: true,
      sortOrder: 4,
    });

    const audits = await pg.select().from(auditLogEntry);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "flashNews.create",
      entityType: "FlashNewsItem",
      entityId: items[1].id,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/flash-news");
  });

  test("the first item gets sortOrder 1", async () => {
    await createFlashNews(form({ textEn: "First", locale: "en" }));
    expect((await ordered())[0].sortOrder).toBe(1);
  });
});

describe("other flash news actions", () => {
  test("toggle, move and delete change the rows", async () => {
    const [a, b] = await pg
      .insert(flashNewsItem)
      .values([
        { textEn: "A", sortOrder: 1 },
        { textEn: "B", sortOrder: 2 },
      ])
      .returning();

    await toggleFlashNewsActive(
      form({ id: a.id, active: "false", locale: "en" }),
    );
    expect((await ordered())[0].active).toBe(false);

    await moveFlashNews(form({ id: b.id, direction: "up", locale: "en" }));
    expect((await ordered()).map((i) => i.textEn)).toEqual(["B", "A"]);

    await deleteFlashNews(form({ id: a.id, locale: "en" }));
    expect((await ordered()).map((i) => i.textEn)).toEqual(["B"]);
  });
});

describe("FlashNewsPage", () => {
  test("is denied to a job_seeker-role user", async () => {
    mockAuth.mockResolvedValue(session("job_seeker_1", "JOB_SEEKER"));

    const { default: FlashNewsPage } = await import("./page");

    await expect(
      FlashNewsPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
