import { describe, expect, test } from "vitest";
import { renderToString } from "react-dom/server";
import { WhyChooseUsSection } from "./WhyChooseUsSection";

function createSettings(titleEn: string) {
  return {
    id: "settings_1",
    yearsInOperation: "25+",
    studentsTrained: "3.2M+",
    centresWorldwide: "800+",
    affiliations: "100+",
    countries: "23",
    aboutBodyEn: "About",
    aboutBodyMl: null,
    aboutPhotoUrl: null,
    address: null,
    mapEmbedUrl: null,
    mapsUrl: null,
    whatsappNumber: null,
    facebookUrl: null,
    instagramUrl: null,
    youtubeUrl: null,
    linkedinUrl: null,
    googleReviewsUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    whyChooseUsCards: [
      {
        id: "card_1",
        siteSettingsId: "settings_1",
        sortOrder: 0,
        icon: "AWARD" as const,
        titleEn,
        titleMl: null,
        descriptionEn: "Description 1",
        descriptionMl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "card_2",
        siteSettingsId: "settings_1",
        sortOrder: 1,
        icon: "USERS" as const,
        titleEn: "Title 2",
        titleMl: null,
        descriptionEn: "Description 2",
        descriptionMl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "card_3",
        siteSettingsId: "settings_1",
        sortOrder: 2,
        icon: "BRIEFCASE" as const,
        titleEn: "Title 3",
        titleMl: null,
        descriptionEn: "Description 3",
        descriptionMl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };
}

describe("WhyChooseUsSection", () => {
  test("renders the Why Choose Us card title from SiteSettings", async () => {
    const element = await WhyChooseUsSection({
      settings: createSettings("ISO-Authorized Curriculum"),
      heading: "Why Choose Us",
      locale: "en",
    });
    const html = renderToString(element);

    expect(html).toContain("ISO-Authorized Curriculum");
  });

  test("reflects an updated card title from SiteSettings", async () => {
    const element = await WhyChooseUsSection({
      settings: createSettings("Updated Card Title"),
      heading: "Why Choose Us",
      locale: "en",
    });
    const html = renderToString(element);

    expect(html).toContain("Updated Card Title");
  });
});
