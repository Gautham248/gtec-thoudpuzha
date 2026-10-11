import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { resetMockDb, setMockRows } from "@/__tests__/drizzle-mock";

vi.mock("@/db", async () => (await import("@/__tests__/drizzle-mock")).mockDbModule());

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

function item(
  slug: string,
  type: "NEWS" | "EVENT",
  publishedAt: Date | null,
  eventDate: Date | null = null,
) {
  return {
    id: `id_${slug}`,
    slug,
    type,
    titleEn: slug,
    titleMl: null,
    bodyEn: "Body",
    bodyMl: null,
    coverImageUrl: null,
    eventDate,
    publishedAt,
  };
}

beforeEach(() => {
  resetMockDb(db);
});

describe("/news listing page", () => {
  test("only lists published items, newest first", async () => {
    setMockRows(db, "newsEvent", [
      item("older", "NEWS", new Date("2026-07-20")),
      item("draft", "NEWS", null),
      item("newer", "NEWS", new Date("2026-07-22")),
    ]);

    const { getPublishedNews } = await import("@/lib/news-events");
    const result = await getPublishedNews();

    expect(result.map((r) => r.slug)).toEqual(["newer", "older"]);
  });
});

describe("/news/[slug] detail page", () => {
  test("for an unpublished item returns 404", async () => {
    setMockRows(db, "newsEvent", [item("unpublished-draft", "NEWS", null)]);

    const { default: NewsDetailPage } = await import("./[slug]/page");

    await expect(
      NewsDetailPage({
        params: Promise.resolve({ locale: "en", slug: "unpublished-draft" }),
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  test("for a non-existent slug returns 404", async () => {
    setMockRows(db, "newsEvent", [item("something-else", "NEWS", new Date())]);

    const { default: NewsDetailPage } = await import("./[slug]/page");

    await expect(
      NewsDetailPage({
        params: Promise.resolve({ locale: "en", slug: "does-not-exist" }),
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  test("returns a published item by slug", async () => {
    setMockRows(db, "newsEvent", [item("launch", "NEWS", new Date("2026-07-22"))]);

    const { getNewsEventBySlug } = await import("@/lib/news-events");

    expect((await getNewsEventBySlug("launch"))?.slug).toBe("launch");
  });
});

describe("Homepage teaser", () => {
  test("returns the 3 latest NEWS items and the next upcoming EVENT", async () => {
    setMockRows(db, "newsEvent", [
      item("news-1", "NEWS", daysFromNow(-1)),
      item("news-2", "NEWS", daysFromNow(-2)),
      item("news-3", "NEWS", daysFromNow(-3)),
      item("news-4", "NEWS", daysFromNow(-4)),
      item("news-draft", "NEWS", null),
      item("past-event", "EVENT", daysFromNow(-30), daysFromNow(-5)),
      item("later-event", "EVENT", daysFromNow(-10), daysFromNow(20)),
      item("next-event", "EVENT", daysFromNow(-10), daysFromNow(3)),
      item("draft-event", "EVENT", null, daysFromNow(1)),
    ]);

    const { getHomepageTeaser } = await import("@/lib/news-events");
    const result = await getHomepageTeaser();

    expect(result.newsItems.map((i) => i.slug)).toEqual(["news-1", "news-2", "news-3"]);
    expect(result.nextEvent?.slug).toBe("next-event");
  });

  test("has no next event when every event is in the past", async () => {
    setMockRows(db, "newsEvent", [
      item("past-event", "EVENT", daysFromNow(-30), daysFromNow(-5)),
    ]);

    const { getHomepageTeaser } = await import("@/lib/news-events");

    expect((await getHomepageTeaser()).nextEvent).toBeNull();
  });
});
