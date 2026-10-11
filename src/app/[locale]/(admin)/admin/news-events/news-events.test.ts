// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { auditLogEntry, newsEvent } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { form, session } from "@/__tests__/pg-fixtures";
import {
  createNewsEvent,
  deleteNewsEvent,
  togglePublishNewsEvent,
  updateNewsEvent,
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

async function insertNews(values: Partial<typeof newsEvent.$inferInsert> = {}) {
  const [row] = await pg
    .insert(newsEvent)
    .values({
      type: "NEWS",
      titleEn: "Draft",
      bodyEn: "Body",
      slug: "draft",
      ...values,
    })
    .returning();
  return row;
}

describe("createNewsEvent", () => {
  test("creates a published item with a slug and writes an audit log entry", async () => {
    await createNewsEvent(
      form({
        type: "NEWS",
        titleEn: "Test news!",
        bodyEn: "<p>Body content</p>",
        locale: "en",
        publishNow: "on",
      }),
    );

    const [item] = await pg.select().from(newsEvent);
    expect(item).toMatchObject({
      type: "NEWS",
      titleEn: "Test news!",
      titleMl: null,
      bodyEn: "Body content",
      bodyMl: null,
      coverImageUrl: null,
      eventDate: null,
      slug: "test-news",
    });
    expect(item.publishedAt).toBeInstanceOf(Date);

    const audits = await pg.select().from(auditLogEntry);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "newsEvent.create",
      entityType: "NewsEvent",
      entityId: item.id,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/news-events");
  });

  test("creates an unpublished draft when publishNow is not set", async () => {
    await createNewsEvent(
      form({
        type: "EVENT",
        titleEn: "Open day",
        bodyEn: "x",
        eventDate: "2026-12-01",
        locale: "en",
      }),
    );

    const [item] = await pg.select().from(newsEvent);
    expect(item.publishedAt).toBeNull();
    expect(item.eventDate?.toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });
});

describe("togglePublishNewsEvent", () => {
  test("publishing a draft makes it immediately visible (revalidates public path)", async () => {
    const draft = await insertNews();

    await togglePublishNewsEvent(
      form({ id: draft.id, publish: "true", locale: "en" }),
    );

    const [item] = await pg.select().from(newsEvent);
    expect(item.publishedAt).toBeInstanceOf(Date);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/news-events");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/news");
    const [audit] = await pg.select().from(auditLogEntry);
    expect(audit).toMatchObject({
      action: "newsEvent.publish",
      entityId: draft.id,
    });
  });

  test("unpublishing clears publishedAt", async () => {
    const live = await insertNews({ publishedAt: new Date() });

    await togglePublishNewsEvent(
      form({ id: live.id, publish: "false", locale: "en" }),
    );

    const [item] = await pg.select().from(newsEvent);
    expect(item.publishedAt).toBeNull();
  });

  test("fails for a missing item without writing an audit entry", async () => {
    await expect(
      togglePublishNewsEvent(
        form({ id: "gone", publish: "true", locale: "en" }),
      ),
    ).rejects.toThrow("News/event not found");
    expect(await pg.select().from(auditLogEntry)).toHaveLength(0);
  });
});

describe("updateNewsEvent / deleteNewsEvent", () => {
  test("update changes content but keeps slug and publish state", async () => {
    const item = await insertNews({ publishedAt: new Date("2026-07-01") });

    await updateNewsEvent(
      form({
        id: item.id,
        type: "EVENT",
        titleEn: "Renamed",
        bodyEn: "New body",
        locale: "en",
      }),
    );

    const [updated] = await pg.select().from(newsEvent);
    expect(updated).toMatchObject({
      type: "EVENT",
      titleEn: "Renamed",
      bodyEn: "New body",
      slug: "draft",
    });
    expect(updated.publishedAt?.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  test("delete removes the row and audits it", async () => {
    const item = await insertNews();

    await deleteNewsEvent(form({ id: item.id, locale: "en" }));

    expect(await pg.select().from(newsEvent)).toHaveLength(0);
    const [audit] = await pg.select().from(auditLogEntry);
    expect(audit).toMatchObject({
      action: "newsEvent.delete",
      entityId: item.id,
    });
  });
});

describe("NewsEventsPage permission gate", () => {
  test("is denied to a student-role user", async () => {
    mockAuth.mockResolvedValue(session("student_1", "STUDENT"));

    const { default: NewsEventsPage } = await import("./page");

    await expect(
      NewsEventsPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
