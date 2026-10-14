import { db } from "@/db";

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
    const items = await db.query.flashNewsItem.findMany({
      where: (f, { and, eq, gt, isNull, or }) =>
        and(eq(f.active, true), or(isNull(f.expiresAt), gt(f.expiresAt, now))),
      orderBy: (f, { asc }) => asc(f.sortOrder),
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
  return db.query.flashNewsItem.findMany({
    orderBy: (f, { asc }) => asc(f.sortOrder),
  });
}
