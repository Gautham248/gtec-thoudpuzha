import Image from "next/image";
import {
  PhoneCall,
  ArrowUpRight,
  Clock,
  ChartNoAxesColumn,
  Monitor,
  Award,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { siteConfig } from "@/lib/site";
import { getMediaUrl } from "@/lib/media";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { EnquiryButton } from "@/components/enquiry/EnquiryModal";

interface CourseHeroProps {
  title: string;
  description: string | null;
  categoryName: string | null;
  durationText: string | null;
  certificationName: string | null;
  coverImageUrl: string | null;
  /** Preselects this course in the enquiry modal. */
  courseId?: string;
}

export function CourseHero({
  title,
  description,
  categoryName,
  durationText,
  certificationName,
  coverImageUrl,
  courseId,
}: CourseHeroProps) {
  const image = coverImageUrl
    ? getMediaUrl(coverImageUrl)
    : "/images/figma/legacy-students-62c433.png";

  return (
    <section className="relative w-full">
      {/* Blue gradient hero (Figma #9:5). The floating header overlays its top. */}
      <div className="relative w-full overflow-hidden rounded-b-[40px] bg-linear-to-b from-[#1759CF] from-[6.49%] to-[#0A2B68] text-white sm:rounded-b-[56px] lg:rounded-b-[80px]">
        <CourseHeroBackdrop />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-24 sm:px-6 sm:pt-36 sm:pb-28 lg:px-8 lg:pt-[172px] lg:pb-[148px]">
          {/* Breadcrumb */}
          <Reveal y={12} duration={0.5}>
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/60"
            >
              <Link
                href="/courses"
                className="transition-colors hover:text-white"
              >
                Courses
              </Link>
              {categoryName && (
                <>
                  <span aria-hidden="true">/</span>
                  <span>{categoryName}</span>
                </>
              )}
              <span aria-hidden="true">/</span>
              <span
                aria-current="page"
                className="font-semibold uppercase text-white"
              >
                {title}
              </span>
            </nav>
          </Reveal>

          <div className="mt-6 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12 xl:gap-16">
            {/* Left column */}
            <RevealGroup stagger={0.09} className="flex flex-col items-start">
              {/* Category / duration pills */}
              {(categoryName || durationText) && (
                <RevealItem className="flex flex-wrap items-center gap-3">
                  {categoryName && (
                    <span className="inline-flex h-[26px] items-center rounded-full bg-[rgba(237,237,237,0.2)] px-2.5 text-sm font-semibold tracking-[-0.06em] text-white sm:text-[15.5px]">
                      {categoryName}
                    </span>
                  )}
                  {durationText && (
                    <span className="inline-flex h-[26px] items-center rounded-full bg-[rgba(237,237,237,0.2)] px-2.5 text-sm font-semibold tracking-[-0.06em] text-white sm:text-[15.5px]">
                      {durationText}
                    </span>
                  )}
                </RevealItem>
              )}

              <RevealItem>
                <h1 className="mt-7 max-w-[720px] break-words text-4xl font-bold leading-[1.1] tracking-[-0.04em] text-white sm:text-5xl lg:text-[56px]">
                  {title}
                </h1>
              </RevealItem>

              {description && (
                <RevealItem>
                  <p className="mt-5 max-w-[680px] break-words text-base font-light leading-[1.5] tracking-[-0.02em] text-white/80 sm:text-lg">
                    {description}
                  </p>
                </RevealItem>
              )}

              {/* Quick facts */}
              <RevealItem className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold text-white sm:text-[15px]">
                {durationText && (
                  <span className="flex items-center gap-2">
                    <Clock className="size-[18px]" aria-hidden="true" />
                    {durationText}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <ChartNoAxesColumn
                    className="size-[18px]"
                    aria-hidden="true"
                  />
                  Beginner to Advanced
                </span>
                <span className="flex items-center gap-2">
                  <Monitor className="size-[18px]" aria-hidden="true" />
                  Hands-On Lab
                </span>
                {certificationName && (
                  <span className="flex items-center gap-2 uppercase">
                    <Award className="size-[18px]" aria-hidden="true" />
                    {certificationName}
                  </span>
                )}
              </RevealItem>
            </RevealGroup>

            {/* Right column: cover image (Figma #9:43) */}
            <Reveal x={30} y={0} delay={0.15} duration={0.7}>
              <div className="relative aspect-440/360 w-full overflow-hidden rounded-[24px] shadow-2xl">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 440px"
                  className="object-cover"
                  priority
                />
                <span className="absolute left-4 top-4 inline-flex items-center rounded-[18px] bg-linear-to-r from-[#D1D1D1] via-[#8D8D8D] to-[#DFDFDF] px-3.5 py-2 text-xs font-bold tracking-[-0.02em] text-black">
                  Admissions Open 2025-26
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Overlapping CTA card (Figma #9:18) */}
      <div className="relative z-20 mx-auto -mt-16 max-w-7xl px-4 sm:-mt-20 sm:px-6 lg:-mt-[110px] lg:px-8">
        <Reveal y={24} delay={0.25}>
          <div className="flex flex-col items-center justify-between gap-5 rounded-[30px] bg-white px-5 py-5 shadow-[9px_8px_25px_rgba(0,0,0,0.06)] sm:px-8 sm:py-6 lg:min-h-[110px] lg:flex-row">
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 lg:w-auto">
              <EnquiryButton
                courseId={courseId}
                source="course-hero"
                className="group flex items-center justify-between gap-2.5 rounded-full bg-[#0B1220] py-[13px] pl-7 pr-5 text-base font-semibold tracking-[-0.06em] text-white transition-all hover:bg-black active:scale-[0.98] sm:justify-center sm:text-lg"
              >
                <span>Enroll Now</span>
                <span className="flex h-8 w-9 shrink-0 items-center justify-center rounded-full bg-[#1753DA] transition-transform group-hover:scale-105">
                  <ArrowUpRight className="size-5" aria-hidden="true" />
                </span>
              </EnquiryButton>
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-2.5 rounded-full bg-[#2EB700] py-[13px] pl-7 pr-5 text-base font-semibold tracking-[-0.06em] text-white transition-all hover:bg-[#28a100] active:scale-[0.98] sm:justify-center sm:text-lg"
              >
                <span>WhatsApp Us</span>
                <span className="flex h-8 w-10 shrink-0 items-center justify-center rounded-full bg-[#067914] transition-transform group-hover:scale-105">
                  <PhoneCall className="size-5" aria-hidden="true" />
                </span>
              </a>
            </div>

            {/* Trust strip */}
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-semibold text-[#374151]">
              <li className="flex items-center gap-2">
                <ShieldCheck
                  className="size-5 text-[#1753DA]"
                  aria-hidden="true"
                />
                100% Placement Assistance
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck
                  className="size-5 text-[#1753DA]"
                  aria-hidden="true"
                />
                ISO 9001:2015 Certified
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-5 text-[#1753DA]" aria-hidden="true" />
                Flexible Batch Timings
              </li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Decorative layers shared by the course hero and the courses listing hero. */
export function CourseHeroBackdrop() {
  return (
    <>
      {/* Faded classroom photo (Figma #9:6, image 21) */}
      <div
        className="pointer-events-none absolute -left-4 top-0 aspect-735/935 w-[101%] -translate-y-[20.6%] opacity-[0.06]"
        aria-hidden="true"
      >
        <Image
          src="/images/figma/course-hero-photo.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Geometric pattern, rotated −90° as in Figma (#9:7, image 7) */}
      <div
        className="pointer-events-none absolute left-1/2 top-[44%] aspect-819/1024 w-[max(82%,1185px)] -translate-x-1/2 -translate-y-1/2 -rotate-90 opacity-[0.08]"
        aria-hidden="true"
      >
        <Image
          src="/images/figma/course-hero-pattern.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
    </>
  );
}
