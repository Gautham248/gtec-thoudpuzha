import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Sparkles,
  Award,
  GraduationCap,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import type { PublicCourse } from "@/lib/courses";
import { getCourseFallbackImage, getMediaUrl } from "@/lib/media";
import { pickLocalizedText, type Locale } from "@/lib/i18n-utils";

interface FeaturedCoursesSectionProps {
  courses: PublicCourse[];
  locale: Locale;
}

export function FeaturedCoursesSection({
  courses,
  locale,
}: FeaturedCoursesSectionProps) {
  // Display top 6 to 9 courses (prefer featured courses first)
  const displayCourses = courses.slice(0, 9);

  if (displayCourses.length === 0) {
    return null;
  }

  const isMl = locale === "ml";

  return (
    <section
      aria-labelledby="featured-courses-heading"
      className="relative py-16 sm:py-20 lg:py-24 border-b border-border/60 bg-muted/15"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary mb-3">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>{isMl ? "കരിയർ പ്രോഗ്രാമുകൾ" : "Industry-Leading Programs"}</span>
            </div>
            <h2
              id="featured-courses-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground"
            >
              {isMl ? "പ്രമുഖ കോഴ്‌സുകൾ & സർട്ടിഫിക്കേഷനുകൾ" : "Featured Courses & Certifications"}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {isMl
                ? "തൊഴിലവസരങ്ങൾ ഉറപ്പാക്കുന്ന അത്യാധുനിക കമ്പ്യൂട്ടർ, ഐടി, അക്കൗണ്ടിംഗ് കോഴ്‌സുകൾ."
                : "Master high-demand technical skills with expert faculty, hands-on lab training, and 100% placement support."}
            </p>
          </div>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 group self-start sm:self-auto transition-colors"
          >
            <span>{isMl ? "എല്ലാ കോഴ്‌സുകളും കാണുക" : "View All Courses"}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayCourses.map((course) => {
            const title = pickLocalizedText(
              { en: course.titleEn, ml: course.titleMl },
              locale,
            );
            const description = pickLocalizedText(
              { en: course.descriptionEn, ml: course.descriptionMl },
              locale,
            );
            const categoryName = course.category
              ? pickLocalizedText(
                  { en: course.category.nameEn, ml: course.category.nameMl },
                  locale,
                )
              : null;

            const imageUrl = course.coverImageUrl
              ? getMediaUrl(course.coverImageUrl)
              : getCourseFallbackImage(course.slug, course.category?.nameEn);

            return (
              <div
                key={course.id || course.slug}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/50 overflow-hidden"
              >
                <div>
                  {/* Course Banner Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Dark gradient overlay for badge readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                      {categoryName && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-foreground shadow-xs">
                          <GraduationCap className="size-3 text-primary" />
                          <span>{categoryName}</span>
                        </span>
                      )}
                      {course.durationText && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                          <Clock className="size-3 text-amber-400" />
                          <span>{course.durationText}</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Certification Pill */}
                    {course.certifications && course.certifications.length > 0 && (
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 overflow-hidden">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/90 text-primary-foreground backdrop-blur-md px-2.5 py-1 text-[11px] font-bold shadow-xs truncate">
                          <Award className="size-3 shrink-0" />
                          <span className="truncate">
                            {course.certifications.join(" • ")} Certified
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 sm:p-6">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="block group-hover:text-primary transition-colors"
                    >
                      <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug line-clamp-2">
                        {title}
                      </h3>
                    </Link>

                    {description && (
                      <p className="mt-2.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-5 sm:p-6 pt-0 mt-2">
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <Link
                      href={`/courses/${course.slug}#enquiry`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-xs transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-95"
                    >
                      <span>{isMl ? "ഇപ്പോൾ ചേരുക" : "Enroll Now"}</span>
                      <ArrowRight className="size-3.5" />
                    </Link>

                    <Link
                      href={`/courses/${course.slug}`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground transition-all duration-200 hover:bg-muted hover:border-primary/40 active:scale-95"
                      aria-label={`View details for ${title}`}
                    >
                      <BookOpen className="size-3.5 text-muted-foreground" />
                      <span className="hidden xs:inline">{isMl ? "വിശദാംശങ്ങൾ" : "Details"}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 sm:mt-16 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-amber-500/10 p-6 sm:p-8 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {isMl
                ? "നിങ്ങൾക്ക് അനുയോജ്യമായ കോഴ്‌സ് കണ്ടെത്താൻ ആഗ്രഹിക്കുന്നുണ്ടോ?"
                : "Looking for another specialization or custom diploma?"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {isMl
                ? "ഞങ്ങളുടെ സമ്പൂർണ്ണ കോഴ്‌സ് കാറ്റലോഗ് കാണുക അല്ലെങ്കിൽ ഞങ്ങളുടെ കരിയർ കൗൺസിലറുമായി സംസാരിക്കുക."
                : "Explore our full catalog of specialized diplomas and international certifications with 100% placement support."}
            </p>
          </div>

          <Link
            href="/courses"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{isMl ? "എല്ലാ കോഴ്‌സുകളും കാണുക" : "Explore All Courses"}</span>
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
