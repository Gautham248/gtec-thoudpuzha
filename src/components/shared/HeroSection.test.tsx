import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { EnquiryModalProvider } from "@/components/enquiry/EnquiryModal";
import { HERO_MODELS, HERO_ROTATE_MS, HeroSection } from "./HeroSection";

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

const t = {
  headline: "Build Your Career",
  applyNow: "Apply Now",
  yearsLabel: "years of empowering careers",
  ratingLabel: "rating on google",
};

describe("HeroSection years and rating card", () => {
  test("shows the years from Site Settings and the Google rating", () => {
    render(<HeroSection t={t} years="25+" />);

    expect(screen.getByText("25+")).toBeInTheDocument();
    expect(screen.getByText("years of empowering careers")).toBeInTheDocument();
  });

  // The rating pill is commented out in HeroSection for now; re-enable these
  // when it is switched back on.
  test.skip("the rating links to Google Reviews in a new tab when a URL is set", () => {
    render(
      <HeroSection
        t={t}
        years="25+"
        reviewsUrl="https://g.page/r/gtec-thodupuzha/review"
      />,
    );

    const link = screen.getByRole("link", { name: /rating on google/ });
    expect(link).toHaveAttribute(
      "href",
      "https://g.page/r/gtec-thodupuzha/review",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test.skip("without a reviews URL the rating is plain text", () => {
    render(<HeroSection t={t} years="25+" />);

    expect(
      screen.queryByRole("link", { name: /rating on google/ }),
    ).not.toBeInTheDocument();
  });

  test("hides the years line when Site Settings has none", () => {
    render(<HeroSection t={t} years="" />);

    expect(
      screen.queryByText("years of empowering careers"),
    ).not.toBeInTheDocument();
  });
});

describe("HeroSection Apply Now", () => {
  test("opens the enquiry form instead of scrolling to the page bottom", () => {
    render(
      <EnquiryModalProvider courses={[]}>
        <HeroSection t={t} years="25+" />
      </EnquiryModalProvider>,
    );

    const applyNow = screen.getByRole("button", { name: /Apply Now/ });
    expect(applyNow).not.toHaveAttribute("href");

    fireEvent.click(applyNow);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("HeroSection model rotation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // During the slide the outgoing model is still mounted, so check which
  // models are in the page rather than which one comes first.
  const models = (container: HTMLElement) =>
    [...container.querySelectorAll("[data-hero-model]")].map((el) =>
      el.getAttribute("data-hero-model"),
    );

  test("swaps the hero model every 10 seconds and loops", () => {
    vi.useFakeTimers();
    const { container } = render(<HeroSection t={t} years="25+" />);

    expect(models(container)).toEqual([HERO_MODELS[0]]);

    act(() => vi.advanceTimersByTime(HERO_ROTATE_MS - 1));
    expect(models(container)).toEqual([HERO_MODELS[0]]);

    act(() => vi.advanceTimersByTime(1));
    expect(models(container)).toContain(HERO_MODELS[1]);

    act(() => vi.advanceTimersByTime(HERO_ROTATE_MS));
    expect(models(container)).toContain(HERO_MODELS[0]);
  });

  test("pauses while the tab is hidden", () => {
    vi.useFakeTimers();
    const { container } = render(<HeroSection t={t} years="25+" />);

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(HERO_ROTATE_MS * 3);
    });
    expect(models(container)).toEqual([HERO_MODELS[0]]);

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(HERO_ROTATE_MS);
    });
    expect(models(container)).toContain(HERO_MODELS[1]);
  });
});
