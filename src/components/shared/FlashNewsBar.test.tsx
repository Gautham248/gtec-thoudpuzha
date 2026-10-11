import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { FlashNewsBar } from "./FlashNewsBar";
import { db } from "@/db";
import { resetMockDb, setMockRows } from "@/__tests__/drizzle-mock";

const mockGetLocale = vi.hoisted(() => vi.fn());

vi.mock("@/db", async () => (await import("@/__tests__/drizzle-mock")).mockDbModule());

vi.mock("next-intl/server", () => ({
  getLocale: mockGetLocale,
}));

const DAY = 24 * 60 * 60 * 1000;

function flash(
  id: string,
  active: boolean,
  expiresAt: Date | null,
  sortOrder: number,
  textMl: string | null = null,
) {
  return { id, textEn: `EN ${id}`, textMl, link: null, active, expiresAt, sortOrder };
}

describe("FlashNewsBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockDb(db);
    mockGetLocale.mockReset();
    mockGetLocale.mockResolvedValue("en");
  });

  test("only renders items where active=true and expiresAt is null or in the future", async () => {
    const now = Date.now();
    setMockRows(db, "flashNewsItem", [
      flash("active_no_expiry", true, null, 1),
      flash("active_future", true, new Date(now + DAY), 2),
      flash("active_expired", true, new Date(now - DAY), 3),
      flash("inactive", false, null, 4),
    ]);

    const element = await FlashNewsBar();
    const html = renderToString(element);

    expect(html).toContain("EN active_no_expiry");
    expect(html).toContain("EN active_future");
    expect(html).not.toContain("EN active_expired");
    expect(html).not.toContain("EN inactive");
  });

  test("renders nothing when zero qualifying items", async () => {
    setMockRows(db, "flashNewsItem", [flash("inactive", false, null, 1)]);

    const element = await FlashNewsBar();

    expect(element).toBeNull();
  });

  test("uses Malayalam text when available for the ml locale", async () => {
    mockGetLocale.mockResolvedValue("ml");
    setMockRows(db, "flashNewsItem", [
      flash("with_ml", true, null, 1, "മലയാളം വാർത്ത"),
      flash("en_only", true, null, 2),
    ]);

    const html = renderToString(await FlashNewsBar());

    expect(html).toContain("മലയാളം വാർത്ത");
    expect(html).toContain("EN en_only");
  });
});
