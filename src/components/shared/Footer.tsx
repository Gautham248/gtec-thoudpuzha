import React from "react";
import { getLocale } from "next-intl/server";
import { siteConfig } from "@/lib/site";
import { getCachedSiteSettings } from "@/lib/data-cache";
import type { SiteSettings } from "@/db/types";
import { FooterContact } from "@/components/shared/FooterContact";
import {
  FooterLinksColumn,
  defaultQuickLinks,
  defaultPortalLinks,
  popularCourseLinks,
} from "@/components/shared/FooterLinks";
import type { NavCourse } from "@/lib/nav-courses";
import { FooterMap } from "@/components/shared/FooterMap";
import { FooterBottom } from "@/components/shared/FooterBottom";

interface FooterProps {
  settings?: Partial<SiteSettings> | null;
  address?: string | null;
  /** The published courses the layout already loads for the header. */
  courses?: NavCourse[];
}

export async function Footer({
  settings: propSettings,
  address: propAddress,
  courses = [],
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const locale = await getLocale().catch(() => "en");

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

  return (
    <footer className="bg-[#004282] text-white/70 antialiased selection:bg-sky-500 selection:text-white">
      {/* MAIN 5-COLUMN FOOTER CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
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
              links={popularCourseLinks(courses, locale)}
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

      {/* BOTTOM FOOTER BAR */}
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
