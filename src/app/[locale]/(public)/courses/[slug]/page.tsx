import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getCourseBySlug, getRelatedCourses } from "@/lib/courses";
import { CourseHero } from "@/components/courses/CourseHero";
import { CourseDetailSections } from "@/components/courses/CourseDetailSections";
import { CourseCertifications } from "@/components/courses/CourseCertifications";
import { CourseCtaBanner } from "@/components/courses/CourseCtaBanner";
import { StudentStoriesSection } from "@/components/shared/StudentStoriesSection";
import { CertificationPartnerStrip } from "@/components/shared/CertificationPartnerStrip";
import { EnquiryForm } from "@/components/shared/EnquiryForm";
import { getPublishedCourses } from "@/lib/courses";
import { Link } from "@/lib/i18n/navigation";
import type { CourseContent } from "@/lib/course-content.types";
import { getMediaUrl } from "@/lib/media";
import {
  MotionProvider,
  Reveal,
  RevealNoScript,
} from "@/components/motion/Reveal";
import { Award, Clock, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/lib/site";

interface CourseDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CourseDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.status !== "PUBLISHED") {
    return { title: "Course Not Found" };
  }
  return {
    title: `${course.titleEn} | GTEC Thodupuzha`,
    description: course.descriptionEn ?? undefined,
    openGraph: course.coverImageUrl
      ? { images: [getMediaUrl(course.coverImageUrl)] }
      : undefined,
  };
}

export default async function CourseDetailPage({ params }: CourseDetailProps) {
  const { locale, slug } = await params;
  const [course, allCourses, relatedCourses] = await Promise.all([
    getCourseBySlug(slug),
    getPublishedCourses(),
    getRelatedCourses(slug, 3),
  ]);

  if (!course || course.status !== "PUBLISHED") {
    notFound();
  }

  const contentBlocks = course.contentBlocks as unknown as CourseContent | null;
  const title =
    locale === "ml" && course.titleMl ? course.titleMl : course.titleEn;
  const description =
    locale === "ml" && course.descriptionMl
      ? course.descriptionMl
      : course.descriptionEn;
  const categoryName =
    locale === "ml" && course.category?.nameMl
      ? course.category.nameMl
      : (course.category?.nameEn ?? null);
  const overview =
    locale === "ml" && contentBlocks?.overviewMl
      ? contentBlocks.overviewMl
      : (contentBlocks?.overviewEn ?? "");
  const detailedContent =
    locale === "ml" && contentBlocks?.detailedContentMl
      ? contentBlocks.detailedContentMl
      : (contentBlocks?.detailedContentEn ?? "");

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <RevealNoScript />
      <MotionProvider>
        <CourseHero
          title={title}
          description={description}
          categoryName={categoryName}
          durationText={course.durationText}
          certificationName={course.certifications[0] ?? null}
          coverImageUrl={course.coverImageUrl}
          courseId={course.id}
        />
      </MotionProvider>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <CourseDetailSections
          overview={overview}
          detailedContent={detailedContent}
          detailedContentImageUrl={contentBlocks?.detailedContentImageUrl}
          courseLists={contentBlocks?.courseLists ?? []}
          benefits={contentBlocks?.benefits}
          durationText={course.durationText}
          certificationSummary={course.certifications.join(", ") || null}
          careerOutcomes={
            locale === "ml" && course.careerOutcomesMl
              ? course.careerOutcomesMl
              : course.careerOutcomesEn
          }
          locale={locale}
        />
      </div>

      <StudentStoriesSection />

      <CertificationPartnerStrip heading="Our Partners" />

      <CourseCertifications certifications={course.certifications} />

      <CourseCtaBanner courseId={course.id} />

      {/* Enquiry: dark info panel + form with this course preselected */}
      <section
        id="enquiry"
        className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <Reveal y={40} className="mx-auto max-w-6xl">
          <div className="grid overflow-hidden rounded-[32px] border border-[#EAECF0] bg-white shadow-[0_24px_60px_-24px_rgba(11,18,32,0.25)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:rounded-[40px]">
            <div className="relative overflow-hidden bg-[#0B1220] p-6 text-white sm:p-10">
              <div
                className="pointer-events-none absolute -bottom-24 -right-28 h-44 w-[150%] -rotate-45 bg-[#810000]/60"
                aria-hidden="true"
              />
              <p className="relative text-sm font-semibold tracking-[-0.02em] text-white/60">
                {locale === "ml" ? "താൽപ്പര്യമുണ്ടോ?" : "Interested in"}
              </p>
              <h2 className="relative mt-2 text-3xl font-bold leading-tight tracking-[-0.04em] sm:text-4xl">
                {title}
              </h2>
              <p className="relative mt-4 text-sm leading-relaxed text-white/70">
                {locale === "ml"
                  ? "നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക, ഞങ്ങളുടെ കൗൺസിലർമാർ ഉടൻ വിളിക്കും."
                  : "Leave your details and our counsellors will call you back with batch timings, fees and next steps."}
              </p>

              <ul className="relative mt-8 flex flex-col gap-3 text-sm font-semibold">
                {course.durationText && (
                  <li className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-white/10">
                      <Clock className="size-4" aria-hidden="true" />
                    </span>
                    {course.durationText}
                  </li>
                )}
                {course.certifications[0] && (
                  <li className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Award className="size-4" aria-hidden="true" />
                    </span>
                    <span className="line-clamp-2">
                      {course.certifications[0]}
                    </span>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-white/10">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  </span>
                  100% Placement Assistance
                </li>
              </ul>

              <div className="relative mt-10 flex flex-wrap gap-2">
                <a
                  href={`tel:${siteConfig.phoneNumber}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {siteConfig.phoneNumber}
                </a>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#2EB700] px-4 py-2 text-sm font-semibold transition hover:bg-[#28a100]"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="p-6 sm:p-10">
              <EnquiryForm
                source={`course-${slug}`}
                courses={allCourses}
                defaultCourseId={course.id}
                variant="bare"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Related Courses */}
      {relatedCourses.length > 0 && (
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-foreground">
              Explore More Courses
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCourses.map(
                (c: {
                  slug: string;
                  titleEn: string;
                  titleMl: string | null;
                  coverImageUrl: string | null;
                }) => (
                  <Link
                    key={c.slug}
                    href={`/courses/${c.slug}`}
                    className="rounded-xl border border-border p-4 hover:shadow-md transition-shadow bg-card"
                  >
                    {c.coverImageUrl ? (
                      <div className="relative h-40 w-full mb-3 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={getMediaUrl(c.coverImageUrl)}
                          alt={c.titleEn}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          {locale === "ml" ? "ചിത്രമില്ല" : "No image"}
                        </span>
                      </div>
                    )}
                    <h3 className="font-medium text-foreground">
                      {locale === "ml" && c.titleMl ? c.titleMl : c.titleEn}
                    </h3>
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
