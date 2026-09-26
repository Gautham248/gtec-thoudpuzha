import type { PublicCourse } from "@/lib/courses";

/** Slim course shape sent to the header's Courses menu (keeps the client payload small). */
export interface NavCourse {
  slug: string;
  titleEn: string;
  titleMl: string | null;
  durationText: string | null;
  featured: boolean;
  coverImageUrl: string | null;
  summaryEn: string | null;
  summaryMl: string | null;
  category: {
    id: string;
    nameEn: string;
    nameMl: string | null;
    sortOrder: number;
  } | null;
}

export interface NavCourseGroup {
  id: string;
  nameEn: string;
  nameMl: string | null;
  courses: NavCourse[];
}

const SUMMARY_LENGTH = 140;
const OTHER_GROUP_ID = "__other";

function toSummary(text: string | null): string | null {
  if (!text) return null;
  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return null;
  return plain.length > SUMMARY_LENGTH
    ? `${plain.slice(0, SUMMARY_LENGTH).trimEnd()}…`
    : plain;
}

export function toNavCourse(course: PublicCourse): NavCourse {
  return {
    slug: course.slug,
    titleEn: course.titleEn,
    titleMl: course.titleMl,
    durationText: course.durationText,
    featured: course.featured,
    coverImageUrl: course.coverImageUrl,
    summaryEn: toSummary(course.descriptionEn),
    summaryMl: toSummary(course.descriptionMl),
    category: course.category
      ? {
          id: course.category.id,
          nameEn: course.category.nameEn,
          nameMl: course.category.nameMl,
          // Older cached payloads may predate sortOrder being selected.
          sortOrder: course.category.sortOrder ?? 0,
        }
      : null,
  };
}

/**
 * Groups courses by category: categories in admin sortOrder (then name),
 * courses A–Z within each, uncategorised courses last under "Other courses".
 */
export function groupNavCourses(courses: NavCourse[]): NavCourseGroup[] {
  const groups = new Map<string, NavCourseGroup & { sortOrder: number }>();

  for (const course of courses) {
    const cat = course.category;
    const id = cat?.id ?? OTHER_GROUP_ID;
    let group = groups.get(id);
    if (!group) {
      group = {
        id,
        nameEn: cat?.nameEn ?? "Other courses",
        nameMl: cat ? cat.nameMl : "മറ്റ് കോഴ്സുകൾ",
        sortOrder: cat?.sortOrder ?? Number.POSITIVE_INFINITY,
        courses: [],
      };
      groups.set(id, group);
    }
    group.courses.push(course);
  }

  return [...groups.values()]
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn),
    )
    .map(({ sortOrder: _sortOrder, ...group }) => ({
      ...group,
      courses: [...group.courses].sort((a, b) =>
        a.titleEn.localeCompare(b.titleEn),
      ),
    }));
}

/** First featured course, else the newest (published courses arrive featured-first, newest-first). */
export function pickFeaturedCourse(courses: NavCourse[]): NavCourse | null {
  return courses.find((c) => c.featured) ?? courses[0] ?? null;
}
