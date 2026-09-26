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
  const title = locale === "ml" && course.titleMl ? course.titleMl : course.titleEn;
  const description =
    locale === "ml" && course.descriptionMl ? course.descriptionMl : course.descriptionEn;
  const categoryName =
    locale === "ml" && course.category?.nameMl
      ? course.category.nameMl
      : course.category?.nameEn ?? null;
  const overview =
    locale === "ml" && contentBlocks?.overviewMl
      ? contentBlocks.overviewMl
      : contentBlocks?.overviewEn ?? "";
  const detailedContent =
    locale === "ml" && contentBlocks?.detailedContentMl
      ? contentBlocks.detailedContentMl
      : contentBlocks?.detailedContentEn ?? "";

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <CourseHero
        title={title}
        description={description}
        categoryName={categoryName}
        durationText={course.durationText}
        certificationName={course.certifications[0] ?? null}
        coverImageUrl={course.coverImageUrl}
      />

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

      <CourseCtaBanner />

      {/* Enquiry CTA */}
      <section id="enquiry" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-xl space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-foreground">
            Interested in this course?
          </h2>
          <EnquiryForm
            source={`course-${slug}`}
            courses={allCourses}
          />
        </div>
      </section>

      {/* Related Courses */}
      {relatedCourses.length > 0 && (
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-foreground">
              Explore More Courses
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCourses.map((c: { slug: string; titleEn: string; titleMl: string | null; coverImageUrl: string | null }) => (
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
                      <span className="text-muted-foreground text-sm">{locale === "ml" ? "ചിത്രമില്ല" : "No image"}</span>
                    </div>
                  )}
                  <h3 className="font-medium text-foreground">
                    {locale === "ml" && c.titleMl ? c.titleMl : c.titleEn}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
