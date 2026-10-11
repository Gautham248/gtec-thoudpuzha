import { describe, expect, test } from "vitest";

// Importing whole page modules is slow on a cold, parallel test run.
describe("Public route rendering strategy audit", { timeout: 20_000 }, () => {
  test("/ (homepage) is dynamic (no revalidate — Prisma/Neon incompatible with ISR)", async () => {
    const mod = await import("../page");
    expect((mod as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/news listing is dynamic (no revalidate)", async () => {
    const mod = await import("../news/page");
    expect((mod as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/news/[slug] is dynamic (no revalidate)", async () => {
    const mod = await import("../news/[slug]/page");
    expect((mod as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/placement is dynamic (no revalidate)", async () => {
    const mod = await import("../placement/page");
    expect((mod as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/about is dynamic (no revalidate)", async () => {
    const mod = await import("../about/page");
    expect((mod as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/contact is dynamic (no revalidate)", async () => {
    const mod = await import("../contact/page");
    expect((mod as { revalidate?: number }).revalidate).toBeUndefined();
  });

  test("/gallery is dynamic (no revalidate)", async () => {
    const mod = await import("../gallery/page");
    expect((mod as { revalidate?: number }).revalidate).toBeUndefined();
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

  test("privacy and terms retain ISR (no DB queries, safe)", async () => {
    const privacy = await import("../privacy/page");
    expect((privacy as { revalidate: number }).revalidate).toBe(86400);
    const terms = await import("../terms/page");
    expect((terms as { revalidate: number }).revalidate).toBe(86400);
  });
});
