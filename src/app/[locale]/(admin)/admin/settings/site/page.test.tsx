import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import SiteSettingsPage from "./page";

const mockRequireRole = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireRole: mockRequireRole,
  Role: {
    SUPER_ADMIN: "SUPER_ADMIN",
    CENTRE_STAFF: "CENTRE_STAFF",
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    siteSettings: {
      findFirst: mockFindFirst,
    },
  },
}));

function createSettings() {
  return {
    id: "settings_1",
    yearsInOperation: "25+",
    studentsTrained: "3.2M+",
    centresWorldwide: "800+",
    affiliations: "100+",
    countries: "23",
    aboutBodyEn: "About body",
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
        titleEn: "Title 1",
        titleMl: null,
        descriptionEn: "Description 1",
        descriptionMl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "card_2",
        sortOrder: 1,
        icon: "USERS",
        titleEn: "Title 2",
        titleMl: null,
        descriptionEn: "Description 2",
        descriptionMl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "card_3",
        sortOrder: 2,
        icon: "BRIEFCASE",
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

describe("SiteSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockReset();
    mockRedirect.mockReset();
    mockFindFirst.mockReset();
    mockFindFirst.mockResolvedValue(createSettings());
  });

  test("is denied to a centre_staff-role user and redirects to forbidden", async () => {
    mockRequireRole.mockResolvedValue({
      authorized: false,
      reason: "forbidden",
    });

    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT /en/forbidden");
    });

    await expect(
      SiteSettingsPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("/en/forbidden");

    expect(mockRedirect).toHaveBeenCalledWith("/en/forbidden");
  });

  test("is accessible to a super_admin-role user and renders the settings form", async () => {
    mockRequireRole.mockResolvedValue({
      authorized: true,
      role: "SUPER_ADMIN",
      userId: "user_super_admin",
    });

    const element = await SiteSettingsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("Site Settings");
    expect(html).toContain("At a Glance");
    expect(html).toContain("About Section");
    expect(html).toContain("Why Choose Us");
    expect(html).toContain("Location, Contact &amp; Social");
    expect(html).toContain("Save Settings");
  });
});
