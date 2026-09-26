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
  category: Pick<CourseCategory, "id" | "nameEn" | "nameMl" | "sortOrder"> | null;
  contentBlocks: CourseContent | null;
};

export async function getPublishedCourses(): Promise<PublicCourse[]> {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: {
        select: { id: true, nameEn: true, nameMl: true, sortOrder: true },
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

export type RelatedCourse = Pick<
  Course,
  | "slug"
  | "titleEn"
  | "titleMl"
  | "coverImageUrl"
  | "durationText"
  | "descriptionEn"
  | "descriptionMl"
> & {
  category: Pick<CourseCategory, "id" | "nameEn" | "nameMl"> | null;
};

export async function getRelatedCourses(
  excludeSlug: string,
  limit = 3,
  categoryId?: string | null,
): Promise<RelatedCourse[]> {
  try {
    let related = await prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        slug: { not: excludeSlug },
        ...(categoryId ? { categoryId } : {}),
      },
      select: {
        slug: true,
        titleEn: true,
        titleMl: true,
        coverImageUrl: true,
        durationText: true,
        descriptionEn: true,
        descriptionMl: true,
        category: { select: { id: true, nameEn: true, nameMl: true } },
      },
      take: limit,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

    if (related.length < limit) {
      const fallbackLimit = limit - related.length;
      const existingSlugs = [excludeSlug, ...related.map((r) => r.slug)];
      const more = await prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          slug: { notIn: existingSlugs },
        },
        select: {
          slug: true,
          titleEn: true,
          titleMl: true,
          coverImageUrl: true,
          durationText: true,
          descriptionEn: true,
          descriptionMl: true,
          category: { select: { id: true, nameEn: true, nameMl: true } },
        },
        take: fallbackLimit,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      });
      related = [...related, ...more];
    }
    return related;
  } catch (err) {
    logger.exception("courses", "Failed to fetch related courses", err);
    return [];
  }
}

