import { describe, expect, test } from "vitest";
// Imported at module level so loading the page's (large) module graph happens
// during collection, not inside the test's time limit.
import * as aboutPage from "../about/page";

describe("About page route accessibility", () => {
  test("/about page module exports default async component", () => {
    expect(aboutPage.default).toBeTypeOf("function");
  });
});
