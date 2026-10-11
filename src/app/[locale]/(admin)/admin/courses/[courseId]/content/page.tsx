import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { db } from "@/db";
import { getCourseContent } from "./actions";
import { CourseContentEditor } from "./content-tabs";

interface ContentPageProps {
  params: Promise<{ locale: string; courseId: string }>;
}

export default async function CourseContentPage({ params }: ContentPageProps) {
  const { locale, courseId } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const course = await db.query.course.findFirst({
    where: (c, { eq }) => eq(c.id, courseId),
  });

  if (!course) {
    redirect(`/${locale}/admin/courses`);
  }

  const content = (await getCourseContent(courseId)) ?? {
    heroTaglineEn: "",
    heroTaglineMl: "",
    overviewEn: "",
    overviewMl: "",
    detailedContentEn: "",
    detailedContentMl: "",
    detailedContentImageUrl: "",
    courseLists: [],
    benefits: undefined,
  };

  return (
    <CourseContentEditor
      courseId={courseId}
      locale={locale}
      courseTitleEn={course.titleEn}
      courseTitleMl={course.titleMl}
      courseDescriptionEn={course.descriptionEn}
      courseDescriptionMl={course.descriptionMl}
      courseCoverImageUrl={course.coverImageUrl}
      initialContent={content}
    />
  );
}
