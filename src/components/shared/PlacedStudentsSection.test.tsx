import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlacedStudentsSection } from "./PlacedStudentsSection";

const items = [1, 2, 3].map((n) => ({
  id: `p${n}`,
  mediaType: "IMAGE" as const,
  url: `gallery/poster${n}.jpg`,
  captionEn: `Student ${n} placed`,
  captionMl: null,
  sortOrder: n,
}));

function renderSection() {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  render(
    <PlacedStudentsSection
      data={{ slug: "placed-students", items }}
      locale="en"
      t={{
        badge: "Placed",
        heading: "Our placed students",
        subhead: "",
        viewAll: "View all",
      }}
    />,
  );
  vi.unstubAllGlobals();
  return screen.getByTestId("placed-students-marquee");
}

describe("PlacedStudentsSection", () => {
  test("posters scroll in a full-width endless row", () => {
    const row = renderSection();

    // 3 posters repeated to fill wide screens (9), then doubled for the loop.
    expect(row.querySelectorAll(".gallery-marquee > div")).toHaveLength(18);
    expect(row.querySelectorAll("[data-marquee-copy]")).toHaveLength(9);
  });

  test("each poster is announced and focusable once; repeats are hidden", () => {
    const row = renderSection();

    expect(
      screen.getAllByRole("img", { name: "Student 1 placed" }),
    ).toHaveLength(1);
    const focusable = [...row.querySelectorAll("a")].filter(
      (a) => a.tabIndex !== -1,
    );
    expect(focusable).toHaveLength(3);
    expect(screen.getAllByText("Student 1 placed").length).toBeGreaterThan(1);
  });
});
