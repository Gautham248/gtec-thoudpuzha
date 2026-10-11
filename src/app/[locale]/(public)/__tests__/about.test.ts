import { describe, expect, test } from "vitest";

// Importing a whole page module is slow on a cold, parallel test run.
describe("About page route accessibility", { timeout: 20_000 }, () => {
  test("/about page module exports default async component", async () => {
    const mod = await import("../about/page");
    expect(mod.default).toBeTypeOf("function");
  });
});
