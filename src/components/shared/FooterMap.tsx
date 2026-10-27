import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { siteConfig } from "@/lib/site";

interface FooterMapProps {
  /** Opens the centre's Google Maps listing. */
  mapsUrl?: string | null;
  mapEmbedUrl?: string | null;
  address?: string | null;
  title?: string;
}

export function FooterMap({
  mapsUrl,
  mapEmbedUrl,
  address,
  title = siteConfig.brandName,
}: FooterMapProps) {
  const listingUrl = mapsUrl || siteConfig.mapsUrl;

  return (
    <div className="space-y-5 text-left">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
        <a
          href={listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-sky-300"
        >
          Find Us On Google Maps
        </a>
      </h3>

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#14283f]">
        <iframe
          src={mapEmbedUrl || siteConfig.mapEmbedUrl}
          width="100%"
          height="180"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          title={`${title} location`}
          className="h-44 w-full"
        />
      </div>

      {/* Location Details Text */}
      <a
        href={listingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-2 text-sm leading-snug text-white/70 transition-colors hover:text-white"
      >
        <MapPin
          className="mt-0.5 size-3.5 shrink-0 text-sky-300"
          aria-hidden="true"
        />
        <span className="space-y-0.5">
          <span className="block font-bold text-white">{title}</span>
          <span className="block">{address || siteConfig.locationAddress}</span>
        </span>
      </a>

      {/* "Get Directions" CTA Button */}
      <a
        href={siteConfig.directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="footer-location-link"
        aria-label={`Get Directions to ${title} on Google Maps`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#004282] transition-colors hover:bg-sky-100"
      >
        <Navigation className="size-4" aria-hidden="true" />
        <span>Get Directions</span>
        <ExternalLink className="size-3.5 opacity-60" aria-hidden="true" />
      </a>
    </div>
  );
}
