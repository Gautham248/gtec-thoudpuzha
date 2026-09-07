import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPublishedNews } from "@/lib/news-events";
import { pickLocalizedText, type Locale } from "@/lib/i18n-utils";

interface NewsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "news" });
  const loc = locale as Locale;

  const items = await getPublishedNews();
  const newsItems = items.filter((i) => i.type === "NEWS");
  const eventItems = items.filter((i) => i.type === "EVENT");

  function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (!(d instanceof Date) || isNaN(d.getTime())) return "";
    try {
      return d.toLocaleDateString(locale === "ml" ? "ml-IN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl sm:text-3xl font-extrabold tracking-tight">{t("heading")}</h1>

      {newsItems.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg sm:text-xl font-bold">{t("latestNews")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {newsItems.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="block rounded-2xl border border-border p-5 transition-all hover:shadow-md hover:border-primary/40"
              >
                <p className="text-sm font-semibold text-muted-foreground">
                  {formatDate(item.publishedAt)}
                </p>
                <h3 className="mt-1.5 text-base sm:text-lg font-bold">
                  {pickLocalizedText({ en: item.titleEn, ml: item.titleMl }, loc)}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {pickLocalizedText({ en: item.bodyEn, ml: item.bodyMl }, loc)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {eventItems.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg sm:text-xl font-bold">{t("upcomingEvents")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eventItems.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="block rounded-2xl border border-border p-5 transition-all hover:shadow-md hover:border-primary/40"
              >
                <p className="text-sm font-semibold text-muted-foreground">
                  {item.eventDate
                    ? formatDate(item.eventDate)
                    : formatDate(item.publishedAt)}
                </p>
                <h3 className="mt-1.5 text-base sm:text-lg font-bold">
                  {pickLocalizedText({ en: item.titleEn, ml: item.titleMl }, loc)}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {pickLocalizedText({ en: item.bodyEn, ml: item.bodyMl }, loc)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <p className="text-muted-foreground">{t("noNews")}</p>
      )}
    </main>
  );
}
