import { Header } from "@/components/shared/Header";
import { FlashNewsBar } from "@/components/shared/FlashNewsBar";
import { Footer } from "@/components/shared/Footer";
import { getCachedSiteSettings } from "@/lib/data-cache";
import { getCachedPublishedCourses } from "@/lib/data-cache";
import { logger } from "@/lib/logger";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings: import("@/lib/site-settings").SiteSettingsWithCards | undefined;
  try {
    settings = await getCachedSiteSettings();
  } catch {
    logger.warn("public-layout", "Failed to load SiteSettings", {
      source: "getCachedSiteSettings",
    });
  }

  const courses = await getCachedPublishedCourses()
    .then((c) =>
      c.map(({ slug, titleEn, titleMl }) => ({
        slug,
        titleEn,
        titleMl,
      })),
    )
    .catch((err) => {
      logger.exception("public-layout", "Failed to load published courses", err);
      return [];
    });

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      <Header courses={courses} />
      <div className="min-h-[36px]">
        <FlashNewsBar />
      </div>
      <div className="flex-1 w-full max-w-full overflow-x-hidden">
        {children}
      </div>
      <Footer settings={settings} address={settings?.address} />
    </div>
  );
}
