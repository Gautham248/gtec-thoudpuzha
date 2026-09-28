import Link from "next/link";
import { CalendarDays, Newspaper } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

interface TeaserItem {
  id: string;
  type: "NEWS" | "EVENT";
  titleEn: string;
  titleMl: string | null;
  slug: string;
  publishedAt: Date | string | null;
  eventDate: Date | string | null;
}

interface NewsTeaserSectionProps {
  teaser: {
    newsItems: TeaserItem[];
    nextEvent: TeaserItem | null;
  };
  heading: string;
  viewAll: string;
  upcomingEventLabel: string;
  locale: "en" | "ml";
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function pickLocalizedText(
  localized: { en: string; ml?: string | null },
  locale: "en" | "ml",
): string {
  return locale === "ml" && localized.ml ? localized.ml : localized.en;
}

export function NewsTeaserSection({
  teaser,
  heading,
  viewAll,
  upcomingEventLabel,
  locale,
}: NewsTeaserSectionProps) {
  const { newsItems, nextEvent } = teaser;

  if (newsItems.length === 0 && !nextEvent) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">{heading}</h2>
          <Link
            href="/news"
            className="text-sm font-semibold text-primary hover:underline"
          >
            {viewAll} →
          </Link>
        </Reveal>

        <RevealGroup
          stagger={0.08}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {newsItems.map((item) => (
            <RevealItem key={item.id} className="h-full">
              <Link
                href={`/news/${item.slug}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-background p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Newspaper className="size-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatDate(item.publishedAt)}
                  </p>
                </div>
                <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                  {pickLocalizedText(
                    { en: item.titleEn, ml: item.titleMl },
                    locale,
                  )}
                </h3>
              </Link>
            </RevealItem>
          ))}

          {nextEvent && (
            <RevealItem key={nextEvent.id} className="h-full">
              <Link
                href={`/news/${nextEvent.slug}`}
                className="group flex h-full flex-col rounded-xl border-2 border-primary/20 bg-primary/5 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30"
              >
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  <p className="text-xs font-semibold text-primary">
                    {upcomingEventLabel}
                  </p>
                </div>
                <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                  {pickLocalizedText(
                    { en: nextEvent.titleEn, ml: nextEvent.titleMl },
                    locale,
                  )}
                </h3>
                {nextEvent.eventDate && (
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    {formatDate(nextEvent.eventDate)}
                  </p>
                )}
              </Link>
            </RevealItem>
          )}
        </RevealGroup>
      </div>
    </section>
  );
}
