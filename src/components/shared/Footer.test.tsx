import React from "react";
import { describe, expect, test, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { NavCourse } from "@/lib/nav-courses";
import { Footer } from "./Footer";

// The real Link reads the next-intl locale context, which isn't mounted here.
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href, ...rest }, children),
}));

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

  test("renders the social links from custom settings", async () => {
    const customSettings = {
      address:
        "East End, Thodupuzha-Udumbanoor Rd, near De Paul Public School, Thodupuzha, Kerala 685585",
      mapsUrl:
        "https://maps.google.com/?q=G-TEC+Computer+Education+East+End+Thodupuzha",
      instagramUrl: "https://www.instagram.com/gtec_thodupuzha/",
      facebookUrl: "https://www.facebook.com/gtectdpa",
      whatsappNumber: "919744221113",
      googleReviewsUrl:
        "https://www.google.com/maps/search/?api=1&query=G-TEC+Reviews",
    };

    const html = renderToString(await Footer({ settings: customSettings }));

    // Address and map link
    expect(html).toContain(
      "East End, Thodupuzha-Udumbanoor Rd, near De Paul Public School",
    );
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');

    // Instagram
    expect(html).toContain('data-testid="footer-instagram-link"');
    expect(html).toContain("https://www.instagram.com/gtec_thodupuzha/");

    // Facebook
    expect(html).toContain('data-testid="footer-facebook-link"');
    expect(html).toContain("https://www.facebook.com/gtectdpa");

    // WhatsApp
    expect(html).toContain('data-testid="footer-whatsapp-link"');
    expect(html).toContain("https://wa.me/919744221113");

    // Google Reviews
    expect(html).toContain('data-testid="footer-google-reviews-link"');
    expect(html).toContain(
      "https://www.google.com/maps/search/?api=1&amp;query=G-TEC+Reviews",
    );
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

    expect(html).toContain('data-testid="footer-instagram-link"');
    expect(html).not.toContain('data-testid="footer-facebook-link"');
    expect(html).not.toContain('data-testid="footer-whatsapp-link"');
    expect(html).not.toContain('data-testid="footer-google-reviews-link"');
  });

  test("formats plain phone number into WhatsApp wa.me link", async () => {
    const phoneSettings = {
      address: "Thodupuzha",
      mapsUrl: "https://maps.google.com",
      whatsappNumber: "+91 9744-221-113",
    };

    const html = renderToString(await Footer({ settings: phoneSettings }));
    expect(html).toContain('data-testid="footer-whatsapp-link"');
    expect(html).toContain("https://wa.me/919744221113");
  });

  const course = (n: number): NavCourse => ({
    id: `c${n}`,
    slug: `course-${n}`,
    titleEn: `Course ${n}`,
    titleMl: null,
    durationText: null,
    featured: false,
    coverImageUrl: null,
    summaryEn: null,
    summaryMl: null,
    category: null,
  });

  test("Popular Courses lists the layout's courses, each linking to its own page", async () => {
    const html = renderToString(
      await Footer({ courses: [course(1), course(2)] }),
    );
    expect(html).toContain('href="/courses/course-1"');
    expect(html).toContain("Course 1");
    expect(html).toContain('href="/courses/course-2"');
    expect(html).not.toContain("Python Full Stack");
  });

  test("Popular Courses shows at most 8 courses, in the order given", async () => {
    const courses = Array.from({ length: 10 }, (_, i) => course(i + 1));
    const html = renderToString(await Footer({ courses }));
    const links = html.match(/href="\/courses\/course-\d+"/g) ?? [];
    expect(links).toEqual(
      courses.slice(0, 8).map((c) => `href="/courses/${c.slug}"`),
    );
  });

  test("Popular Courses falls back to a View all courses link when there are none", async () => {
    const html = renderToString(await Footer({ courses: [] }));
    expect(html).toContain("View all courses");
    expect(html).toContain('href="/courses"');
  });
});
