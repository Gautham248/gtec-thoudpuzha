export type Locale = "en" | "ml";

export function pickLocalizedText(
  localized: { en?: string | null; ml?: string | null },
  locale: Locale,
  fallback = "",
): string {
  if (locale === "ml" && localized.ml) {
    return localized.ml;
  }
  return localized.en ?? fallback;
}
