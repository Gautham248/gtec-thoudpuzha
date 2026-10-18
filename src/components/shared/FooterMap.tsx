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
    <div className="space-y-4 text-left">
      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-sky-400 inline-block" />
        <a
          href={listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-sky-300 transition-colors"
        >
          Find Us On Google Maps
        </a>
      </h3>

      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#14283f] shadow-lg transition-all duration-300 hover:border-sky-400/40">
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
        className="flex gap-2 text-xs leading-snug text-slate-300 hover:text-white"
      >
        <MapPin className="mt-0.5 size-3.5 shrink-0 text-sky-400" />
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
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.99]"
      >
        <Navigation className="size-4 transition-transform duration-200 group-hover:rotate-12" />
        <span>Get Directions</span>
        <ExternalLink className="size-3.5 opacity-70 group-hover:opacity-100 ml-1" />
      </a>
    </div>
  );
}
