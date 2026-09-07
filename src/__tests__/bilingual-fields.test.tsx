// @vitest-environment node

import { describe, expect, test, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { pickLocalizedText } from "@/lib/site-settings";
import mlMessages from "@/lib/i18n/ml.json";

/* ─── Test 1 & 2: pickLocalizedText fallback logic ─── */

describe("Course locale-aware rendering", () => {
  test("1. course with both titleEn and titleMl renders titleMl under /ml", () => {
    const title = pickLocalizedText(
      { en: "Web Development", ml: "വെബ് ഡെവലപ്‌മെന്റ്" },
      "ml",
    );
    expect(title).toBe("വെബ് ഡെവലപ്‌മെന്റ്");
  });

  test("2. course with titleMl null falls back to titleEn under /ml", () => {
    const title = pickLocalizedText(
      { en: "Web Development", ml: null },
      "ml",
    );
    expect(title).toBe("Web Development");
  });
});

/* ─── Test 3: Admin forms render both language inputs ─── */

const mockRequireRole = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireRole: mockRequireRole,
  Role: { SUPER_ADMIN: "SUPER_ADMIN", CENTRE_STAFF: "CENTRE_STAFF" },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    siteSettings: { findFirst: mockFindFirst },
  },
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("Admin forms show bilingual inputs", () => {
  const mockSettings = {
    id: "settings_1",
    yearsInOperation: "25+",
    studentsTrained: "3.2M+",
    centresWorldwide: "800+",
    affiliations: "100+",
    countries: "23",
    aboutBodyEn: "About G-TEC",
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
        sortOrder: 0,
        icon: "AWARD",
        titleEn: "ISO-Authorized",
        titleMl: null,
        descriptionEn: "Desc",
        descriptionMl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  test("3. admin form renders both English and Malayalam inputs for bilingual fields", async () => {
    mockRequireRole.mockResolvedValue({
      authorized: true,
      role: "SUPER_ADMIN",
      userId: "admin_1",
    });
    mockFindFirst.mockResolvedValue(mockSettings);

    const { default: SiteSettingsPage } = await import(
      "@/app/[locale]/(admin)/admin/settings/site/page"
    );

    const html = await SiteSettingsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const rendered = renderToString(html);

    // About body (English) and (Malayalam) inputs both present
    expect(rendered).toContain("About body (English)");
    expect(rendered).toContain("About body (Malayalam)");

    // Why Choose Us bilingual fields
    expect(rendered).toContain("Title (English)");
    expect(rendered).toContain("Title (Malayalam)");
    expect(rendered).toContain("Description (English)");
    expect(rendered).toContain("Description (Malayalam)");
  });
});

/* ─── Test 4: ml.json has no [ML] placeholders ─── */

describe("ml.json translations", () => {
  test("4. no [ML] placeholder-prefixed strings remain in ml.json", () => {
    const json = JSON.stringify(mlMessages);
    expect(json).not.toMatch(/\[ML\]/);
  });
});
