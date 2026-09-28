import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Briefcase,
  Globe,
  Headphones,
  MapPin,
  Navigation,
  Phone,
  PhoneCall,
  Users,
} from "lucide-react";
import type { WhyCardIcon } from "@prisma/client";
import {
  getAtAGlanceStats,
  getLocalizedAbout,
  getLocalizedWhyCards,
  getSiteSettings,
  type Locale,
} from "@/lib/site-settings";
import { getPublishedCourses } from "@/lib/courses";
import { collectCategories } from "@/lib/course-filters";
import { getMediaUrl } from "@/lib/media";
import { siteConfig } from "@/lib/site";
import { Link } from "@/lib/i18n/navigation";
import { CourseHeroBackdrop } from "@/components/courses/CourseHero";
import { CertificationPartnerStrip } from "@/components/shared/CertificationPartnerStrip";
import { AboutPillars } from "@/components/about/AboutPillars";
import { CountUp } from "@/components/about/CountUp";
import { AboutIntro } from "@/components/about/AboutIntro";
import { EnquiryButton } from "@/components/enquiry/EnquiryModal";
import {
  MotionProvider,
  Reveal,
  RevealGroup,
  RevealItem,
  RevealNoScript,
} from "@/components/motion/Reveal";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("heading"),
    description:
      locale === "ml"
        ? "ജി-ടെക് എഡ്യൂക്കേഷൻ തൊടുപുഴയെക്കുറിച്ച് അറിയുക. 25-ൽ പരം വർഷത്തെ പാരമ്പര്യവും ലോകോത്തര കോഴ്സുകളും."
        : "Learn more about G-TEC Education Thodupuzha. Over 25+ years of excellence in IT, Multimedia, Accounting, and Spoken English education.",
  };
}

const whyIcons: Record<
  WhyCardIcon,
  React.ComponentType<{ className?: string }>
> = {
  AWARD: Award,
  USERS: Users,
  BOOK_OPEN: BookOpen,
  BRIEFCASE: Briefcase,
  GLOBE: Globe,
  HEADPHONES: Headphones,
};

const FALLBACK_ADDRESS =
  "G-TEC Education, Temple Bypass Road, Near Private Bus Stand, Thodupuzha, Idukki District, Kerala - 685584.";

// Used when a category has no course with a cover image.
const PROGRAMME_FALLBACK_IMAGES = [
  "/images/figma/legacy-students-62c433.png",
  "/images/figma/course-hero-photo.png",
  "/images/figma/course-web-dev-5d2ce9.png",
];

