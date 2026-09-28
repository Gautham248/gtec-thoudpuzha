import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, GraduationCap, Layers } from "lucide-react";
import { getPublishedCourses } from "@/lib/courses";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseHeroBackdrop } from "@/components/courses/CourseHero";
import { CourseCtaBanner } from "@/components/courses/CourseCtaBanner";
import { Link } from "@/lib/i18n/navigation";
import { collectCategories, resolveCategory } from "@/lib/course-filters";
import {
  MotionProvider,
  Reveal,
  RevealGroup,
  RevealItem,
  RevealNoScript,
} from "@/components/motion/Reveal";

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: CoursesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: `${t("courses")} | GTEC Thodupuzha`,
    description: "Browse our professional courses and training programs",
  };
}

const chipBase =
  "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition-colors";
const chipActive = "bg-[#0B57D0] text-white shadow-md";
const chipIdle = "bg-[#F2F4F7] text-[#111827] hover:bg-[#E4E7EC]";

export default async function CoursesPage({
  params,
  searchParams,
}: CoursesPageProps) {
  const { locale } = await params;
  const { category: rawCategory } = await searchParams;
  const isMl = locale === "ml";
  const t = await getTranslations({ locale, namespace: "nav" });
  const courses = await getPublishedCourses();

  const categories = collectCategories(courses);
  const active = resolveCategory(
    Array.isArray(rawCategory) ? rawCategory[0] : rawCategory,
    categories,
  );
  const visible = active
    ? courses.filter((c) => c.category?.id === active.id)
    : courses;
  const pick = (en: string, ml: string | null) => (isMl && ml ? ml : en);

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <RevealNoScript />
      <MotionProvider>
        {/* Hero (shares the course detail page's backdrop) */}
        <section className="relative w-full">
          <div className="relative w-full overflow-hidden rounded-b-[40px] bg-linear-to-b from-[#1759CF] from-[6.49%] to-[#0A2B68] text-white sm:rounded-b-[56px] lg:rounded-b-[80px]">
            <CourseHeroBackdrop />

            <div className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-28 sm:px-6 sm:pt-36 sm:pb-32 lg:px-8 lg:pt-[172px] lg:pb-[140px]">
              <RevealGroup stagger={0.09} className="max-w-3xl">
                <RevealItem>
                  <p className="text-base font-semibold tracking-[-0.05em] text-white/60 sm:text-xl">
                    GTEC at glance
                  </p>
                </RevealItem>
                <RevealItem>
                  <h1 className="mt-2 text-4xl font-bold leading-[1.1] tracking-[-0.04em] sm:text-5xl lg:text-[56px]">
                    {isMl ? t("courses") : "Our Courses"}
                  </h1>
                </RevealItem>
                <RevealItem>
                  <p className="mt-5 max-w-2xl text-base font-light leading-[1.5] tracking-[-0.02em] text-white/80 sm:text-lg">
                    Industry-focused programmes in accounting, IT, design,
                    programming and more — with hands-on labs, recognised
                    certifications and dedicated placement support.
                  </p>
                </RevealItem>
                <RevealItem className="mt-7 flex flex-wrap items-center gap-3">
                  <span className="inline-flex h-8 items-center gap-2 rounded-full bg-[rgba(237,237,237,0.2)] px-3.5 text-sm font-semibold">
                    <GraduationCap className="size-4" aria-hidden="true" />
                    {courses.length} {isMl ? "കോഴ്സുകൾ" : "courses"}
                  </span>
                  {categories.length > 0 && (
                    <span className="inline-flex h-8 items-center gap-2 rounded-full bg-[rgba(237,237,237,0.2)] px-3.5 text-sm font-semibold">
                      <Layers className="size-4" aria-hidden="true" />
                      {categories.length} {isMl ? "വിഭാഗങ്ങൾ" : "categories"}
                    </span>
                  )}
                </RevealItem>
              </RevealGroup>
            </div>
          </div>

          {/* Category filter, overlapping the hero like the course CTA card */}
          {categories.length > 0 && (
            <div className="relative z-20 mx-auto -mt-12 max-w-7xl px-4 sm:-mt-14 sm:px-6 lg:-mt-[70px] lg:px-8">
              <Reveal y={24} delay={0.2}>
                <nav
                  aria-label={isMl ? "കോഴ്സ് വിഭാഗങ്ങൾ" : "Course categories"}
                  className="rounded-[30px] bg-white p-3 shadow-[9px_8px_25px_rgba(0,0,0,0.06)] sm:p-4"
                >
                  {/* Scrolls sideways on small screens instead of wrapping. */}
                  <ul className="flex gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:flex-wrap lg:overflow-visible">
                    <li>
                      <Link
                        href="/courses"
                        scroll={false}
                        aria-current={active ? undefined : "page"}
                        className={`${chipBase} ${active ? chipIdle : chipActive}`}
                      >
                        {isMl ? "എല്ലാം" : "All"}
                        <span className="text-xs opacity-70">
                          {courses.length}
                        </span>
                      </Link>
                    </li>
                    {categories.map((cat) => {
                      const isActive = active?.id === cat.id;
                      return (
                        <li key={cat.id}>
                          <Link
                            href={`/courses?category=${cat.slug}`}
                            scroll={false}
                            aria-current={isActive ? "page" : undefined}
                            className={`${chipBase} ${isActive ? chipActive : chipIdle}`}
                          >
                            {pick(cat.nameEn, cat.nameMl)}
                            <span className="text-xs opacity-70">
                              {cat.count}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </Reveal>
            </div>
          )}
        </section>

        {/* Course grid */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <Reveal className="mb-10 flex flex-col gap-1 sm:mb-14">
            <p className="text-base font-semibold tracking-[-0.05em] text-[#B4B4B4] sm:text-xl">
              {isMl ? "കാണിക്കുന്നത്" : "Showing"} {visible.length}{" "}
              {isMl ? "കോഴ്സുകൾ" : visible.length === 1 ? "course" : "courses"}
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[#111827] sm:text-5xl">
              {active
                ? pick(active.nameEn, active.nameMl)
                : isMl
                  ? "എല്ലാ കോഴ്സുകളും"
                  : "All Courses"}
            </h2>
          </Reveal>

          {visible.length === 0 ? (
            <Reveal className="rounded-[30px] bg-[#F5F7FB] px-6 py-16 text-center">
              <p className="text-lg font-semibold text-[#111827]">
                {isMl
                  ? "ഇപ്പോൾ കോഴ്സുകളൊന്നും ലഭ്യമല്ല."
                  : "No courses available here at the moment."}
              </p>
              <p className="mt-2 text-sm text-[#6B7280]">
                {isMl
                  ? "ഉടൻ വീണ്ടും പരിശോധിക്കുക."
                  : "New batches are added regularly — check back soon."}
              </p>
              {active && (
                <Link
                  href="/courses"
                  scroll={false}
                  className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#0B1220] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
                >
                  {isMl ? "എല്ലാ കോഴ്സുകളും കാണുക" : "View all courses"}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              )}
            </Reveal>
          ) : (
            <RevealGroup
              key={active?.id ?? "all"}
              stagger={0.08}
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {visible.map((course) => (
                <RevealItem key={course.id} y={40} className="h-full">
                  <CourseCard
                    courseId={course.id}
                    slug={course.slug}
                    titleEn={course.titleEn}
                    titleMl={course.titleMl}
                    descriptionEn={course.descriptionEn}
                    descriptionMl={course.descriptionMl}
                    coverImageUrl={course.coverImageUrl}
                    categoryNameEn={course.category?.nameEn}
                    categoryNameMl={course.category?.nameMl}
                    durationText={course.durationText}
                    featured={course.featured}
                    locale={locale}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </section>
      </MotionProvider>

      <CourseCtaBanner />
    </main>
  );
}
