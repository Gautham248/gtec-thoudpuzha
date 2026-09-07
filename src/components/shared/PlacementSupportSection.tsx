import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Briefcase, Building, Sparkles } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import type { PublicGalleryCategory } from "@/lib/gallery";

const PLACEMENT_SLUG = "placement-support";

export type PlacementData = {
  slug: string;
  items: PublicGalleryCategory["items"];
} | null;

export function PlacementSupportSection({
  data,
  heading,
  viewFullGallery,
  ctaHeading,
  ctaText,
  viewVacancies,
  hiringCta,
}: {
  data: PlacementData;
  heading: string;
  viewFullGallery: string;
  ctaHeading: string;
  ctaText: string;
  viewVacancies: string;
  hiringCta: string;
}) {
  if (!data || data.items.length === 0) return null;

  return (
    <section aria-labelledby="placement-support-heading" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 sm:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary mb-3">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Career Outcomes</span>
            </div>
            <h2
              id="placement-support-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground"
            >
              {heading}
            </h2>
          </div>
          <Link
            href={`/gallery?category=${PLACEMENT_SLUG}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 group self-start sm:self-auto transition-colors"
          >
            <span>{viewFullGallery}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-muted border border-border/70 shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40"
            >
              <Image
                src={getMediaUrl(item.url)}
                alt={item.captionEn ?? "Placement & Support image"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {item.captionEn && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3.5 sm:p-4 pt-10">
                  <p className="truncate text-sm font-bold text-white">
                    {item.captionEn}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* High Conversion Placement & Hiring Banner */}
        <div className="relative mt-12 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-amber-500/10 p-7 sm:p-10 text-center shadow-lg">
          <div className="mx-auto max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {ctaHeading}
            </h3>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {ctaText}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row flex-wrap justify-center gap-3.5">
              <Link
                href="/portal/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm sm:text-base font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <Briefcase className="size-4.5" />
                <span>{viewVacancies}</span>
                <ArrowRight className="size-4.5" />
              </Link>
              <Link
                href="/portal/employer/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary/40 bg-background/80 px-6 py-3 text-sm sm:text-base font-bold text-foreground shadow-xs transition-all hover:bg-muted/80 hover:border-primary hover:-translate-y-0.5 active:translate-y-0"
              >
                <Building className="size-4.5 text-primary" />
                <span>{hiringCta}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

