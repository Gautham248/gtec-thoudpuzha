export type Locale = "en" | "ml";

/**
 * A short day-month-year date in the active locale. Pinned to IST so the
 * server render and the browser agree on which day it is.
 */
export function formatDate(date: Date | string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ml" ? "ml-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

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
