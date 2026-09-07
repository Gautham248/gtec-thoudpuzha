import { unstable_cache } from "next/cache";
import { logger } from "@/lib/logger";
import type { PublicCourse } from "@/lib/courses";
import type { PublicCertificationPartner } from "@/lib/certification-partners";
import type { PublicFlashNewsItem } from "@/lib/flash-news";
import type { SiteSettingsWithCards } from "@/lib/site-settings";

export const getCachedSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsWithCards> => {
    const { getSiteSettings } = await import("@/lib/site-settings");
    try {
      return await getSiteSettings();
    } catch (err) {
      logger.exception("cache", "Failed to load site settings", err);
      throw err;
    }
  },
  ["site-settings"],
  { revalidate: 3600, tags: ["site-settings"] },
);

export const getCachedPublishedCourses = unstable_cache(
  async (): Promise<PublicCourse[]> => {
    const { getPublishedCourses } = await import("@/lib/courses");
    try {
      return await getPublishedCourses();
    } catch (err) {
      logger.exception("cache", "Failed to load published courses", err);
      throw err;
    }
  },
  ["published-courses"],
  { revalidate: 3600, tags: ["published-courses", "courses"] },
);

export const getCachedHomepageTeaser = unstable_cache(
  async () => {
    const { getHomepageTeaser } = await import("@/lib/news-events");
    try {
      return await getHomepageTeaser();
    } catch (err) {
      logger.exception("cache", "Failed to load homepage teaser", err);
      throw err;
    }
  },
  ["homepage-teaser"],
  { revalidate: 3600, tags: ["homepage-teaser", "news-events"] },
);

export const getCachedPlacementGalleryData = unstable_cache(
  async () => {
    const { getPlacementGalleryData } = await import("@/lib/gallery");
    try {
      return await getPlacementGalleryData();
    } catch (err) {
      logger.exception("cache", "Failed to load placement gallery", err);
      throw err;
    }
  },
  ["placement-gallery"],
  { revalidate: 3600, tags: ["placement-gallery", "gallery"] },
);

export const getCachedCertificationPartners = unstable_cache(
  async (): Promise<PublicCertificationPartner[]> => {
    const { getCertificationPartners } = await import(
      "@/lib/certification-partners"
    );
    try {
      return await getCertificationPartners();
    } catch (err) {
      logger.exception("cache", "Failed to load certification partners", err);
      throw err;
    }
  },
  ["cert-partners"],
  { revalidate: 3600, tags: ["cert-partners"] },
);

export const getCachedActiveFlashNews = (locale: "en" | "ml") =>
  unstable_cache(
    async (): Promise<PublicFlashNewsItem[]> => {
      const { getActiveFlashNews } = await import("@/lib/flash-news");
      return getActiveFlashNews(locale);
    },
    [`active-flash-news-${locale}`],
    { revalidate: 3600, tags: ["flash-news"] },
  )();

export const getCachedUpcomingEvents = unstable_cache(
  async (limit: number = 3) => {
    const { getUpcomingEvents } = await import("@/lib/news-events");
    try {
      return await getUpcomingEvents(limit);
    } catch (err) {
      logger.exception("cache", "Failed to load upcoming events", err);
      throw err;
    }
  },
  ["upcoming-events"],
  { revalidate: 3600, tags: ["upcoming-events", "news-events"] },
);


