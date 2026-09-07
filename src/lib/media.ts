/**
 * Convert an R2 object key to a public URL served by our API route.
 * For keys like "gallery/12345-img.png" this returns "/api/media/gallery/12345-img.png".
 */
export function getMediaUrl(key: string): string {
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `/api/media/${key}`;
}

/**
 * Convert a batch of R2 keys to public URLs.
 */
export function getMediaUrls(keys: string[]): string[] {
  return keys.map(getMediaUrl);
}

/**
 * Pick a local stock image for a course that has no coverImageUrl, keyed off the
 * course slug (and category, when provided). Shared by every course card surface
 * so the slug -> image mapping stays in one place.
 */
export function getCourseFallbackImage(slug: string, categoryName?: string | null): string {
  const s = slug.toLowerCase();
  const c = categoryName?.toLowerCase() ?? "";

  if (
    s.includes("data-science") ||
    s.includes("machine-learning") ||
    s.includes("python") ||
    s.includes("ai")
  ) {
    return "/images/courses/course-data-science.jpg";
  }
  if (
    s.includes("web") ||
    s.includes("full-stack") ||
    s.includes("react") ||
    s.includes("javascript")
  ) {
    return "/images/courses/course-web-dev.jpg";
  }
  if (
    s.includes("software") ||
    s.includes("adse") ||
    s.includes("java") ||
    s.includes("c-programming")
  ) {
    return "/images/courses/course-software-eng.jpg";
  }
  if (
    s.includes("tally") ||
    s.includes("account") ||
    s.includes("finance") ||
    c.includes("accounting")
  ) {
    return "/images/courses/course-accounting.jpg";
  }
  if (
    s.includes("network") ||
    s.includes("hardware") ||
    s.includes("cloud") ||
    c.includes("hardware")
  ) {
    return "/images/courses/course-networking.jpg";
  }
  return "/images/courses/course-dca.jpg";
}
