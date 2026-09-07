import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { GraduationCap, Star } from "lucide-react";
import { HeroSection } from "@/components/shared/HeroSection";
import { AtAGlanceSection } from "@/components/shared/AtAGlanceSection";
import { AboutSection } from "@/components/shared/AboutSection";
import { WhyChooseUsSection } from "@/components/shared/WhyChooseUsSection";
import { PlacementSupportSection } from "@/components/shared/PlacementSupportSection";
import { CertificationPartnerStrip } from "@/components/shared/CertificationPartnerStrip";
import { EventsSection } from "@/components/shared/EventsSection";
import { FeaturedCoursesSection } from "@/components/shared/FeaturedCoursesSection";
import type { Locale } from "@/lib/site-settings";
import {
  getCachedSiteSettings,
  getCachedPublishedCourses,
  getCachedPlacementGalleryData,
  getCachedCertificationPartners,
  getCachedUpcomingEvents,
} from "@/lib/data-cache";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;

  const [settings, courses, placementData, certPartners, events] =
    await Promise.all([
      getCachedSiteSettings(),
      getCachedPublishedCourses(),
      getCachedPlacementGalleryData(),
      getCachedCertificationPartners(),
      getCachedUpcomingEvents(3),
    ]);

  const [heroT, aboutT, atAGlanceT, whyT, placementT, certT] =
    await Promise.all([
      getTranslations({ locale, namespace: "hero" }),
      getTranslations({ locale, namespace: "about" }),
      getTranslations({ locale, namespace: "atAGlance" }),
      getTranslations({ locale, namespace: "whyChooseUs" }),
      getTranslations({ locale, namespace: "placementSupport" }),
      getTranslations({ locale, namespace: "certPartners" }),
    ]);

  return (
    <main className="relative flex flex-col w-full min-h-screen">
      {/* Hero & Visual Showcase Section */}
      <section className="relative overflow-hidden py-8 sm:py-12 lg:py-16">
        {/* Dynamic Blue Waves Background Image */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none bg-sky-50/40 dark:bg-slate-950/40"
          aria-hidden="true"
        >
          <Image
            src="/images/hero-waves-bg.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-bottom sm:object-center opacity-55 dark:opacity-30"
          />
          {/* Soft ambient gradient overlay for smooth contrast and seamless blending */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-16">
            {/* Left Content Column (Wider for Natural 2-Line Headline) */}
            <div className="lg:col-span-7 flex flex-col justify-center z-10">
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
            </div>

            {/* Right Visual Showcase Column with New High-Res Image & Modern UI */}
            <div className="relative lg:col-span-5 flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[480px] sm:max-w-[500px] lg:max-w-[520px]">
                {/* Smooth, elegant blue curved backdrop naturally framing the image */}
                <div
                  className="pointer-events-none absolute -inset-3 sm:-inset-4 -z-10 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-tr from-primary via-primary/95 to-blue-600 opacity-95 dark:opacity-85 shadow-xl transform rotate-1 sm:rotate-2"
                  aria-hidden="true"
                />

                {/* Subtle ambient blur glow */}
                <div
                  className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 -z-20 rounded-full bg-primary/25 blur-2xl"
                  aria-hidden="true"
                />

                {/* Subtle Dotted Pattern Accent (top right) */}
                <div
                  className="pointer-events-none absolute -right-3 -top-3 sm:-right-4 sm:-top-4 h-20 w-20 z-0 opacity-30"
                  aria-hidden="true"
                >
                  <svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="ref-hero-dots-subtle" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.2" fill="#ffffff" fillOpacity="0.9" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#ref-hero-dots-subtle)" />
                  </svg>
                </div>

                {/* Primary Photograph Frame */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/80 dark:border-white/10 bg-card shadow-2xl transition-all duration-500 hover:shadow-primary/20">
                  <Image
                    src="/images/hero-main-student.jpg"
                    alt="Student learning software development at modern IT workstation at G-TEC Thodupuzha"
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 42vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>

                {/* Floating Glassmorphism Badge 1: Placement Support (Top-Left) */}
                <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 z-20 flex items-center gap-2.5 rounded-2xl border border-white/80 dark:border-white/20 bg-background/95 backdrop-blur-md px-3.5 py-2 shadow-lg transition-transform duration-300 hover:scale-105">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                    <GraduationCap className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">100% Placement</p>
                    <p className="text-xs text-muted-foreground font-medium">Assistance Support</p>
                  </div>
                </div>

                {/* Floating Glassmorphism Badge 2: Rating & Certified (Bottom-Right) */}
                <div className="absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-3 z-20 flex items-center gap-2.5 rounded-2xl border border-white/80 dark:border-white/20 bg-background/95 backdrop-blur-md px-3.5 py-2 shadow-lg transition-transform duration-300 hover:scale-105">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                    <Star className="size-4.5 fill-current" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-foreground leading-tight">4.9/5 Rating</p>
                    <p className="text-xs text-muted-foreground font-medium">30+ Yrs Global Legacy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Numerical Highlights */}
      <AtAGlanceSection
        heading={atAGlanceT("heading")}
        settings={settings}
      />

      {/* Featured Courses Showcase */}
      <FeaturedCoursesSection courses={courses} locale={locale} />

      {/* About Institution */}
      <AboutSection
        settings={settings}
        locale={locale}
        heading={aboutT("heading")}
        photoPlaceholder={aboutT("photoPlaceholder")}
      />

      {/* Why Choose Us */}
      <WhyChooseUsSection
        heading={whyT("heading")}
        settings={settings}
        locale={locale}
      />

      {/* Certification Partners */}
      <CertificationPartnerStrip
        heading={certT("heading")}
        partners={certPartners}
      />

      {/* Campus Happenings & Upcoming Events */}
      <EventsSection events={events} locale={locale} />

      {/* Placement Support & Student Success */}
      <PlacementSupportSection
        data={placementData}
        heading={placementT("heading")}
        viewFullGallery={placementT("viewFullGallery")}
        ctaHeading={placementT("ctaHeading")}
        ctaText={placementT("ctaText")}
        viewVacancies={placementT("viewVacancies")}
        hiringCta={placementT("hiringCta")}
      />
    </main>
  );
}

