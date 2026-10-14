import { describe, expect, test } from "vitest";
// Imported at module level so loading each page's (large) module graph
// happens during collection, not inside a test's time limit.
import * as homePage from "../page";
import * as newsPage from "../news/page";
import * as newsDetailPage from "../news/[slug]/page";
import * as placementPage from "../placement/page";
import * as aboutPage from "../about/page";
import * as contactPage from "../contact/page";
import * as galleryPage from "../gallery/page";
import * as privacyPage from "../privacy/page";
import * as termsPage from "../terms/page";

describe("Public route rendering strategy audit", () => {
  test("/ (homepage) is dynamic (no revalidate — reads the database per request)", () => {
    expect((homePage as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/news listing is dynamic (no revalidate)", () => {
    expect((newsPage as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/news/[slug] is dynamic (no revalidate)", () => {
    expect(
      (newsDetailPage as { revalidate?: number }).revalidate,
    ).toBeUndefined();
  });

  test("/placement is dynamic (no revalidate)", () => {
    expect(
      (placementPage as { revalidate?: number }).revalidate,
    ).toBeUndefined();
  });

  test("/about is dynamic (no revalidate)", () => {
    expect((aboutPage as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/contact is dynamic (no revalidate)", () => {
    expect((contactPage as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/gallery is dynamic (no revalidate)", () => {
    expect((galleryPage as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/courses/[slug] is force-dynamic (no generateStaticParams)", async () => {
    const { existsSync, readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const filePath = resolve(__dirname, "../courses/[slug]/page.tsx");
    expect(existsSync(filePath)).toBe(true);
    const source = readFileSync(filePath, "utf-8");
    expect(source).not.toMatch(/generateStaticParams/);
    expect(source).toMatch(/force-dynamic/);
  });

  test("/news/[slug] is force-dynamic (no generateStaticParams)", async () => {
    const { existsSync, readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const filePath = resolve(__dirname, "../news/[slug]/page.tsx");
    expect(existsSync(filePath)).toBe(true);
    const source = readFileSync(filePath, "utf-8");
    expect(source).not.toMatch(/generateStaticParams/);
    expect(source).toMatch(/force-dynamic/);
  });

  test("privacy and terms retain ISR (no DB queries, safe)", () => {
    expect((privacyPage as { revalidate: number }).revalidate).toBe(86400);
    expect((termsPage as { revalidate: number }).revalidate).toBe(86400);
  });
});
