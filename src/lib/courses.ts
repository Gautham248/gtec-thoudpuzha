import { cache } from "react";
import { db } from "@/db";
import { logger } from "@/lib/logger";
import type { Course, CourseCategory } from "@/db/types";
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

/**
 * `strict` rethrows a query failure instead of returning an empty list. Cached
 * callers must pass it, otherwise a transient outage would cache `[]`.
 */
export async function getPublishedCourses(
  options: { strict?: boolean } = {},
): Promise<PublicCourse[]> {
  const courses = await db.query.course.findMany({
    where: (c, { eq }) => eq(c.status, "PUBLISHED"),
    with: {
      category: {
        columns: { id: true, nameEn: true, nameMl: true, sortOrder: true },
      },
    },
    orderBy: (c, { desc }) => [desc(c.featured), desc(c.createdAt)],
  }).catch((err) => {
    logger.exception("courses", "Failed to fetch published courses", err);
    if (options.strict) throw err;
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
      const course = await db.query.course.findFirst({
        where: (c, { eq }) => eq(c.slug, slug),
        with: { category: true },
      });
      return course ?? null;
    } catch (err) {
      logger.exception("courses", "Failed to fetch course by slug", err);
      return null;
    }
  },
);

export async function getCourseSlugs(): Promise<string[]> {
  const courses = await db.query.course.findMany({
    where: (c, { eq }) => eq(c.status, "PUBLISHED"),
    columns: { slug: true },
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

const RELATED_COLUMNS = {
  slug: true,
  titleEn: true,
  titleMl: true,
  coverImageUrl: true,
  durationText: true,
  descriptionEn: true,
  descriptionMl: true,
} as const;

const RELATED_WITH = {
  category: { columns: { id: true, nameEn: true, nameMl: true } },
} as const;

export async function getRelatedCourses(
  excludeSlug: string,
  limit = 3,
  categoryId?: string | null,
): Promise<RelatedCourse[]> {
  try {
    let related = await db.query.course.findMany({
      where: (c, { and, eq, ne }) =>
        and(
          eq(c.status, "PUBLISHED"),
          ne(c.slug, excludeSlug),
          categoryId ? eq(c.categoryId, categoryId) : undefined,
        ),
      columns: RELATED_COLUMNS,
      with: RELATED_WITH,
      limit,
      orderBy: (c, { desc }) => [desc(c.featured), desc(c.createdAt)],
    });

    if (related.length < limit) {
      const fallbackLimit = limit - related.length;
      const existingSlugs = [excludeSlug, ...related.map((r) => r.slug)];
      const more = await db.query.course.findMany({
        where: (c, { and, eq, notInArray }) =>
          and(eq(c.status, "PUBLISHED"), notInArray(c.slug, existingSlugs)),
        columns: RELATED_COLUMNS,
        with: RELATED_WITH,
        limit: fallbackLimit,
        orderBy: (c, { desc }) => [desc(c.featured), desc(c.createdAt)],
      });
      related = [...related, ...more];
    }
    return related;
  } catch (err) {
    logger.exception("courses", "Failed to fetch related courses", err);
    return [];
  }
}

