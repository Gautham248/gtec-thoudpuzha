import Image from "next/image";
import { MessageCircle, ArrowUpRight, Clock, GraduationCap, MonitorPlay, Award, ShieldCheck, BookOpenCheck, CalendarClock } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { siteConfig } from "@/lib/site";
import { getMediaUrl } from "@/lib/media";

interface CourseHeroProps {
  title: string;
  description: string | null;
  categoryName: string | null;
  durationText: string | null;
  certificationName: string | null;
  coverImageUrl: string | null;
}

export function CourseHero({
  title,
  description,
  categoryName,
  durationText,
  certificationName,
  coverImageUrl,
}: CourseHeroProps) {
  const image = coverImageUrl
    ? getMediaUrl(coverImageUrl)
    : "/images/figma/legacy-students-62c433.png";

  return (
    <section className="relative w-full">
      <div className="relative w-full overflow-hidden bg-[#0B57D0] text-white rounded-b-[40px] sm:rounded-b-[56px] shadow-2xl">
        {/* Decorative wine geometric arcs, consistent with HeroSection */}
        <div
          className="pointer-events-none absolute left-[55%] -top-[35%] w-[65%] sm:w-[45%] aspect-square rounded-tr-[1457px] bg-[#810000] z-0"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-[75%] top-[10%] w-[45%] sm:w-[30%] aspect-square rounded-tr-[1457px] bg-[#810000]/80 z-0"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 z-1 bg-[radial-gradient(circle_at_-20%_10%,rgba(0,0,0,0.3)_45%,rgba(0,0,0,0)_100%)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-20 sm:pb-28 z-10">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-white/70"
          >
            <Link href="/courses" className="hover:text-white transition-colors">
              Courses
            </Link>
            {categoryName && (
              <>
                <span aria-hidden="true">/</span>
                <span>{categoryName}</span>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span className="text-white">{title}</span>
          </nav>

          <div className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left column */}
            <div className="lg:col-span-7 flex flex-col items-start gap-4 sm:gap-5">
              {/* Category / duration pills */}
              <div className="flex flex-wrap items-center gap-2">
                {categoryName && (
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm">
                    {categoryName}
                  </span>
                )}
                {durationText && (
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm">
                    {durationText}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] text-white leading-[1.08] break-words">
                {title}
              </h1>

              {description && (
                <p className="max-w-xl text-sm sm:text-lg text-white/85 leading-relaxed break-words">
                  {description}
                </p>
              )}

              {/* Quick facts */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs sm:text-sm text-white/90">
                {durationText && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{durationText}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  <span>Beginner to Advanced</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MonitorPlay className="h-4 w-4" />
                  <span>Hands-On Lab</span>
                </div>
                {certificationName && (
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    <span>{certificationName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right column: image */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-4/3 sm:aspect-square lg:aspect-4/3 w-full overflow-hidden rounded-[24px] border border-white/15 shadow-2xl bg-black/20">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover"
                  priority
                />
                <div className="absolute left-3 top-3 sm:left-4 sm:top-4 inline-flex items-center rounded-full bg-[#0B1220]/90 px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-white shadow-md backdrop-blur-sm">
                  Admissions Open 2025-26
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlapping CTA card */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12">
        <div className="rounded-2xl bg-white shadow-xl border border-black/5 p-4 sm:p-6 flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
          {/* CTA buttons */}
          <div className="flex w-full lg:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/#enquiry"
              className="group flex items-center justify-between sm:justify-start gap-4 rounded-full bg-[#0B1220] hover:bg-black pl-6 pr-2 py-2 text-sm sm:text-base font-semibold text-white shadow-md transition-all active:scale-[0.98]"
            >
              <span>Enroll Now</span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1753DA] text-white transition-transform group-hover:scale-105">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between sm:justify-start gap-4 rounded-full bg-[#2EB700] hover:bg-[#28a100] pl-6 pr-2 py-2 text-sm sm:text-base font-semibold text-white shadow-md transition-all active:scale-[0.98]"
            >
              <span>WhatsApp Us</span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#067914] text-white transition-transform group-hover:scale-105">
                <MessageCircle className="h-4 w-4" />
              </span>
            </a>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <BookOpenCheck className="h-4 w-4 text-primary" />
              <span>100% Placement Assistance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>ISO 9001:2015 Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-primary" />
              <span>Flexible Batch Timings</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
