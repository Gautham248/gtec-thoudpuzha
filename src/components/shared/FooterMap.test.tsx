import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { FooterMap } from "./FooterMap";
import { siteConfig } from "@/lib/site";

describe("FooterMap", () => {
  test("embeds the centre's Google map when Site Settings has none", () => {
    render(<FooterMap />);

    expect(screen.getByTitle("G-TEC EDUCATION location")).toHaveAttribute(
      "src",
      siteConfig.mapEmbedUrl,
    );
    expect(siteConfig.mapEmbedUrl).toContain("GTEC%20EDUCATION");
  });

  test("Find Us opens the Google Maps listing; Get Directions routes to the pin", () => {
    render(<FooterMap />);

    expect(
      screen.getByRole("link", { name: "Find Us On Google Maps" }),
    ).toHaveAttribute(
      "href",
      "https://www.google.com/maps?cid=349989328925389439",
    );
    expect(screen.getByTestId("footer-location-link")).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=9.899039590201266%2C76.71616127502988",
    );
  });

  test("shows the brand in capitals and the new address", () => {
    render(<FooterMap />);

    expect(screen.getByText("G-TEC EDUCATION")).toBeInTheDocument();
    expect(
      screen.getByText(
        "G-TEC EDUCATION, Near DePaul Public School, East End, Thodupuzha",
      ),
    ).toBeInTheDocument();
  });

  test("a Maps link and embed from Site Settings still take precedence", () => {
    render(
      <FooterMap
        mapsUrl="https://maps.example/listing"
        mapEmbedUrl="https://maps.example/embed"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Find Us On Google Maps" }),
    ).toHaveAttribute("href", "https://maps.example/listing");
    expect(screen.getByTitle("G-TEC EDUCATION location")).toHaveAttribute(
      "src",
      "https://maps.example/embed",
    );
  });
});
