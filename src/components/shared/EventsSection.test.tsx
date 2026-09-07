import { describe, expect, test } from "vitest";
import { renderToString } from "react-dom/server";
import { EventsSection } from "./EventsSection";

describe("EventsSection", () => {
  test("renders upcoming events with titles and dates", () => {
    const events = [
      {
        id: "ev-1",
        type: "EVENT" as const,
        titleEn: "Full Stack Workshop 2026",
        titleMl: null,
        bodyEn: "Hands-on Next.js and TypeScript training.",
        bodyMl: null,
        coverImageUrl: null,
        eventDate: new Date("2026-10-15"),
        slug: "full-stack-workshop-2026",
        publishedAt: new Date(),
      },
    ];

    const html = renderToString(<EventsSection events={events} locale="en" />);
    expect(html).toContain("Upcoming Events &amp; Workshops");
    expect(html).toContain("Full Stack Workshop 2026");
    expect(html).toContain("OCT");
    expect(html).toContain("15");
  });

  test("renders empty fallback when no events are scheduled", () => {
    const html = renderToString(<EventsSection events={[]} locale="en" />);
    expect(html).toContain("New Events Coming Soon");
  });
});
