import { beforeAll, describe, expect, test } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContactSection } from "./ContactSection";
import { EnquiryModalProvider } from "@/components/enquiry/EnquiryModal";
import type { PublicCourse } from "@/lib/courses";

// jsdom lacks IntersectionObserver, which the scroll-reveal wrappers use.
beforeAll(() => {
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

const baseSettings = {
  address: "123 Main St, Thodupuzha",
  mapEmbedUrl: "https://maps.google.com/embed?pb=test123",
  facebookUrl: "https://facebook.com/gtec",
  instagramUrl: null,
  youtubeUrl: "https://youtube.com/@gtec",
  linkedinUrl: null,
  googleReviewsUrl: "https://g.page/gtec/review",
};

const mockCourses: PublicCourse[] = [
  {
    id: "c1",
    slug: "python",
    titleEn: "Python Full Stack",
    titleMl: null,
    descriptionEn: null,
    descriptionMl: null,
    durationText: null,
    certifications: [],
    careerOutcomesEn: null,
    careerOutcomesMl: null,
    coverImageUrl: null,
    featured: false,
    category: null,
    contentBlocks: null,
  },
];

describe("ContactSection", () => {
  test("the Google Map iframe renders using the configured embed URL", () => {
    const html = renderToString(
      <ContactSection settings={baseSettings} courses={mockCourses} />,
    );
    expect(html).toContain(baseSettings.mapEmbedUrl);
    expect(html).toContain('data-testid="google-map-iframe"');
  });

  test('clicking "Send us a message" opens the shared enquiry modal with source="contact_page"', () => {
    render(
      <EnquiryModalProvider
        courses={mockCourses.map(({ id, slug, titleEn, titleMl }) => ({
          id,
          slug,
          titleEn,
          titleMl,
        }))}
      >
        <ContactSection settings={baseSettings} />
      </EnquiryModalProvider>,
    );

    // Modal should not be visible initially
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /send us a message/i }));

    // The modal renders into document.body via a portal
    const dialog = screen.getByRole("dialog", { name: /start your journey/i });
    expect(dialog).toBeTruthy();

    // The form carries source="contact_page" in its aria-label
    expect(screen.getByLabelText(/contact_page/i)).toBeTruthy();
    // And a close button that is always present
    expect(
      screen.getByRole("button", { name: /close enquiry form/i }),
    ).toBeTruthy();
  });
});
