import { prisma } from "@/lib/db";
import type { SiteSettings, WhyChooseUsCard } from "@prisma/client";

export type SiteSettingsWithCards = SiteSettings & {
  whyChooseUsCards: WhyChooseUsCard[];
};

import { pickLocalizedText, type Locale } from "@/lib/i18n-utils";
export { pickLocalizedText, type Locale };

// Mirrors prisma/seed.ts SiteSettings values so a degraded render (missing row or
// transient DB error) shows the same numbers as a freshly-seeded production DB.
const DEFAULT_SITE_SETTINGS: SiteSettingsWithCards = {
  id: "default",
  createdAt: new Date(),
  updatedAt: new Date(),
  yearsInOperation: "20+",
  studentsTrained: "15000+",
  centresWorldwide: "120+",
  affiliations: "50+",
  countries: "23",
  aboutBodyEn:
    "G-TEC EDUCATION Thodupuzha is a premier skill development and computer education centre.",
  aboutBodyMl:
    "ജി-ടെക് എഡ്യൂക്കേഷൻ തൊടുപുഴ ഒരു പ്രമുഖ കമ്പ്യൂട്ടർ വിദ്യാഭ്യാസ സ്ഥാപനമാണ്.",
  aboutPhotoUrl: null,
  address:
    "G-TEC Education, Near Municipal Office, Thodupuzha, Idukki District, Kerala - 685584",
  mapEmbedUrl: null,
  mapsUrl:
    "https://maps.google.com/?q=G-TEC+Computer+Education,+East+End,+Thodupuzha-Udumbanoor+Rd,+near+De+Paul+Public+School,+Thodupuzha,+Kerala+685585",
  whatsappNumber: "919544229992",
  facebookUrl: "https://www.facebook.com/gtectdpa",
  instagramUrl: "https://www.instagram.com/gtec_thodupuzha/",
  youtubeUrl: null,
  linkedinUrl: null,
  googleReviewsUrl:
    "https://www.google.com/maps/search/?api=1&query=G-TEC+Computer+Education+Thodupuzha+reviews",
  whyChooseUsCards: [],
};

export async function getSiteSettings(): Promise<SiteSettingsWithCards> {
  try {
    const settings = await prisma.siteSettings.findFirst({
      include: {
        whyChooseUsCards: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!settings) {
      return DEFAULT_SITE_SETTINGS;
    }

    return settings;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}


export function getAtAGlanceStats(settings: SiteSettingsWithCards) {
  return [
    { label: "Years of Operation", value: settings.yearsInOperation },
    { label: "Students Trained", value: settings.studentsTrained },
    { label: "Centres Worldwide", value: settings.centresWorldwide },
    { label: "Affiliations", value: settings.affiliations },
    { label: "Countries", value: settings.countries },
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

export function getLocalizedAbout(
  settings: SiteSettingsWithCards,
  locale: Locale,
) {
  return {
    body: pickLocalizedText({ en: settings.aboutBodyEn, ml: settings.aboutBodyMl }, locale),
    photoUrl: settings.aboutPhotoUrl,
  };
}
