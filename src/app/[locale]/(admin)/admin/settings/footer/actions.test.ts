// @vitest-environment node

import { describe, expect, test, vi, beforeEach } from "vitest";
import { updateFooterSettings, validateUrlOrNull } from "./actions";

const mockRequireRole = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockSiteSettingsUpdate = vi.hoisted(() => vi.fn());
const mockLogAdminAction = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockRevalidateTag = vi.hoisted(() => vi.fn());

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

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: mockRevalidateTag,
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    siteSettings: {
      findFirst: mockFindFirst,
      update: mockSiteSettingsUpdate,
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAdminAction: mockLogAdminAction,
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
    address: "East End, Thodupuzha",
    mapEmbedUrl: null,
    mapsUrl: "https://maps.google.com/?q=G-TEC",
    whatsappNumber: "919544229992",
    facebookUrl: "https://facebook.com/gtec",
    instagramUrl: "https://instagram.com/gtec",
    youtubeUrl: null,
    linkedinUrl: null,
    googleReviewsUrl: "https://google.com/reviews",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("validateUrlOrNull", () => {
  test("returns null for empty or whitespace values", async () => {
    expect(await validateUrlOrNull(null, "Test")).toBeNull();
    expect(await validateUrlOrNull("", "Test")).toBeNull();
    expect(await validateUrlOrNull("   ", "Test")).toBeNull();
  });

  test("accepts valid http/https URLs", async () => {
    expect(
      await validateUrlOrNull("https://www.instagram.com/gtec_thodupuzha/", "Instagram URL"),
    ).toBe("https://www.instagram.com/gtec_thodupuzha/");
    expect(
      await validateUrlOrNull("https://maps.google.com/?q=G-TEC", "Google Maps URL"),
    ).toBe("https://maps.google.com/?q=G-TEC");
  });

  test("throws error for invalid URL formats", async () => {
    await expect(validateUrlOrNull("not-a-url", "Instagram URL")).rejects.toThrow();
  });

  test("accepts valid phone numbers and URLs for WhatsApp", async () => {
    expect(await validateUrlOrNull("919544229992", "WhatsApp")).toBe("919544229992");
    expect(await validateUrlOrNull("+91 9544 229992", "WhatsApp")).toBe("+91 9544 229992");
    expect(await validateUrlOrNull("https://wa.me/919544229992", "WhatsApp")).toBe(
      "https://wa.me/919544229992",
    );
  });
});

describe("updateFooterSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockReset();
    mockRedirect.mockReset();
    mockFindFirst.mockReset();
    mockSiteSettingsUpdate.mockReset();
    mockLogAdminAction.mockReset();
    mockRevalidatePath.mockReset();
    mockRevalidateTag.mockReset();
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

    const formData = new FormData();
    formData.append("locale", "en");

    await expect(updateFooterSettings(formData)).rejects.toThrow("/en/forbidden");
    expect(mockRedirect).toHaveBeenCalledWith("/en/forbidden");
    expect(mockSiteSettingsUpdate).not.toHaveBeenCalled();
  });

  test("persists updated footer and social links for Super Admin", async () => {
    mockRequireRole.mockResolvedValue({
      authorized: true,
      role: "SUPER_ADMIN",
      userId: "user_super_admin",
    });

    mockSiteSettingsUpdate.mockResolvedValue(createSettings());

    const formData = new FormData();
    formData.append("locale", "en");
    formData.append(
      "address",
      "East End, Thodupuzha-Udumbanoor Rd, near De Paul Public School, Thodupuzha, Kerala 685585",
    );
    formData.append(
      "mapsUrl",
      "https://maps.google.com/?q=G-TEC+Computer+Education+Thodupuzha",
    );
    formData.append("instagramUrl", "https://www.instagram.com/gtec_thodupuzha/");
    formData.append("facebookUrl", "https://www.facebook.com/gtectdpa");
    formData.append("whatsappNumber", "919544229992");
    formData.append(
      "googleReviewsUrl",
      "https://www.google.com/maps/search/?api=1&query=G-TEC+Reviews",
    );

    await updateFooterSettings(formData);

    expect(mockSiteSettingsUpdate).toHaveBeenCalledWith({
      where: { id: "settings_1" },
      data: expect.objectContaining({
        address:
          "East End, Thodupuzha-Udumbanoor Rd, near De Paul Public School, Thodupuzha, Kerala 685585",
        mapsUrl:
          "https://maps.google.com/?q=G-TEC+Computer+Education+Thodupuzha",
        instagramUrl: "https://www.instagram.com/gtec_thodupuzha/",
        facebookUrl: "https://www.facebook.com/gtectdpa",
        whatsappNumber: "919544229992",
        googleReviewsUrl:
          "https://www.google.com/maps/search/?api=1&query=G-TEC+Reviews",
      }),
    });

    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "siteSettings.footerUpdate",
        entityType: "SiteSettings",
        entityId: "settings_1",
      }),
    );

    expect(mockRevalidateTag).toHaveBeenCalledWith("site-settings", "max");
  });
});
