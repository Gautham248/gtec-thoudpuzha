// @vitest-environment node

import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { siteSettings, whyChooseUsCard } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertSiteSettings } from "@/__tests__/pg-fixtures";
import { updateSiteSettings } from "./actions";

const mockRequireRole = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() => vi.fn());
const mockLogAdminAction = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

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
  revalidateTag: vi.fn(),
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
    whyChooseUsCards: [
      {
        id: "card_1",
        sortOrder: 0,
        icon: "AWARD" as const,
        titleEn: "ISO-Authorized Curriculum",
        titleMl: null,
        descriptionEn: "Original description 1",
        descriptionMl: null,
      },
      {
        id: "card_2",
        sortOrder: 1,
        icon: "USERS" as const,
        titleEn: "Expert Trainers",
        titleMl: null,
        descriptionEn: "Original description 2",
        descriptionMl: null,
      },
      {
        id: "card_3",
        sortOrder: 2,
        icon: "BRIEFCASE" as const,
        titleEn: "Placement Support",
        titleMl: null,
        descriptionEn: "Original description 3",
        descriptionMl: null,
      },
    ],
  };
}

function buildFormData(): FormData {
  const formData = new FormData();
  formData.append("locale", "en");
  formData.append("yearsInOperation", "25+");
  formData.append("studentsTrained", "3.2M+");
  formData.append("centresWorldwide", "800+");
  formData.append("affiliations", "100+");
  formData.append("countries", "23");
  formData.append("aboutBodyEn", "Updated about body");
  formData.append("aboutBodyMl", "");
  formData.append("aboutPhotoUrl", "");
  formData.append("card_0_id", "card_1");
  formData.append("card_0_icon", "AWARD");
  formData.append("card_0_titleEn", "Updated Card Title");
  formData.append("card_0_titleMl", "");
  formData.append("card_0_descriptionEn", "Updated description 1");
  formData.append("card_0_descriptionMl", "");
  formData.append("card_1_id", "card_2");
  formData.append("card_1_icon", "USERS");
  formData.append("card_1_titleEn", "Expert Trainers");
  formData.append("card_1_titleMl", "");
  formData.append("card_1_descriptionEn", "Original description 2");
  formData.append("card_1_descriptionMl", "");
  formData.append("card_2_id", "card_3");
  formData.append("card_2_icon", "BRIEFCASE");
  formData.append("card_2_titleEn", "Placement Support");
  formData.append("card_2_titleMl", "");
  formData.append("card_2_descriptionEn", "Original description 3");
  formData.append("card_2_descriptionMl", "");
  return formData;
}

describe("updateSiteSettings", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockRequireRole.mockReset();
    mockRedirect.mockReset();
    mockLogAdminAction.mockReset();
    mockRevalidatePath.mockReset();
    await truncateAll(pg);
    const { whyChooseUsCards, ...settings } = createSettings();
    await insertSiteSettings(pg, settings, whyChooseUsCards);
  });

  const card = async (id: string) =>
    (await pg.select().from(whyChooseUsCard)).find((c) => c.id === id)!;

  test("is denied to a centre_staff-role user and redirects to forbidden", async () => {
    mockRequireRole.mockResolvedValue({
      authorized: false,
      reason: "forbidden",
    });

    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT /en/forbidden");
    });

    await expect(updateSiteSettings(buildFormData())).rejects.toThrow(
      "/en/forbidden",
    );

    expect(mockRedirect).toHaveBeenCalledWith("/en/forbidden");
    const [row] = await pg.select().from(siteSettings);
    expect(row.aboutBodyEn).toBe("About body"); // unchanged
    expect((await card("card_1")).titleEn).toBe("ISO-Authorized Curriculum");
    expect(mockLogAdminAction).not.toHaveBeenCalled();
  });

  test("persists a Why Choose Us card title change via the settings form", async () => {
    mockRequireRole.mockResolvedValue({
      authorized: true,
      role: "SUPER_ADMIN",
      userId: "user_super_admin",
    });

    await updateSiteSettings(buildFormData());

    expect(await card("card_1")).toMatchObject({
      titleEn: "Updated Card Title",
      descriptionEn: "Updated description 1",
    });
    expect((await card("card_2")).titleEn).toBe("Expert Trainers");
    const [row] = await pg.select().from(siteSettings);
    expect(row.aboutBodyEn).toBe("Updated about body");
  });

  test("writes an audit log entry when saving the settings form", async () => {
    mockRequireRole.mockResolvedValue({
      authorized: true,
      role: "SUPER_ADMIN",
      userId: "user_super_admin",
    });

    await updateSiteSettings(buildFormData());

    expect(mockLogAdminAction).toHaveBeenCalledTimes(1);
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user_super_admin",
        actorRole: "SUPER_ADMIN",
        action: "siteSettings.update",
        entityType: "SiteSettings",
        entityId: "settings_1",
      }),
    );
  });
});
