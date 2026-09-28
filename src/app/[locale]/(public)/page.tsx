import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";
import { HeroSection } from "@/components/shared/HeroSection";
import { CourseCategoryStrip } from "@/components/shared/CourseCategoryStrip";
import { StudentStoriesSection } from "@/components/shared/StudentStoriesSection";
import { FeaturedCoursesSection } from "@/components/shared/FeaturedCoursesSection";
import { CertificationPartnerStrip } from "@/components/shared/CertificationPartnerStrip";
import { LegacyStatsSection } from "@/components/shared/LegacyStatsSection";
import { AboutSection } from "@/components/shared/AboutSection";
import { PlacementSupportSection } from "@/components/shared/PlacementSupportSection";
import { NewsTeaserSection } from "@/components/shared/NewsTeaserSection";
import { MotionProvider, RevealNoScript } from "@/components/motion/Reveal";
import type { Locale } from "@/lib/site-settings";
import {
  getCachedSiteSettings,
  getCachedPublishedCourses,
  getCachedHomepageTeaser,
  getCachedPlacementGalleryData,
  getCachedCertificationPartners,
} from "@/lib/data-cache";

const ContactSection = dynamic(
  () =>
    import("@/components/shared/ContactSection").then(
      (mod) => mod.ContactSection,
    ),
  {
    loading: () => <div className="h-96 bg-muted/40" />,
  },
);

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;

  const [settings, courses, teaser, placementData, certPartners] =
    await Promise.all([
      getCachedSiteSettings(),
      getCachedPublishedCourses(),
      getCachedHomepageTeaser(),
      getCachedPlacementGalleryData(),
      getCachedCertificationPartners(),
    ]);

  const [heroT, aboutT, placementT, newsT, certT] =
    await Promise.all([
      getTranslations({ locale, namespace: "hero" }),
      getTranslations({ locale, namespace: "about" }),
      getTranslations({ locale, namespace: "placementSupport" }),
      getTranslations({ locale, namespace: "newsTeaser" }),
      getTranslations({ locale, namespace: "certPartners" }),
    ]);

  return (
    <main className="w-full overflow-x-hidden">
      <RevealNoScript />
      <MotionProvider>
      {/* 1. Hero Section (Figma #1:67) */}
      <HeroSection
        t={{
          badge: heroT("badge"),
          headline: heroT("headline"),
          subhead: heroT("subhead"),
          applyNow: heroT("applyNow"),
          whatsappUs: heroT("whatsappUs"),
          callNow: heroT("callNow"),
        }}
      />

      {/* 2. Course Category Banner (Figma #1:54) */}
      <CourseCategoryStrip />

      {/* 3. "Hear from our students" / "Why Choose Us" Showcase (Figma #1:146, #1:151) */}
      <StudentStoriesSection />

      {/* 4. "Featured Courses" / "GTEC at glance" (Figma #1:150, #1:147, #1:175) */}
      <FeaturedCoursesSection courses={courses} locale={locale} />

      {/* 5. "Our Partners" Certification Strip (Figma #1:148, #1:221) */}
      <CertificationPartnerStrip
        heading={certT("heading") || "Our Partners"}
        partners={certPartners}
      />

      {/* 6. Legacy & Statistics Showcase (Figma #1:137-#1:140, #1:223) */}
      <LegacyStatsSection />

      {/* 7. "About Us" Section with Dark Geometry (Figma #1:228) */}
      <AboutSection
        settings={settings}
        locale={locale}
        heading={aboutT("heading")}
        photoPlaceholder={aboutT("photoPlaceholder")}
      />

      {/* 8. Placement Support & Gallery Data */}
      <PlacementSupportSection
        data={placementData}
        heading={placementT("heading")}
        viewFullGallery={placementT("viewFullGallery")}
        ctaHeading={placementT("ctaHeading")}
        ctaText={placementT("ctaText")}
        viewVacancies={placementT("viewVacancies")}
        hiringCta={placementT("hiringCta")}
      />

      {/* 9. News & Events Teaser */}
      {teaser && (
        <NewsTeaserSection
          teaser={teaser}
          heading={newsT("heading")}
          viewAll={newsT("viewAll")}
          upcomingEventLabel={newsT("upcomingEvent")}
          locale={locale}
        />
      )}

      {/* 10. Contact & Interactive Enquiry Section */}
      <div id="enquiry">
        <ContactSection settings={settings} courses={courses} />
      </div>
      </MotionProvider>
    </main>
  );
}
