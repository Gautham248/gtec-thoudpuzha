import type { MetadataRoute } from "next";
import { db } from "@/db";
import { logger } from "@/lib/logger";
import { routing } from "@/lib/i18n/routing";

export const dynamic = "force-dynamic";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gtec-thodupuzha.com"
).replace(/\/+$/, "");

const STATIC_PATHS = [
  "",
  "/about",
  "/courses",
  "/news",
  "/gallery",
  "/placement",
  "/contact",
  "/privacy",
  "/terms",
];

// One entry per locale, each listing every locale variant as an alternate.
function localizedEntries(
  path: string,
  lastModified: Date,
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
  );
  return routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries = STATIC_PATHS.flatMap((p) => localizedEntries(p, now));

  try {
    const [courses, news] = await Promise.all([
      db.query.course.findMany({
        where: (c, { eq }) => eq(c.status, "PUBLISHED"),
        columns: { slug: true, updatedAt: true },
      }),
      db.query.newsEvent.findMany({
        where: (n, { isNotNull }) => isNotNull(n.publishedAt),
        columns: { slug: true, updatedAt: true },
      }),
    ]);

    for (const c of courses) {
      entries.push(...localizedEntries(`/courses/${c.slug}`, c.updatedAt));
    }
    for (const n of news) {
      entries.push(...localizedEntries(`/news/${n.slug}`, n.updatedAt));
    }
  } catch (err) {
    logger.exception("sitemap", "Failed to load dynamic sitemap entries", err);
  }

  return entries;
}
