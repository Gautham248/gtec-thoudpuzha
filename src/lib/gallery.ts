import { prisma } from "@/lib/db";

export type PublicGalleryCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameMl: string | null;
  sortOrder: number;
  items: Array<{
    id: string;
    mediaType: "IMAGE" | "VIDEO";
    url: string;
    captionEn: string | null;
    captionMl: string | null;
    sortOrder: number;
  }>;
};

/** Derive a URL-safe slug from a display name. */
export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getGalleryData(): Promise<PublicGalleryCategory[]> {
  const categories = await prisma.galleryCategory.findMany({
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return categories;
}

/** Fetch a single category by slug with its items, limited to `limit` items. */
export async function getGalleryCategoryBySlug(
  slug: string,
  limit?: number,
): Promise<PublicGalleryCategory | null> {
  const category = await prisma.galleryCategory.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        ...(limit !== undefined ? { take: limit } : {}),
      },
    },
  });

  if (!category) return null;

  return category;
}

export type PlacementGalleryData = PublicGalleryCategory & { slug: "placement-support" };

const PLACEMENT_SLUG = "placement-support";
const DISPLAY_LIMIT = 6;

/** Fetch the Placement & Support category items (up to DISPLAY_LIMIT). Returns null if no such category exists. */
export async function getPlacementGalleryData(): Promise<{
  slug: string;
  items: PublicGalleryCategory["items"];
} | null> {
  try {
    const category = await getGalleryCategoryBySlug(PLACEMENT_SLUG, DISPLAY_LIMIT);
    if (!category) return null;
    return { slug: category.slug, items: category.items };
  } catch {
    return null;
  }
}
