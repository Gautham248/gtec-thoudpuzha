import Link from "next/link";
import { CalendarDays, ArrowRight, Sparkles, MapPin, Clock } from "lucide-react";
import type { PublicNewsEvent } from "@/lib/news-events";
import { pickLocalizedText, type Locale } from "@/lib/i18n-utils";

interface EventsSectionProps {
  events: PublicNewsEvent[];
  locale: Locale;
}

function parseEventDate(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return null;

  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = d.toLocaleDateString("en-US", { day: "2-digit" });
  const year = d.getFullYear();
  const fullDate = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return { month, day, year, fullDate };
}

export function EventsSection({ events, locale }: EventsSectionProps) {
  return (
    <section aria-labelledby="events-heading" className="relative py-16 sm:py-20 lg:py-24 bg-muted/20 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 sm:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary mb-3">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>{locale === "ml" ? "ക്യാമ്പസ് ഇവന്റുകൾ" : "Campus Happenings"}</span>
            </div>
            <h2
              id="events-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground"
            >
              {locale === "ml" ? "വരാനിരിക്കുന്ന ഇവന്റുകൾ" : "Upcoming Events & Workshops"}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl">
              {locale === "ml"
                ? "ജി-ടെക് തൊടുപുഴയിൽ നടക്കുന്ന വരാനിരിക്കുന്ന വർക്ക്‌ഷോപ്പുകളും സെമിനാറുകളും അറിയുക."
                : "Discover upcoming skill workshops, career guidance seminars, and industry visits at G-TEC Thodupuzha."}
            </p>
          </div>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 group self-start sm:self-auto transition-colors"
          >
            <span>{locale === "ml" ? "എല്ലാ ഇവന്റുകളും കാണുക" : "View All Events"}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const dateInfo = parseEventDate(event.eventDate || event.publishedAt);
              const title = pickLocalizedText(
                { en: event.titleEn, ml: event.titleMl },
                locale,
              );
              const body = pickLocalizedText(
                { en: event.bodyEn, ml: event.bodyMl },
                locale,
              );

              return (
                <Link
                  key={event.id}
                  href={`/news/${event.slug}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50"
                >
                  <div>
                    {/* Header Row: Date Badge & Tag */}
                    <div className="mb-5 flex items-start gap-4">
                      {dateInfo ? (
                        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 text-primary text-center font-black transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <span className="text-xs tracking-wider leading-none">
                            {dateInfo.month}
                          </span>
                          <span className="text-lg leading-tight">
                            {dateInfo.day}
                          </span>
                        </div>
                      ) : (
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/25">
                          <CalendarDays className="size-6" />
                        </div>
                      )}

                      <div className="flex flex-col justify-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          <Clock className="size-3" />
                          <span>{locale === "ml" ? "വർക്ക്‌ഷോപ്പ്" : "Upcoming Workshop"}</span>
                        </span>
                        {dateInfo && (
                          <span className="text-xs font-semibold text-muted-foreground mt-0.5">
                            {dateInfo.fullDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="line-clamp-2 text-lg font-extrabold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {title}
                    </h3>

                    {/* Description preview */}
                    <p className="mt-2.5 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                      {body}
                    </p>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50 text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary" />
                      <span>{locale === "ml" ? "തൊടുപുഴ ക്യാമ്പസ്" : "Thodupuzha Campus"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      <span>{locale === "ml" ? "വിശദാംശങ്ങൾ" : "Details"}</span>
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty state / Fallback */
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-10 text-center">
            <CalendarDays className="mx-auto size-10 text-primary/60 mb-3" />
            <h3 className="text-lg font-bold text-foreground">
              {locale === "ml" ? "പുതിയ ഇവന്റുകൾ ഉടൻ പ്രഖ്യാപിക്കും" : "New Events Coming Soon"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              {locale === "ml"
                ? "വർക്ക്‌ഷോപ്പുകളും സെമിനാറുകളും ഉടൻ ഇവിടെ അപ്‌ഡേറ്റ് ചെയ്യപ്പെടും."
                : "We regularly host tech seminars, job fairs, and career guidance sessions. Check back soon for the next announcement."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
