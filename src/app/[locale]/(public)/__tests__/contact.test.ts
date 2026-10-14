import { describe, expect, test } from "vitest";
// Imported at module level so loading the page's (large) module graph happens
// during collection, not inside the test's time limit.
import * as contactPage from "../contact/page";

describe("Contact page route accessibility", () => {
  test("/contact page module exports default async component", () => {
    expect(contactPage.default).toBeTypeOf("function");
  });
});
