import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import FooterSettingsPage from "./page";

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
    address:
      "East End, Thodupuzha-Udumbanoor Rd, near De Paul Public School, Thodupuzha, Kerala 685585",
    mapEmbedUrl: null,
    mapsUrl: "https://maps.google.com/?q=G-TEC",
    whatsappNumber: "919544229992",
    facebookUrl: "https://facebook.com/gtectdpa",
    instagramUrl: "https://instagram.com/gtec_thodupuzha",
    youtubeUrl: null,
    linkedinUrl: null,
    googleReviewsUrl: "https://google.com/reviews",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("FooterSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockReset();
    mockRedirect.mockReset();
    mockFindFirst.mockReset();
    mockFindFirst.mockResolvedValue(createSettings());
  });

  test("is denied to non-superadmin users and redirects to forbidden", async () => {
    mockRequireRole.mockResolvedValue({
      authorized: false,
      reason: "forbidden",
    });

    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT /en/forbidden");
    });

    await expect(
      FooterSettingsPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("/en/forbidden");

    expect(mockRedirect).toHaveBeenCalledWith("/en/forbidden");
  });

  test("renders all footer contact and social link input fields for Super Admin", async () => {
    mockRequireRole.mockResolvedValue({
      authorized: true,
      role: "SUPER_ADMIN",
      userId: "user_super_admin",
    });

    const element = await FooterSettingsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("Footer &amp; Contact Settings");
    expect(html).toContain("Google Maps &amp; Campus Location");
    expect(html).toContain("Centre Address / Location Text");
    expect(html).toContain("Instagram Profile URL");
    expect(html).toContain("Facebook Page URL");
    expect(html).toContain("WhatsApp Number or URL");
    expect(html).toContain("Google Reviews URL");
    expect(html).toContain("Save Footer Settings");

    // Values from database
    expect(html).toContain("East End, Thodupuzha-Udumbanoor Rd, near De Paul Public School");
    expect(html).toContain("https://instagram.com/gtec_thodupuzha");
    expect(html).toContain("https://facebook.com/gtectdpa");
    expect(html).toContain("919544229992");
  });
});
