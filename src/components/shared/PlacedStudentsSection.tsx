import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { getMediaUrl } from "@/lib/media";
import { PLACED_STUDENTS_SLUG, type PublicGalleryCategory } from "@/lib/gallery";
import type { Locale } from "@/lib/site-settings";

export type PlacedStudentsData = {
  slug: string;
  items: PublicGalleryCategory["items"];
} | null;

interface PlacedStudentsSectionProps {
  data: PlacedStudentsData;
  locale: Locale;
  t: {
    badge: string;
    heading: string;
    subhead: string;
    viewAll: string;
  };
}

export function PlacedStudentsSection({ data, locale, t }: PlacedStudentsSectionProps) {
  if (!data || data.items.length === 0) return null;

  return (
    <section aria-labelledby="placed-students-heading" className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Trophy className="size-3.5" />
              <span>{t.badge}</span>
            </div>
            <h2
              id="placed-students-heading"
              className="text-3xl font-bold tracking-tight"
            >
              {t.heading}
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground leading-relaxed">
              {t.subhead}
            </p>
          </div>
          <Link
            href={`/gallery?category=${PLACED_STUDENTS_SLUG}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {t.viewAll}
            <ArrowRight className="size-3.5" />
          </Link>
        </Reveal>

        {/* Swipeable row: ~1.3 posters visible on phones so the overflow is obvious, 4 on desktop. */}
        <RevealGroup
          stagger={0.06}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
        >
          {data.items.map((item) => {
            const caption = (locale === "ml" ? item.captionMl : null) ?? item.captionEn;
            const src = getMediaUrl(item.url);
            return (
              <RevealItem
                key={item.id}
                y={20}
                scale={0.96}
                className="w-[75%] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
              >
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-border transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Image
                    src={src}
                    alt={caption ?? "Placed student poster"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 75vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </a>
                {caption && (
                  <p className="mt-2 line-clamp-2 text-sm font-medium">{caption}</p>
                )}
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
