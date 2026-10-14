import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Header } from "./Header";
import PortalLayout from "@/app/[locale]/(portal)/layout";
import AdminLayout from "@/app/[locale]/(admin)/layout";
import { siteConfig } from "@/lib/site";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// useLocale and useTranslations are mocked globally in __tests__/setup.ts

vi.mock("@/components/shared/FlashNewsBar", () => ({
  FlashNewsBar: () => null,
}));

vi.mock("@/lib/i18n/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Header", () => {
  test("renders all four CTA buttons with correct hrefs", () => {
    render(<Header />);

    expect(screen.getAllByLabelText("WhatsApp")[0]).toHaveAttribute(
      "href",
      `https://wa.me/${siteConfig.whatsappNumber}`,
    );
    expect(screen.getAllByLabelText("Call Now")[0]).toHaveAttribute(
      "href",
      `tel:${siteConfig.phoneNumber.replace(/[^0-9+]/g, "")}`,
    );
    expect(screen.getAllByLabelText("Apply Now")[0]).toHaveAttribute(
      "href",
      "/en/#enquiry",
    );
    expect(screen.getByLabelText("Login")).toHaveAttribute(
      "href",
      "/en/sign-in",
    );
  });

  test("mobile hamburger menu toggles nav visibility on click", () => {
    render(<Header />);

    expect(
      screen.queryByLabelText("Mobile navigation"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Open menu"));
    const mobileNav = screen.getByLabelText("Mobile navigation");
    expect(mobileNav).toBeInTheDocument();
    expect(within(mobileNav).getByText("Gallery")).toBeInTheDocument();
    expect(within(mobileNav).queryByText("Resources")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close menu"));
    expect(
      screen.queryByLabelText("Mobile navigation"),
    ).not.toBeInTheDocument();
  });
});

describe("Header layout presence", () => {
  test("Header is present on a (public) page", () => {
    render(<Header />);

    expect(screen.getByAltText("G-TEC Thodupuzha")).toBeInTheDocument();
    expect(screen.getByLabelText("G-TEC Thodupuzha home")).toBeInTheDocument();
  });

  test("Header does not render inside a (portal) placeholder page", () => {
    render(
      <PortalLayout>
        <main>Portal page content</main>
      </PortalLayout>,
    );

    expect(screen.queryByAltText("G-TEC Thodupuzha")).not.toBeInTheDocument();
  });

  test("Header does not render inside an (admin) placeholder page", () => {
    render(
      <AdminLayout params={Promise.resolve({ locale: "en" })}>
        <main>Admin page content</main>
      </AdminLayout>,
    );

    expect(screen.queryByAltText("G-TEC Thodupuzha")).not.toBeInTheDocument();
  });
});
