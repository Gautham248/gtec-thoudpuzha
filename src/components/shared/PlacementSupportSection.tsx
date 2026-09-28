import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
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
    <section aria-labelledby="placement-support-heading" className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10 flex items-center justify-between">
          <h2
            id="placement-support-heading"
            className="text-3xl font-bold tracking-tight"
          >
            {heading}
          </h2>
          <Link
            href={`/gallery?category=${PLACEMENT_SLUG}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {viewFullGallery}
            <ArrowRight className="size-3.5" />
          </Link>
        </Reveal>

        <RevealGroup stagger={0.06} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.items.map((item) => (
            <RevealItem
              key={item.id}
              y={20}
              scale={0.96}
              className="group relative aspect-square overflow-hidden rounded-xl bg-muted shadow-sm"
            >
              <Image
                src={getMediaUrl(item.url)}
                alt={item.captionEn ?? "Placement & Support image"}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {item.captionEn && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
                  <p className="truncate text-xs font-medium text-white">
                    {item.captionEn}
                  </p>
                </div>
              )}
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-12 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 p-8 text-center sm:p-10">
          <h3 className="text-2xl font-bold tracking-tight">{ctaHeading}</h3>
          <p className="mt-3 max-w-lg mx-auto text-muted-foreground leading-relaxed">
            {ctaText}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/portal/jobs"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
            >
              {viewVacancies}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/portal/employer/register"
              className="inline-flex items-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold shadow-sm transition-all hover:bg-muted hover:shadow-md"
            >
              {hiringCta}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
