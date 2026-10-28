import { db } from "@/db";
import type { NewsEvent } from "@/db/types";

export type PublicNewsEvent = Pick<
  NewsEvent,
  "id" | "type" | "titleEn" | "titleMl" | "bodyEn" | "bodyMl" | "coverImageUrl" | "eventDate" | "slug" | "publishedAt"
>;

const PUBLIC_COLUMNS = {
  id: true,
  type: true,
  titleEn: true,
  titleMl: true,
  bodyEn: true,
  bodyMl: true,
  coverImageUrl: true,
  eventDate: true,
  slug: true,
  publishedAt: true,
} as const;

const TEASER_COLUMNS = {
  id: true,
  type: true,
  titleEn: true,
  titleMl: true,
  slug: true,
  publishedAt: true,
  eventDate: true,
} as const;

export async function getPublishedNews(): Promise<PublicNewsEvent[]> {
  return db.query.newsEvent.findMany({
    where: (n, { isNotNull }) => isNotNull(n.publishedAt),
    orderBy: (n, { desc }) => desc(n.publishedAt),
    columns: PUBLIC_COLUMNS,
  });
}

export async function getNewsEventBySlug(
  slug: string,
): Promise<PublicNewsEvent | null> {
  const item = await db.query.newsEvent.findFirst({
    where: (n, { and, eq, isNotNull }) =>
      and(eq(n.slug, slug), isNotNull(n.publishedAt)),
    columns: PUBLIC_COLUMNS,
  });
  return item ?? null;
}

/** `strict` rethrows a query failure so cached callers don't store an empty teaser. */
export async function getHomepageTeaser(options: { strict?: boolean } = {}) {
  try {
    const [newsItems, nextEvent] = await Promise.all([
      db.query.newsEvent.findMany({
        where: (n, { and, eq, isNotNull }) =>
          and(isNotNull(n.publishedAt), eq(n.type, "NEWS")),
        orderBy: (n, { desc }) => desc(n.publishedAt),
        columns: TEASER_COLUMNS,
        limit: 3,
      }),
      db.query.newsEvent.findFirst({
        where: (n, { and, eq, gte, isNotNull }) =>
          and(
            isNotNull(n.publishedAt),
            eq(n.type, "EVENT"),
            gte(n.eventDate, new Date()),
          ),
        orderBy: (n, { asc }) => asc(n.eventDate),
        columns: TEASER_COLUMNS,
      }),
    ]);

    return { newsItems, nextEvent: nextEvent ?? null };
  } catch (err) {
    if (options.strict) throw err;
    return { newsItems: [], nextEvent: null };
  }
}

export async function getUpcomingEvents(
  limit: number = 3,
  options: { strict?: boolean } = {},
): Promise<PublicNewsEvent[]> {
  try {
    return await db.query.newsEvent.findMany({
      where: (n, { and, eq, gte, isNotNull }) =>
        and(
          isNotNull(n.publishedAt),
          eq(n.type, "EVENT"),
          gte(n.eventDate, new Date()),
        ),
      orderBy: (n, { asc }) => asc(n.eventDate),
      limit,
      columns: PUBLIC_COLUMNS,
    });
  } catch (err) {
    if (options.strict) throw err;
    return [];
  }
}
