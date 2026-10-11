import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { db } from "@/db";
import { setMockRows } from "@/__tests__/drizzle-mock";
import EnquiriesPage from "./page";

// "@/db" is the in-memory fake installed by src/__tests__/setup.ts.

const mockAuth = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

describe("EnquiriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("is denied to an employer-role user", async () => {
    mockAuth.mockResolvedValue({
      userId: "employer_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    await expect(
      EnquiriesPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("is accessible to a centre_staff-role user and lists enquiries, newest first", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    setMockRows(db, "enquiry", [
      {
        id: "enquiry_1",
        name: "Jane Doe",
        phone: "9876543210",
        courseId: "c1",
        course: { id: "c1", titleEn: "Diploma in Computer Application" },
        source: "homepage-hero",
        createdAt: new Date("2026-01-15T10:00:00Z"),
      },
      {
        id: "enquiry_2",
        name: "Newer Person",
        phone: "9876500000",
        courseId: null,
        course: null,
        source: "contact-page",
        createdAt: new Date("2026-02-01T10:00:00Z"),
      },
    ]);

    const html = renderToString(
      await EnquiriesPage({ params: Promise.resolve({ locale: "en" }) }),
    );

    expect(html).toContain("Jane Doe");
    expect(html).toContain("9876543210");
    expect(html).toContain("Diploma in Computer Application");
    expect(html).toContain("homepage-hero");
    expect(html.indexOf("Newer Person")).toBeLessThan(html.indexOf("Jane Doe"));
  });
});
