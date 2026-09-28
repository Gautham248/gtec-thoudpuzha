export interface FilterCategory {
  id: string;
  nameEn: string;
  nameMl: string | null;
  sortOrder: number;
  slug: string;
  count: number;
}

interface CourseWithCategory {
  category: {
    id: string;
    nameEn: string;
    nameMl: string | null;
    sortOrder?: number | null;
  } | null;
}

export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const collapse = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const tokens = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);

/** Categories that have at least one course, in admin sortOrder then name. */
export function collectCategories(
  courses: CourseWithCategory[],
): FilterCategory[] {
  const byId = new Map<string, FilterCategory>();
  for (const { category } of courses) {
    if (!category) continue;
    const existing = byId.get(category.id);
    if (existing) {
      existing.count += 1;
      continue;
    }
    byId.set(category.id, {
      id: category.id,
      nameEn: category.nameEn,
      nameMl: category.nameMl,
      sortOrder: category.sortOrder ?? 0,
      slug: slugifyCategory(category.nameEn),
      count: 1,
    });
  }
  return [...byId.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn),
  );
}

/**
 * Resolves a `?category=` value to a category. Accepts our own slugs and ids,
 * plus looser keywords such as the home page strip's `accounting`,
 * `it-software` or `datascience`. Returns null (show all) when nothing matches.
 */
export function resolveCategory(
  param: string | undefined,
  categories: FilterCategory[],
): FilterCategory | null {
  if (!param) return null;
  const value = param.trim().toLowerCase();
  if (!value) return null;

  const exact = categories.find((c) => c.slug === value || c.id === param);
  if (exact) return exact;

  const collapsed = collapse(value);
  const contained = categories.find((c) =>
    collapse(c.nameEn).includes(collapsed),
  );
  if (contained) return contained;

  const wanted = tokens(value);
  return (
    categories.find((c) => {
      const nameTokens = tokens(c.nameEn);
      return wanted.some((w) =>
        nameTokens.some((n) => n === w || (w.length >= 3 && n.startsWith(w))),
      );
    }) ?? null
  );
}
