import React from "react";
import { siteConfig } from "@/lib/site";
import { getCachedSiteSettings } from "@/lib/data-cache";
import type { SiteSettings } from "@/db/types";
import { FooterContact } from "@/components/shared/FooterContact";
import {
  FooterLinksColumn,
  defaultQuickLinks,
  defaultPopularCourses,
  defaultPortalLinks,
} from "@/components/shared/FooterLinks";
import { FooterMap } from "@/components/shared/FooterMap";
import { FooterBottom } from "@/components/shared/FooterBottom";
import { MapPin, Star, ArrowUpRight } from "lucide-react";

interface FooterProps {
  settings?: Partial<SiteSettings> | null;
  address?: string | null;
}

export async function Footer({
  settings: propSettings,
  address: propAddress,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  let settings = propSettings;
  if (!settings) {
    try {
      settings = await getCachedSiteSettings();
    } catch {
      settings = null;
    }
  }

  const liveAddress =
    settings?.address || propAddress || siteConfig.locationAddress;

  const mapsUrl = settings?.mapsUrl || siteConfig.mapsUrl;

  const instagramUrl =
    settings?.instagramUrl !== undefined
      ? settings.instagramUrl
      : siteConfig.instagramUrl;

  const facebookUrl =
    settings?.facebookUrl !== undefined
      ? settings.facebookUrl
      : siteConfig.facebookUrl;

  const rawWhatsapp =
    settings?.whatsappNumber !== undefined
      ? settings.whatsappNumber
      : siteConfig.whatsappNumber;

  const whatsappUrl = rawWhatsapp
    ? rawWhatsapp.startsWith("http")
      ? rawWhatsapp
      : `https://wa.me/${rawWhatsapp.replace(/[^0-9]/g, "")}`
    : null;

  const googleReviewsUrl =
    settings?.googleReviewsUrl !== undefined
      ? settings.googleReviewsUrl
      : siteConfig.googleReviewsUrl;

  const mapEmbedUrl = settings?.mapEmbedUrl || siteConfig.mapEmbedUrl;

  // Build the dynamic list of Top of Footer quick link cards if explicitly configured
  const topFooterItems: {
    id: string;
    href: string;
    title: string;
    subtitle: string;
    ariaLabel: string;
    testId: string;
    icon: React.ReactNode;
    badgeColor?: string;
  }[] = [];

  if (mapsUrl && liveAddress) {
    topFooterItems.push({
      id: "location",
      href: mapsUrl,
      title: "Find Our Campus",
      subtitle: liveAddress,
      ariaLabel: `Find G-TEC Thodupuzha on Google Maps - ${liveAddress}`,
      testId: "footer-location-link",
      badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: <MapPin className="size-5 shrink-0 text-red-400" />,
    });
  }

  if (instagramUrl) {
    topFooterItems.push({
      id: "instagram",
      href: instagramUrl,
      title: "Instagram",
      subtitle: instagramUrl.includes("instagram.com/")
        ? `@${instagramUrl.split("instagram.com/")[1].replace(/\/$/, "") || "gtec_thodupuzha"}`
        : "Follow Us",
      ariaLabel: "Follow G-TEC Thodupuzha on Instagram",
      testId: "footer-instagram-link",
      badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-pink-400"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    });
  }

  if (facebookUrl) {
    topFooterItems.push({
      id: "facebook",
      href: facebookUrl,
      title: "Facebook",
      subtitle: "Official Page",
      ariaLabel: "Visit G-TEC Thodupuzha on Facebook",
      testId: "footer-facebook-link",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-blue-400"
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" />
        </svg>
      ),
    });
  }

  if (whatsappUrl) {
    topFooterItems.push({
      id: "whatsapp",
      href: whatsappUrl,
      title: "WhatsApp",
      subtitle: "Chat on WhatsApp",
      ariaLabel: "Chat with G-TEC Thodupuzha on WhatsApp",
      testId: "footer-whatsapp-link",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-emerald-400"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    });
  }

  if (googleReviewsUrl) {
    topFooterItems.push({
      id: "reviews",
      href: googleReviewsUrl,
      title: "Google Reviews",
      subtitle: "4.9 ★ Rated",
      ariaLabel: "Read G-TEC Thodupuzha Google Reviews and Ratings",
      testId: "footer-google-reviews-link",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: <Star className="size-5 shrink-0 text-amber-400 fill-amber-400" />,
    });
  }

  return (
    <footer className="bg-[#004282] text-slate-300 antialiased selection:bg-sky-500 selection:text-white border-t border-white/10">
      {/* 1. OPTIONAL DYNAMIC SOCIAL / CONTACT STRIP (Rendered when custom settings passed) */}
      {propSettings && topFooterItems.length > 0 && (
        <div
          className="border-b border-white/10 bg-black/15 py-6"
          data-testid="top-of-footer-section"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {topFooterItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.ariaLabel}
                  data-testid={item.testId}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg border ${item.badgeColor} shrink-0`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-3.5 text-slate-400 group-hover:text-sky-400 transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN 5-COLUMN FOOTER CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand & Contact (Width 4 on lg) */}
          <div className="md:col-span-2 lg:col-span-4">
            <FooterContact
              phone={siteConfig.phoneNumber}
              email={siteConfig.email}
              address={liveAddress}
              centreName={siteConfig.centreName}
            />
          </div>

          {/* Column 2: Quick Links (Width 2 on lg) */}
          <div className="lg:col-span-2">
            <FooterLinksColumn title="Quick Links" links={defaultQuickLinks} />
          </div>

          {/* Column 3: Popular Courses (Width 2 on lg) */}
          <div className="lg:col-span-2">
            <FooterLinksColumn
              title="Popular Courses"
              links={defaultPopularCourses}
            />
          </div>

          {/* Column 4: Student & Portal Links (Width 2 on lg) */}
          <div className="lg:col-span-2">
            <FooterLinksColumn
              title="Student & Portal"
              links={defaultPortalLinks}
            />
          </div>

          {/* Column 5: Google Maps Embed & CTA (Width 2 on lg) */}
          <div className="md:col-span-2 lg:col-span-2">
            <FooterMap
              mapsUrl={mapsUrl}
              mapEmbedUrl={mapEmbedUrl}
              address={liveAddress}
              title={siteConfig.brandName}
            />
          </div>
        </div>
      </div>

      {/* 4. BOTTOM FOOTER BAR */}
      <FooterBottom
        currentYear={currentYear}
        facebookUrl={facebookUrl}
        instagramUrl={instagramUrl}
        whatsappUrl={whatsappUrl}
        googleReviewsUrl={googleReviewsUrl}
        centreName={siteConfig.centreName}
      />
    </footer>
  );
}
