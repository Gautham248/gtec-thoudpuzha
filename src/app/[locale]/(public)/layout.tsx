import { Header } from "@/components/shared/Header";
import { FlashNewsBar } from "@/components/shared/FlashNewsBar";
import { Footer } from "@/components/shared/Footer";
import { getCachedSiteSettings } from "@/lib/data-cache";
import { getCachedPublishedCourses } from "@/lib/data-cache";
import { logger } from "@/lib/logger";
import { toNavCourse } from "@/lib/nav-courses";
import { EnquiryModalProvider } from "@/components/enquiry/EnquiryModal";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let address: string | null | undefined;
  try {
    const settings = await getCachedSiteSettings();
    address = settings.address;
  } catch {
    logger.warn("public-layout", "Failed to load SiteSettings", {
      source: "getCachedSiteSettings",
    });
  }

  const courses = await getCachedPublishedCourses()
    .then((c) => c.map(toNavCourse))
    .catch((err) => {
      logger.exception(
        "public-layout",
        "Failed to load published courses",
        err,
      );
      return [];
    });
  return (
    <EnquiryModalProvider courses={courses}>
      <div className="relative min-h-screen w-full flex flex-col">
        <FlashNewsBar />
        <Header courses={courses} />
        <div className="flex-1 w-full max-w-full overflow-x-hidden">
          {children}
        </div>
        <Footer address={address} />
      </div>
    </EnquiryModalProvider>
  );
}
