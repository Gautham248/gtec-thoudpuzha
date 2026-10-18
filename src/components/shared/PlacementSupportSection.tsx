import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Marquee } from "@/components/shared/Marquee";
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
    <section
      aria-labelledby="placement-support-heading"
      className="py-16 lg:py-20"
    >
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
      </div>

      {/* Full-width endless row of placement photos (no captions). */}
      <PlacementMarquee items={data.items} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

function PlacementMarquee({
  items,
}: {
  items: NonNullable<PlacementData>["items"];
}) {
  return (
    <Marquee
      data-testid="placement-marquee"
      items={items}
      itemKey={(item) => item.id}
      itemClassName="relative mr-4 aspect-square w-[calc((100vw-2rem)/2.5)] overflow-hidden rounded-xl bg-muted shadow-sm sm:mr-6 sm:w-[calc(100vw/3.5)] lg:mr-8 lg:w-[calc(100vw/4.5)]"
      renderItem={(item, repeat) => (
        <Image
          src={getMediaUrl(item.url)}
          alt={repeat ? "" : (item.captionEn ?? "Placement & Support image")}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 29vw, 23vw"
        />
      )}
    />
  );
}
