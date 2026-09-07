import { prisma } from "@/lib/db";
import type { NewsEvent } from "@prisma/client";

export type PublicNewsEvent = Pick<
  NewsEvent,
  "id" | "type" | "titleEn" | "titleMl" | "bodyEn" | "bodyMl" | "coverImageUrl" | "eventDate" | "slug" | "publishedAt"
>;

export async function getPublishedNews(): Promise<PublicNewsEvent[]> {
  return prisma.newsEvent.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: {
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
    },
  });
}

export async function getNewsEventBySlug(
  slug: string,
): Promise<PublicNewsEvent | null> {
  return prisma.newsEvent.findFirst({
    where: { slug, publishedAt: { not: null } },
    select: {
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
    },
  });
}

export async function getHomepageTeaser() {
  try {
    const [newsItems, nextEvent] = await Promise.all([
      prisma.newsEvent.findMany({
        where: { publishedAt: { not: null }, type: "NEWS" },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          type: true,
          titleEn: true,
          titleMl: true,
          slug: true,
          publishedAt: true,
          eventDate: true,
        },
        take: 3,
      }),
      prisma.newsEvent.findFirst({
        where: { publishedAt: { not: null }, type: "EVENT" },
        orderBy: { eventDate: "asc" },
        select: {
          id: true,
          type: true,
          titleEn: true,
          titleMl: true,
          slug: true,
          publishedAt: true,
          eventDate: true,
        },
      }),
    ]);

    return { newsItems, nextEvent };
  } catch {
    return { newsItems: [], nextEvent: null };
  }
}

export async function getUpcomingEvents(limit: number = 3): Promise<PublicNewsEvent[]> {
  try {
    return await prisma.newsEvent.findMany({
      where: {
        publishedAt: { not: null },
        type: "EVENT",
      },
      orderBy: { eventDate: "asc" },
      take: limit,
      select: {
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
      },
    });
  } catch {
    return [];
  }
}
