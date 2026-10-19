import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Marquee } from "@/components/shared/Marquee";
import { getMediaUrl } from "@/lib/media";
import {
  PLACED_STUDENTS_SLUG,
  type PublicGalleryCategory,
} from "@/lib/gallery";
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

export function PlacedStudentsSection({
  data,
  locale,
  t,
}: PlacedStudentsSectionProps) {
  if (!data || data.items.length === 0) return null;

  return (
    <section
      aria-labelledby="placed-students-heading"
      className="py-16 lg:py-20"
    >
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
      </div>

      {/* Full-width endless row of posters, captions under each. */}
      <Marquee
        data-testid="placed-students-marquee"
        items={data.items}
        itemKey={(item) => item.id}
        secondsPerItem={6}
        itemClassName="mr-4 w-[calc((100vw-2rem)/2.5)] sm:mr-6 sm:w-[calc(100vw/3.5)] lg:mr-8 lg:w-[calc(100vw/4.5)]"
        renderItem={(item, repeat) => {
          const caption =
            (locale === "ml" ? item.captionMl : null) ?? item.captionEn;
          const src = getMediaUrl(item.url);
          return (
            <>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={repeat ? -1 : undefined}
                className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-border transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Image
                  src={src}
                  alt={repeat ? "" : (caption ?? "Placed student poster")}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 40vw, (max-width: 1024px) 29vw, 23vw"
                />
              </a>
              {caption && (
                <p className="mt-2 line-clamp-2 text-sm font-medium">
                  {caption}
                </p>
              )}
            </>
          );
        }}
      />
    </section>
  );
}