const pillBase =
  "group inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-sm font-semibold shadow-lg transition-all active:scale-[0.98] sm:text-base";

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  const isMl = locale === "ml";

  const [settings, courses, aboutT, aboutPageT, atAGlanceT, whyT, certT] =
    await Promise.all([
      getSiteSettings(),
      getPublishedCourses().catch(() => []),
      getTranslations({ locale, namespace: "about" }),
      getTranslations({ locale, namespace: "aboutPage" }),
      getTranslations({ locale, namespace: "atAGlance" }),
      getTranslations({ locale, namespace: "whyChooseUs" }),
      getTranslations({ locale, namespace: "certPartners" }),
    ]);

  const about = getLocalizedAbout(settings, locale);
  const aboutPhoto = about.photoUrl
    ? getMediaUrl(about.photoUrl)
    : "/images/figma/legacy-students-62c433.png";
  const stats = getAtAGlanceStats(settings).filter((s) => s.value);
  const whyCards = getLocalizedWhyCards(settings, locale);
  const address = settings.address || FALLBACK_ADDRESS;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const programmes = collectCategories(courses)
    .slice(0, 3)
    .map((cat, i) => {
      const cover = courses.find(
        (c) => c.category?.id === cat.id && c.coverImageUrl,
      )?.coverImageUrl;
      return {
        ...cat,
        name: isMl && cat.nameMl ? cat.nameMl : cat.nameEn,
        image: cover ? getMediaUrl(cover) : PROGRAMME_FALLBACK_IMAGES[i],
      };
    });

  const pillars = [
    { title: aboutPageT("missionTitle"), text: aboutPageT("missionText") },
    { title: aboutPageT("visionTitle"), text: aboutPageT("visionText") },
    { title: aboutPageT("valuesTitle"), text: aboutPageT("valuesText") },
  ];

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-white">
      <RevealNoScript />
      <MotionProvider>
        {/* ── Hero ── */}
        <section className="relative w-full overflow-hidden rounded-b-[40px] bg-linear-to-b from-[#1759CF] from-[6.49%] to-[#0A2B68] text-white sm:rounded-b-[56px] lg:rounded-b-[80px]">
          <CourseHeroBackdrop />
          <RevealGroup
            stagger={0.09}
            className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 pt-32 pb-20 text-center sm:px-6 sm:pt-36 sm:pb-24 lg:pt-[172px] lg:pb-[120px]"
          >
            <RevealItem>
              <span className="inline-flex items-center rounded-full bg-linear-to-r from-[#9A9A9A] via-[#E8E8E8] to-[#DFDFDF] px-4 py-1.5 text-xs font-semibold uppercase tracking-tight text-black sm:text-sm">
                {aboutPageT("badge")}
              </span>
            </RevealItem>
            <RevealItem>
              <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-[-0.04em] sm:text-5xl lg:text-[56px]">
                {aboutPageT("title")}
              </h1>
            </RevealItem>
            <RevealItem>
              <p className="mt-5 max-w-2xl text-base font-light leading-[1.5] tracking-[-0.02em] text-white/80 sm:text-lg">
                {aboutPageT("subtitle")}
              </p>
            </RevealItem>
            <RevealItem className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="/courses"
                className={`${pillBase} bg-[#0B1220] hover:bg-black`}
              >
                {aboutPageT("exploreCourses")}
                <span className="flex size-9 items-center justify-center rounded-full bg-[#1753DA] transition-transform group-hover:scale-105">
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
              <EnquiryButton
                source="about-hero"
                className={`${pillBase} bg-white text-[#111827] hover:bg-zinc-100`}
              >
                {aboutPageT("contactUs")}
                <span className="flex size-9 items-center justify-center rounded-full bg-[#F2F4F7] text-[#111827] transition-transform group-hover:scale-105">
                  <PhoneCall className="size-4" aria-hidden="true" />
                </span>
              </EnquiryButton>
            </RevealItem>
          </RevealGroup>
        </section>

        {/* ── Mission / Vision / Values ── */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Reveal className="mb-14 border-b border-[#EAECF0] pb-14 sm:mb-20 sm:pb-20">
            <AboutIntro
              eyebrow={aboutT("heading")}
              heading={isMl ? "ഞങ്ങൾ ആരാണ്" : "Who we are"}
              body={
                about.body ||
                "G-TEC Education Centre Thodupuzha delivers industry-certified career coaching, bridging academic skills with high-demand job market requirements."
              }
              readMore={isMl ? "കൂടുതൽ വായിക്കുക" : "Read more"}
              showLess={isMl ? "കുറച്ച് കാണിക്കുക" : "Show less"}
            />
          </Reveal>
          <Reveal y={36}>
            <AboutPillars
              pillars={pillars}
              images={[
                aboutPhoto,
                "/images/figma/course-hero-photo.png",
                "/images/figma/hero-person.png",
              ]}
            />
          </Reveal>
        </section>

        {/* ── At a glance ── */}
        {stats.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal y={40}>
              <div className="rounded-[32px] bg-linear-to-br from-[#F2F4F7] via-[#F9FAFB] to-[#EEF2F6] p-6 sm:p-10 lg:rounded-[40px] lg:p-14">
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
                  <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] text-[#111827] sm:text-4xl">
                    {atAGlanceT("heading")}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#667085] sm:text-base">
                    {aboutPageT("subtitle")}
                  </p>
                </div>

                <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
                  <div className="relative aspect-4/3 overflow-hidden rounded-[24px] shadow-xl">
                    <Image
                      src={aboutPhoto}
                      alt="G-TEC Thodupuzha centre"
                      fill
                      sizes="(max-width: 1024px) 100vw, 480px"
                      className="object-cover"
                    />
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#2EB700] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      Thodupuzha, Kerala
                    </span>
                  </div>

                  <div>
                    <RevealGroup
                      stagger={0.1}
                      className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10"
                    >
                      {stats.map((stat) => (
                        <RevealItem key={stat.label}>
                          <CountUp
                            value={String(stat.value)}
                            className="block text-4xl font-bold tracking-[-0.05em] text-[#111827] sm:text-5xl"
                          />
                          <span className="mt-1 block text-sm font-medium text-[#667085]">
                            {stat.label}
                          </span>
                        </RevealItem>
                      ))}
                    </RevealGroup>
                    <Link
                      href="/courses"
                      className={`${pillBase} mt-10 bg-[#0B1220] text-white hover:bg-black`}
                    >
                      {aboutPageT("exploreCourses")}
                      <span className="flex size-9 items-center justify-center rounded-full bg-[#2EB700] transition-transform group-hover:scale-105">
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* ── Programmes by category ── */}
        {programmes.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <Reveal className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] text-[#111827] sm:text-4xl">
                {isMl
                  ? "ഓരോ കരിയർ ഘട്ടത്തിനുമുള്ള പ്രോഗ്രാമുകൾ"
                  : "Programmes designed for every stage of your career"}
              </h2>
            </Reveal>
            <RevealGroup
              stagger={0.12}
              className="grid grid-cols-1 items-center gap-6 sm:grid-cols-3 sm:gap-5 lg:gap-8"
            >
              {programmes.map((prog, i) => {
                const middle = programmes.length === 3 && i === 1;
                return (
                  <RevealItem key={prog.id} y={40}>
                    <Link
                      href={`/courses?category=${prog.slug}`}
                      className={`group relative block overflow-hidden rounded-[24px] shadow-xl ${
                        middle
                          ? "aspect-4/3 sm:aspect-4/5"
                          : "aspect-4/3 sm:aspect-square"
                      }`}
                    >
                      <Image
                        src={prog.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 420px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-[#0B1220]/90 via-[#0B1220]/50 to-transparent p-5 pt-16">
                        <div className="min-w-0 text-white">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                            {isMl ? "പ്രോഗ്രാമുകൾ" : "Programmes in"} ·{" "}
                            {prog.count}
                          </p>
                          <p className="mt-0.5 truncate text-lg font-semibold uppercase tracking-tight">
                            {prog.name}
                          </p>
                        </div>
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2EB700] text-white transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                          <ArrowUpRight className="size-5" aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </section>
        )}

        {/* ── Why choose us ── */}
        {whyCards.length > 0 && (
          <section className="bg-[#F9FAFB] py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal className="mb-12 text-center sm:mb-16">
                <p className="text-base font-semibold tracking-[-0.05em] text-[#B4B4B4] sm:text-xl">
                  G-TEC
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#111827] sm:text-5xl">
                  {whyT("heading")}
                </h2>
              </Reveal>
              <RevealGroup
                stagger={0.08}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {whyCards.map((card) => {
                  const Icon = whyIcons[card.icon] ?? Award;
                  return (
                    <RevealItem key={card.id} className="h-full">
                      <div className="group h-full rounded-[24px] border border-[#EAECF0] bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF2FF] text-[#1753DA] transition-colors group-hover:bg-[#1753DA] group-hover:text-white">
                          <Icon className="size-6" />
                        </span>
                        <h3 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-[#111827]">
                          {card.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#667085] sm:text-base">
                          {card.description}
                        </p>
                      </div>
                    </RevealItem>
                  );
                })}
              </RevealGroup>
            </div>
          </section>
        )}

        {/* ── Partners ── */}
        <CertificationPartnerStrip heading={certT("heading")} />

        {/* ── Closing CTA + centre card ── */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <Reveal y={40}>
            <div className="relative overflow-hidden rounded-[32px] bg-[#F2F4F7] lg:rounded-[40px]">
              <div className="grid lg:grid-cols-2">
                {/* Dark panel with a curved right edge on desktop */}
                <div className="relative bg-[#0B1220] px-6 py-10 text-white sm:px-10 sm:py-14 lg:rounded-r-[160px] lg:py-16 lg:pr-24">
                  <div
                    className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-tr-[1457px] bg-[#810000]/40"
                    aria-hidden="true"
                  />
                  <h2 className="relative text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
                    {isMl
                      ? "ഇന്ന് തന്നെ G-TEC-ൽ നിങ്ങളുടെ കരിയർ ആരംഭിക്കൂ"
                      : "Start your career with G-TEC today"}
                  </h2>
                  <p className="relative mt-4 max-w-md text-sm text-white/70 sm:text-base">
                    {aboutPageT("subtitle")}
                  </p>
                  <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <EnquiryButton
                      source="about-cta"
                      className={`${pillBase} bg-[#2EB700] hover:bg-[#28a100]`}
                    >
                      {isMl ? "ഇപ്പോൾ ചേരുക" : "Enroll Now"}
                      <span className="flex size-9 items-center justify-center rounded-full bg-[#0B1220] transition-transform group-hover:scale-105">
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </span>
                    </EnquiryButton>
                    <a
                      href={`https://wa.me/${siteConfig.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-2 text-sm font-semibold text-white/90 underline-offset-4 hover:underline sm:text-base"
                    >
                      {aboutPageT("getInTouch")} →
                    </a>
                  </div>
                </div>

                {/* Centre card */}
                <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:py-16">
                  <div className="relative w-full max-w-md -rotate-2 overflow-hidden rounded-[28px] bg-linear-to-br from-[#1759CF] to-[#0A2B68] p-6 text-white shadow-2xl transition-transform duration-500 hover:rotate-0 sm:p-8">
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full border-[18px] border-white/10"
                      aria-hidden="true"
                    />
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-lg font-bold tracking-tight">
                        G-TEC{" "}
                        <span className="text-white/70">
                          {siteConfig.centreName}
                        </span>
                      </p>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#0B1220] px-3 py-1.5 text-xs font-semibold hover:bg-black"
                      >
                        <Navigation className="size-3.5" aria-hidden="true" />
                        {isMl ? "വഴി കാണുക" : "Get directions"}
                      </a>
                    </div>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wider text-white/60">
                      {aboutPageT("addressTitle")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/90">
                      {address}
                    </p>
                    <div className="mt-8 flex items-end justify-between gap-4">
                      <a
                        href={`tel:${siteConfig.phoneNumber}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                      >
                        <Phone className="size-4" aria-hidden="true" />
                        {siteConfig.phoneNumber}
                      </a>
                      <span className="text-xs font-semibold text-white/60">
                        ISO 9001:2015
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {settings.mapEmbedUrl && (
            <Reveal className="mt-8">
              <div className="aspect-video w-full overflow-hidden rounded-[24px] border border-[#EAECF0] shadow-sm sm:aspect-21/9">
                <iframe
                  src={settings.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="G-TEC Education Thodupuzha location map"
                />
              </div>
            </Reveal>
          )}
        </section>
      </MotionProvider>
    </main>
  );
}
