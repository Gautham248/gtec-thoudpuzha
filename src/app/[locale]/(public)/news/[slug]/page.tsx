import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getNewsEventBySlug } from "@/lib/news-events";
import { getMediaUrl } from "@/lib/media";
import { pickLocalizedText, type Locale } from "@/lib/i18n-utils";

interface NewsDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({
  params,
}: NewsDetailPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "news" });
  const loc = locale as Locale;

  const item = await getNewsEventBySlug(slug);

  if (!item) {
    notFound();
  }

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
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/news"
        className="text-sm text-primary underline hover:no-underline"
      >
        {t("backToNews")}
      </Link>

      <article className="mt-6">
        <p className="text-sm font-semibold text-muted-foreground">
          {item.type === "NEWS" ? t("news") : t("event")} &middot;{" "}
          {formatDate(item.publishedAt)}
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {pickLocalizedText({ en: item.titleEn, ml: item.titleMl }, loc)}
        </h1>

        {item.coverImageUrl && (
          <Image
            src={getMediaUrl(item.coverImageUrl)}
            alt={pickLocalizedText({ en: item.titleEn, ml: item.titleMl }, loc)}
            width={1200}
            height={675}
            className="mt-6 w-full rounded-2xl object-cover shadow-sm"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        )}

        {item.eventDate && (
          <p className="mt-4 text-sm sm:text-base font-semibold text-primary">
            {t("eventDate", { date: formatDate(item.eventDate) })}
          </p>
        )}

        <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground/90">
          {pickLocalizedText({ en: item.bodyEn, ml: item.bodyMl }, loc)}
        </div>
      </article>
    </main>
  );
}
