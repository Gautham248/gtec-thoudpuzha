import { cache } from "react";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { Course, CourseCategory } from "@prisma/client";
import type { CourseContent } from "@/lib/course-content.types";

export type PublicCourse = Pick<
  Course,
  | "id"
  | "slug"
  | "titleEn"
  | "titleMl"
  | "descriptionEn"
  | "descriptionMl"
  | "durationText"
  | "certifications"
  | "careerOutcomesEn"
  | "careerOutcomesMl"
  | "coverImageUrl"
  | "featured"
> & {
  category: Pick<CourseCategory, "id" | "nameEn" | "nameMl"> | null;
  contentBlocks: CourseContent | null;
};

export async function getPublishedCourses(): Promise<PublicCourse[]> {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: {
        select: { id: true, nameEn: true, nameMl: true },
      },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  }).catch((err) => {
    logger.exception("courses", "Failed to fetch published courses", err);
    return [];
  });

  return courses.map(
    ({ syllabus: _syllabus, status: _status, contentBlocks, ...rest }) => ({
      ...rest,
      contentBlocks: contentBlocks as unknown as CourseContent | null,
    }),
  );
}

export type CourseWithCategory = Course & {
  category: CourseCategory | null;
};

export const getCourseBySlug = cache(
  async (slug: string): Promise<CourseWithCategory | null> => {
    try {
      const course = await prisma.course.findUnique({
        where: { slug },
        include: { category: true },
      });
      return course;
    } catch (err) {
      logger.exception("courses", "Failed to fetch course by slug", err);
      return null;
    }
  },
);

export async function getCourseSlugs(): Promise<string[]> {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return courses.map((c) => c.slug);
}

export type RelatedCourse = Pick<Course, "slug" | "titleEn" | "titleMl" | "coverImageUrl">;

export async function getRelatedCourses(
  excludeSlug: string,
  limit = 3,
): Promise<RelatedCourse[]> {
  return prisma.course.findMany({
    where: { status: "PUBLISHED", slug: { not: excludeSlug } },
    select: { slug: true, titleEn: true, titleMl: true, coverImageUrl: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  }).catch((err) => {
    logger.exception("courses", "Failed to fetch related courses", err);
    throw err;
  });
}
