import { createElement } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { getMediaUrl } from "@/lib/media";
import { courseIcon } from "@/lib/course-icons";
import { EnquiryButton } from "@/components/enquiry/EnquiryModal";

interface CourseCardProps {
  /** Preselects this course when Enroll Now opens the enquiry modal. */
  courseId?: string;
  slug: string;
  titleEn: string;
  titleMl: string | null;
  descriptionEn: string | null;
  descriptionMl: string | null;
  coverImageUrl: string | null;
  categoryNameEn?: string | null;
  categoryNameMl?: string | null;
  durationText?: string | null;
  featured?: boolean;
  locale: string;
}

/** Dark course card, matching the landing page's Featured Courses cards. */
export function CourseCard({
  courseId,
  slug,
  titleEn,
  titleMl,
  descriptionEn,
  descriptionMl,
  coverImageUrl,
  categoryNameEn,
  categoryNameMl,
  durationText,
  featured = false,
  locale,
}: CourseCardProps) {
  const isMl = locale === "ml";
  const title = isMl && titleMl ? titleMl : titleEn;
  const description = isMl && descriptionMl ? descriptionMl : descriptionEn;
  const categoryName =
    isMl && categoryNameMl ? categoryNameMl : (categoryNameEn ?? null);
  return (
    // The title link is stretched over the card (after:inset-0), so the card
    // still opens the course page while the Enroll pill is its own button.
    <article className="group relative flex h-full flex-col rounded-[20px] bg-[#121926] p-6 text-white shadow-xl transition-transform duration-200 hover:-translate-y-1.5 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-[#1753DA] has-[a:focus-visible]:ring-offset-2">
      {(categoryName || durationText) && (
        <div className="flex flex-wrap items-center gap-2">
          {categoryName && (
            <span className="rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold sm:text-sm">
              {categoryName}
            </span>
          )}
          {durationText && (
            <span className="rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold sm:text-sm">
              {durationText}
            </span>
          )}
        </div>
      )}

      {featured && (
        <p className="mt-4 text-lg font-semibold tracking-tight text-[#6AFF00]">
          {isMl ? "ശ്രദ്ധേയം*" : "Featured*"}
        </p>
      )}

      <h2
        className={`${featured ? "mt-1" : "mt-4"} line-clamp-2 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl`}
      >
        <Link
          href={`/courses/${slug}`}
          className="outline-none after:absolute after:inset-0 after:z-1 after:rounded-[20px] after:content-['']"
        >
          {title}
        </Link>
      </h2>

      <div className="relative my-6 h-52 w-full overflow-hidden rounded-xl sm:h-56">
        {coverImageUrl ? (
          <Image
            src={getMediaUrl(coverImageUrl)}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#0B57D0] to-[#093C98]">
            {createElement(courseIcon(titleEn, categoryNameEn), {
              className:
                "size-16 text-white/80 transition-transform duration-500 group-hover:scale-110",
              "aria-hidden": true,
            })}
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-4">
        <p className="line-clamp-2 text-xs leading-relaxed text-white/70">
          {description}
        </p>
        <EnquiryButton
          courseId={courseId}
          source="courses-list"
          className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-[#0B1220] px-4 py-2 text-xs font-semibold shadow-sm transition-colors hover:bg-[#1753DA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-sm"
        >
          {isMl ? "ചേരുക" : "Enroll Now"}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </EnquiryButton>
      </div>
    </article>
  );
}
