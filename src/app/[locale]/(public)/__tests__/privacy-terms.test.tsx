import React from "react";
import { describe, expect, test, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/shared/Footer";
import { BiodataForm } from "@/components/shared/BiodataForm";
import { RegistrationForm } from "@/app/[locale]/(portal)/portal/employer/register/registration-form";

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

// --- Helper: resolve the Privacy page component via dynamic import ---
// We test the rendered HTML of the server components since they're async.

describe("Legal pages are publicly accessible", () => {
  test("/privacy page renders successfully", async () => {
    // Dynamic import so we don't error if the file is missing
    const mod = await import("@/app/[locale]/(public)/privacy/page");
    const Page = mod.default;
    const html = renderToString(await Page());
    expect(html).toContain("Privacy Policy");
    expect(html).not.toContain("404");
    expect(html).not.toContain("not found");
  });

  test("/terms page renders successfully", async () => {
    const mod = await import("@/app/[locale]/(public)/terms/page");
    const Page = mod.default;
    const html = renderToString(await Page());
    expect(html).toContain("Terms of Service");
    expect(html).not.toContain("404");
    expect(html).not.toContain("not found");
  });
});

describe("Footer Privacy Policy link resolves to the real page", () => {
  test("Footer contains a Privacy Policy link", async () => {
    const html = renderToString(await Footer({}));
    expect(html).toContain("/privacy");
    expect(html).toContain("Privacy Policy");
  });

  test("Footer contains a Terms of Service link", async () => {
    const html = renderToString(await Footer({}));
    expect(html).toContain("/terms");
    expect(html).toContain("Terms of Service");
  });

  test("Footer Privacy link has testid for assertion", async () => {
    const html = renderToString(await Footer({}));
    expect(html).toContain('data-testid="footer-privacy-link"');
  });
});

describe("BiodataForm contains Privacy Policy link near submit", () => {
  const emptyProfile = {
    id: "",
    fullName: null,
    dateOfBirth: null,
    phone: null,
    email: null,
    courseCompletedIds: [] as string[],
    certificationIds: [] as string[],
    educationalQualification: null,
    yearOfPassing: null,
    address: null,
    languagesKnown: [] as string[],
    skillIds: [] as string[],
    preferredJobLocation: null,
    preferredJobType: null,
    careerObjective: null,
    photoUrl: null,
    profileVisible: true,
    isVerifiedStudent: false,
    studentRecordId: null,
  };

  test("renders Privacy Policy link in consent section", () => {
    render(
      <BiodataForm
        profile={emptyProfile}
        isVerifiedStudent={false}
        courses={[]}
        skills={[]}
        onAddNewSkill={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const privacyLink = screen.getByText("Privacy Policy");
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink.closest("a")).toHaveAttribute("href", "/privacy");
  });
});

describe("Employer Registration Form contains Privacy Policy link", () => {
  test("renders Privacy Policy link near submit", () => {
    render(<RegistrationForm />);

    const privacyLink = screen.getByText("Privacy Policy");
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink.closest("a")).toHaveAttribute("href", "/privacy");
  });

  test("renders Terms of Service link near submit", () => {
    render(<RegistrationForm />);

    const termsLink = screen.getByText("Terms of Service");
    expect(termsLink).toBeInTheDocument();
    expect(termsLink.closest("a")).toHaveAttribute("href", "/terms");
  });
});
