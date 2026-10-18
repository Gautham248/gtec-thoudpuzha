import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { AboutSection } from "./AboutSection";
import {
  DEFAULT_ABOUT_PHOTO,
  type SiteSettingsWithCards,
} from "@/lib/site-settings";

const settings = (aboutPhotoUrl: string | null) =>
  ({
    aboutBodyEn: "About G-TEC",
    aboutBodyMl: null,
    aboutPhotoUrl,
    yearsInOperation: "25+",
    whyChooseUsCards: [],
  }) as unknown as SiteSettingsWithCards;

async function renderSection(aboutPhotoUrl: string | null) {
  render(
    await AboutSection({
      settings: settings(aboutPhotoUrl),
      locale: "en",
      heading: "About G-TEC",
    }),
  );
  return screen.getByRole("img", { name: "G-TEC Thodupuzha centre" });
}

describe("AboutSection photo", () => {
  test("shows the centre's team photo when Admin has no About photo", async () => {
    const img = await renderSection(null);

    // next/image routes local files through its optimizer.
    expect(decodeURIComponent(img.getAttribute("src")!)).toContain(
      DEFAULT_ABOUT_PHOTO,
    );
  });

  test("an About photo set in Admin still takes precedence", async () => {
    const img = await renderSection("about/uploaded.jpg");

    expect(img).toHaveAttribute("src", "/api/media/about/uploaded.jpg");
  });
});
