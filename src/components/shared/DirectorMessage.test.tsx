import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DirectorMessage } from "./DirectorMessage";

describe("DirectorMessage", () => {
  test("shows the quote with the director's name, role and photo", () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    render(
      <DirectorMessage
        t={{
          eyebrow: "Director's Message",
          quote: "Our success is measured by our students.",
          name: "Noby K Sudharsan",
          role: "Director, G-TEC Thodupuzha",
        }}
      />,
    );
    vi.unstubAllGlobals();

    expect(
      screen.getByText("Our success is measured by our students."),
    ).toBeInTheDocument();
    expect(screen.getByText("Noby K Sudharsan")).toBeInTheDocument();
    const photo = screen.getByRole("img", {
      name: "Noby K Sudharsan, Director, G-TEC Thodupuzha",
    });
    expect(decodeURIComponent(photo.getAttribute("src")!)).toContain(
      "/images/director.webp",
    );
  });
});
