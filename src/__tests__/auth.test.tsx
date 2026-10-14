import { renderToString } from "react-dom/server";
import { NextRequest, NextFetchEvent, NextResponse } from "next/server";
import { describe, expect, test, vi, beforeEach } from "vitest";
import AccountSetupIncompletePage from "@/app/[locale]/account-setup-incomplete/page";
import ForbiddenPage from "@/app/[locale]/forbidden/page";

const mockAuth = vi.hoisted(() => vi.fn());

const mockClerkMiddleware = vi.hoisted(
  () =>
    (
      _handler: (
        req: NextRequest,
        evt: NextFetchEvent,
      ) => NextResponse | Promise<NextResponse>,
    ) => {},
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkMiddleware: mockClerkMiddleware,
}));

describe("Account Setup Incomplete page", () => {
  test("renders the account setup incomplete message", () => {
    const html = renderToString(<AccountSetupIncompletePage />);
    expect(html).toContain("Account setup incomplete");
    expect(html).toContain("contact the centre");
  });
});

describe("Forbidden page", () => {
  test("renders the 403 forbidden message", async () => {
    const element = await ForbiddenPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    const html = renderToString(element);
    expect(html).toContain("403");
    expect(html).toContain("Access Restricted");
  });
});

describe("Dashboard pages display role-based welcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The admin dashboard's role-based welcome is covered in
  // app/[locale]/(admin)/admin/page.test.tsx (it needs a real database).

  test("portal dashboard redirects STUDENT to /portal/student", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_3",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    const { default: PortalDashboardPage } =
      await import("@/app/[locale]/(portal)/portal/page");
    await expect(
      PortalDashboardPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");
  });

  test("portal dashboard redirects JOB_SEEKER to /portal/job-seeker", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_4",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });

    const { default: PortalDashboardPage } =
      await import("@/app/[locale]/(portal)/portal/page");
    await expect(
      PortalDashboardPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");
  });
});
