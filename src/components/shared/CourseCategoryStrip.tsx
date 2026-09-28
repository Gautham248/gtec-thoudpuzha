import Link from "next/link";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { collectCategories } from "@/lib/course-filters";
import type { PublicCourse } from "@/lib/courses";
import type { Locale } from "@/lib/site-settings";

/** Categories that actually have published courses, drawn from the same data as the filters. */
export function CourseCategoryStrip({
  courses,
  locale,
}: {
  courses: PublicCourse[];
  locale: Locale;
}) {
  const categories = collectCategories(courses);

  if (categories.length === 0) return null;

  return (
    <section className="relative z-20 w-full bg-[#121926] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <RevealGroup
          stagger={0.06}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5"
        >
          {categories.map((cat) => (
            <RevealItem key={cat.id} y={16} scale={0.95}>
              <Link
                href={`/courses?category=${cat.slug}`}
                className="inline-flex items-center justify-center rounded-[75px] bg-[#093C98] hover:bg-[#0b48b5] px-5 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-base lg:text-lg font-semibold tracking-tight text-white uppercase shadow-md transition-all hover:scale-105 active:scale-95"
              >
                {locale === "ml" && cat.nameMl ? cat.nameMl : cat.nameEn}
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
