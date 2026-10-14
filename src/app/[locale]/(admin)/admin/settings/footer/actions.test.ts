// @vitest-environment node

import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertSiteSettings } from "@/__tests__/pg-fixtures";
import { updateFooterSettings } from "./actions";
import { validateUrlOrNull } from "@/lib/url-validation";

const mockRequireRole = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() => vi.fn());
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

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

vi.mock("@/lib/audit", () => ({
  logAdminAction: mockLogAdminAction,
}));

function createSettings() {
  return {
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
    whatsappNumber: "919744221113",
    facebookUrl: "https://facebook.com/gtec",
    instagramUrl: "https://instagram.com/gtec",
    youtubeUrl: null,
    linkedinUrl: null,
    googleReviewsUrl: "https://google.com/reviews",
  };
}

let settingsId: string;

describe("validateUrlOrNull", () => {
  test("returns null for empty or whitespace values", async () => {
    expect(await validateUrlOrNull(null, "Test")).toBeNull();
    expect(await validateUrlOrNull("", "Test")).toBeNull();
    expect(await validateUrlOrNull("   ", "Test")).toBeNull();
  });

  test("accepts valid http/https URLs", async () => {
    expect(
      await validateUrlOrNull(
        "https://www.instagram.com/gtec_thodupuzha/",
        "Instagram URL",
      ),
    ).toBe("https://www.instagram.com/gtec_thodupuzha/");
    expect(
      await validateUrlOrNull(
        "https://maps.google.com/?q=G-TEC",
        "Google Maps URL",
      ),
    ).toBe("https://maps.google.com/?q=G-TEC");
  });

  test("throws error for invalid URL formats", async () => {
    await expect(
      validateUrlOrNull("not-a-url", "Instagram URL"),
    ).rejects.toThrow();
  });

  test("accepts valid phone numbers and URLs for WhatsApp", async () => {
    expect(await validateUrlOrNull("919744221113", "WhatsApp")).toBe(
      "919744221113",
    );
    expect(await validateUrlOrNull("+91 9744 221113", "WhatsApp")).toBe(
      "+91 9744 221113",
    );
    expect(
      await validateUrlOrNull("https://wa.me/919744221113", "WhatsApp"),
    ).toBe("https://wa.me/919744221113");
  });
});

describe("updateFooterSettings", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockRequireRole.mockReset();
    mockRedirect.mockReset();
    mockLogAdminAction.mockReset();
    mockRevalidatePath.mockReset();
    mockRevalidateTag.mockReset();
    await truncateAll(pg);
    settingsId = (await insertSiteSettings(pg, createSettings())).id;
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

    await expect(updateFooterSettings(formData)).rejects.toThrow(
      "/en/forbidden",
    );
    expect(mockRedirect).toHaveBeenCalledWith("/en/forbidden");
    const [row] = await pg.select().from(siteSettings);
    expect(row).toMatchObject(createSettings()); // unchanged
  });

  test("persists updated footer and social links for Super Admin", async () => {
    mockRequireRole.mockResolvedValue({
      authorized: true,
      role: "SUPER_ADMIN",
      userId: "user_super_admin",
    });

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
    formData.append(
      "instagramUrl",
      "https://www.instagram.com/gtec_thodupuzha/",
    );
    formData.append("facebookUrl", "https://www.facebook.com/gtectdpa");
    formData.append("whatsappNumber", "919744221113");
    formData.append(
      "googleReviewsUrl",
      "https://www.google.com/maps/search/?api=1&query=G-TEC+Reviews",
    );

    await updateFooterSettings(formData);

    const [row] = await pg.select().from(siteSettings);
    expect(row).toMatchObject({
      address:
        "East End, Thodupuzha-Udumbanoor Rd, near De Paul Public School, Thodupuzha, Kerala 685585",
      mapsUrl: "https://maps.google.com/?q=G-TEC+Computer+Education+Thodupuzha",
      instagramUrl: "https://www.instagram.com/gtec_thodupuzha/",
      facebookUrl: "https://www.facebook.com/gtectdpa",
      whatsappNumber: "919744221113",
      googleReviewsUrl:
        "https://www.google.com/maps/search/?api=1&query=G-TEC+Reviews",
      // Fields left blank in the form are cleared.
      mapEmbedUrl: null,
      youtubeUrl: null,
      linkedinUrl: null,
      // Non-footer fields are untouched.
      aboutBodyEn: "About body",
    });

    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "siteSettings.footerUpdate",
        entityType: "SiteSettings",
        entityId: settingsId,
      }),
    );

    expect(mockRevalidateTag).toHaveBeenCalledWith("site-settings", "max");
  });
});
