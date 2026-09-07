import { expect, test, vi } from "vitest";
import HomePage from "@/app/[locale]/(public)/page";

async function renderHomePage(): Promise<string> {
  const { renderToReadableStream } = await import("react-dom/server");
  const page = await HomePage({ params: Promise.resolve({ locale: "en" }) });
  const stream = await renderToReadableStream(page);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let html = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
  }
  return html;
}

// getLocale and getTranslations are mocked globally in __tests__/setup.ts

vi.mock("@/lib/gallery", () => ({
  getPlacementGalleryData: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/courses", () => ({
  getPublishedCourses: vi.fn(() => Promise.resolve([])),
  getCachedPublishedCourses: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/lib/certification-partners", () => ({
  getCertificationPartners: vi.fn(() => Promise.resolve([])),
  getCachedCertificationPartners: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/lib/news-events", () => ({
  getHomepageTeaser: vi.fn(() => Promise.resolve({ newsItems: [], nextEvent: null, flashNews: [], featuredNews: null })),
  getCachedHomepageTeaser: vi.fn(() => Promise.resolve({ newsItems: [], nextEvent: null, flashNews: [], featuredNews: null })),
  getUpcomingEvents: vi.fn(() => Promise.resolve([])),
  getCachedUpcomingEvents: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/lib/site-settings", async () => {
  const actual = await vi.importActual("@/lib/site-settings");
  return {
    ...actual,
    getSiteSettings: vi.fn(() =>
      Promise.resolve({
        id: "settings_1",
        yearsInOperation: "25+",
        studentsTrained: "3.2M+",
        centresWorldwide: "800+",
        affiliations: "100+",
        countries: "23",
        aboutBodyEn: "About",
        aboutBodyMl: null,
        aboutPhotoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        whyChooseUsCards: [
          {
            id: "card_1",
            sortOrder: 0,
            icon: "AWARD",
            titleEn: "Title 1",
            titleMl: null,
            descriptionEn: "Description 1",
            descriptionMl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }),
    ),
  };
});

test("homepage renders without throwing", async () => {
  const html = await renderHomePage();
  expect(html).toBeTruthy();
});

test("(public) homepage renders main elements and sections", async () => {
  const html = await renderHomePage();
  // Structure check (translated strings come from dictionaries)
  expect(html).toContain("Build Your Career With G-TEC Thodupuzha");
  expect(html).toContain("Apply Now");
  expect(html).toContain("Years of Operation");
  expect(html).toContain("About");
});
