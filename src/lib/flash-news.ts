import { prisma } from "@/lib/db";

export interface PublicFlashNewsItem {
  id: string;
  text: string;
  link: string | null;
}

export async function getActiveFlashNews(
  locale: "en" | "ml",
): Promise<PublicFlashNewsItem[]> {
  try {
    const now = new Date();
    const items = await prisma.flashNewsItem.findMany({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { sortOrder: "asc" },
    });

    return items.map((item) => ({
      id: item.id,
      text: locale === "ml" && item.textMl ? item.textMl : item.textEn,
      link: item.link,
    }));
  } catch {
    return [];
  }
}

export async function getAllFlashNews() {
  return prisma.flashNewsItem.findMany({
    orderBy: { sortOrder: "asc" },
  });
}
