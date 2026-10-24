import { db } from "@/db";
import type { SiteSettings, WhyChooseUsCard } from "@/db/types";
import { pickLocalizedText, type Locale } from "@/lib/i18n-utils";
import { getMediaUrl } from "@/lib/media";
import { logger } from "@/lib/logger";
import { siteConfig } from "@/lib/site";

export type SiteSettingsWithCards = SiteSettings & {
  whyChooseUsCards: WhyChooseUsCard[];
};

export { pickLocalizedText, type Locale };

// Mirrors the SiteSettings values in src/db/seed/run.ts so a degraded render (missing row or
// transient DB error) shows the same numbers as a freshly-seeded production DB.
const DEFAULT_SITE_SETTINGS: SiteSettingsWithCards = {
  id: "default",
  createdAt: new Date(),
  updatedAt: new Date(),
  yearsInOperation: "25+",
  studentsTrained: "3.2M+",
  centresWorldwide: "800+",
  affiliations: "100+",
  countries: "23",
  aboutBodyEn:
    "G-TEC EDUCATION Thodupuzha is a premier skill development and computer education centre.",
  aboutBodyMl:
    "ജി-ടെക് എഡ്യൂക്കേഷൻ തൊടുപുഴ ഒരു പ്രമുഖ കമ്പ്യൂട്ടർ വിദ്യാഭ്യാസ സ്ഥാപനമാണ്.",
  aboutPhotoUrl: null,
  address: siteConfig.locationAddress,
  mapEmbedUrl: siteConfig.mapEmbedUrl,
  mapsUrl: siteConfig.mapsUrl,
  whatsappNumber: "919744221113",
  facebookUrl: "https://www.facebook.com/share/1FLZXJZ7ux/",
  instagramUrl: "https://www.instagram.com/gtec_thodupuzha/",
  youtubeUrl: null,
  linkedinUrl: null,
  googleReviewsUrl:
    "https://www.google.com/maps/search/?api=1&query=G-TEC+EDUCATION+Thodupuzha+reviews",
  whyChooseUsCards: [],
};

export async function getSiteSettings(): Promise<SiteSettingsWithCards> {
  try {
    const settings = await db.query.siteSettings.findFirst({
      with: {
        whyChooseUsCards: {
          orderBy: (c, { asc }) => asc(c.sortOrder),
        },
      },
    });

    if (!settings) {
      return DEFAULT_SITE_SETTINGS;
    }

    return settings;
  } catch (err) {
    // A missing row is handled above and is not an error. Anything reaching here
    // is a real failure (connection dropped, schema mismatch), so it must be
    // reported — otherwise an outage renders fabricated stats with no signal.
    logger.exception("site-settings", "Failed to load site settings", err);
    return DEFAULT_SITE_SETTINGS;
  }
}

export function getAtAGlanceStats(settings: SiteSettingsWithCards) {
  return [
    { label: "Years of Legacy", value: settings.yearsInOperation },
    { label: "Affiliations", value: settings.affiliations },
    { label: "Students", value: settings.studentsTrained },
    { label: "Countries Served", value: settings.countries },
    { label: "Centres across the globe", value: settings.centresWorldwide },
  ];
}

export function getLocalizedWhyCards(
  settings: SiteSettingsWithCards,
  locale: Locale,
) {
  return settings.whyChooseUsCards.map((card) => ({
    ...card,
    title: pickLocalizedText({ en: card.titleEn, ml: card.titleMl }, locale),
    description: pickLocalizedText(
      { en: card.descriptionEn, ml: card.descriptionMl },
      locale,
    ),
  }));
}

/** About photo used when none is set in Admin → Settings → Site. */
export const DEFAULT_ABOUT_PHOTO = "/images/gtec-thodupuzha.webp";

export function getLocalizedAbout(
  settings: SiteSettingsWithCards,
  locale: Locale,
) {
  return {
    body: pickLocalizedText(
      { en: settings.aboutBodyEn, ml: settings.aboutBodyMl },
      locale,
    ),
    photoUrl: settings.aboutPhotoUrl
      ? getMediaUrl(settings.aboutPhotoUrl)
      : null,
  };
}
