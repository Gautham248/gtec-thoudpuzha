import { describe, expect, test } from "vitest";
import { renderToString } from "react-dom/server";
import { Footer } from "./Footer";

describe("Footer", () => {
  test("copyright year is computed from the current date, not hardcoded", async () => {
    const html = renderToString(await Footer({}));
    const currentYear = new Date().getFullYear().toString();
    expect(html).toContain(currentYear);
    expect(html).toContain("\u00A9");
  });

  test('"Verify Certificate" link points to the real external gtecadmin.com URL', async () => {
    const html = renderToString(await Footer({}));
    expect(html).toContain("https://gtecadmin.com");
  });

  test("renders Top of Footer dynamic quick links with custom settings", async () => {
    const customSettings = {
      address:
        "East End, Thodupuzha-Udumbanoor Rd, near De Paul Public School, Thodupuzha, Kerala 685585",
      mapsUrl:
        "https://maps.google.com/?q=G-TEC+Computer+Education+East+End+Thodupuzha",
      instagramUrl: "https://www.instagram.com/gtec_thodupuzha/",
      facebookUrl: "https://www.facebook.com/gtectdpa",
      whatsappNumber: "919544229992",
      googleReviewsUrl: "https://www.google.com/maps/search/?api=1&query=G-TEC+Reviews",
    };

    const html = renderToString(await Footer({ settings: customSettings }));

    // Top-of-footer section container
    expect(html).toContain('data-testid="top-of-footer-section"');

    // Google Maps / Location
    expect(html).toContain('data-testid="footer-location-link"');
    expect(html).toContain("https://maps.google.com/?q=G-TEC+Computer+Education+East+End+Thodupuzha");
    expect(html).toContain("East End, Thodupuzha-Udumbanoor Rd, near De Paul Public School");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');

    // Instagram
    expect(html).toContain('data-testid="footer-instagram-link"');
    expect(html).toContain("https://www.instagram.com/gtec_thodupuzha/");
    expect(html).toContain("@gtec_thodupuzha");

    // Facebook
    expect(html).toContain('data-testid="footer-facebook-link"');
    expect(html).toContain("https://www.facebook.com/gtectdpa");

    // WhatsApp
    expect(html).toContain('data-testid="footer-whatsapp-link"');
    expect(html).toContain("https://wa.me/919544229992");

    // Google Reviews
    expect(html).toContain('data-testid="footer-google-reviews-link"');
    expect(html).toContain("https://www.google.com/maps/search/?api=1&amp;query=G-TEC+Reviews");
  });

  test("hides individual items when corresponding database fields are empty/null", async () => {
    const partialSettings = {
      address: "East End, Thodupuzha",
      mapsUrl: "https://maps.google.com/?q=G-TEC",
      instagramUrl: "https://www.instagram.com/gtec_thodupuzha/",
      facebookUrl: null, // Empty
      whatsappNumber: null, // Empty
      googleReviewsUrl: null, // Empty
    };

    const html = renderToString(await Footer({ settings: partialSettings }));

    expect(html).toContain('data-testid="footer-location-link"');
    expect(html).toContain('data-testid="footer-instagram-link"');
    expect(html).not.toContain('data-testid="footer-facebook-link"');
    expect(html).not.toContain('data-testid="footer-whatsapp-link"');
    expect(html).not.toContain('data-testid="footer-google-reviews-link"');
  });

  test("formats plain phone number into WhatsApp wa.me link", async () => {
    const phoneSettings = {
      address: "Thodupuzha",
      mapsUrl: "https://maps.google.com",
      whatsappNumber: "+91 9544-229-992",
    };

    const html = renderToString(await Footer({ settings: phoneSettings }));
    expect(html).toContain('data-testid="footer-whatsapp-link"');
    expect(html).toContain("https://wa.me/919544229992");
  });
});
