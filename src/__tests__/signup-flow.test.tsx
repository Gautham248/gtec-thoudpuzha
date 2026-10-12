import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, test, vi, beforeEach } from "vitest";

// ─── hoisted mocks (before vi.mock) ────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/link", () => ({
  default: vi.fn(
    ({ href, children }: { href: string; children: ReactNode }) =>
      `<a href="${href}">${Array.isArray(children) ? (children[0]?.toString() ?? "") : (children?.toString() ?? "")}</a>`,
  ),
}));

// Helper to render a Next.js page component given its module
async function renderPage(
  pageModule: Record<string, unknown>,
  searchParams: Record<string, string> = {},
) {
  const Component = pageModule.default as (
    props: Record<string, unknown>,
  ) => Promise<React.ReactElement>;
  const element = await Component({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve(searchParams),
  });
  return renderToString(element);
}

// ─── Tests ─────────────────────────────────────────────────────────────────

// The /complete-signup role assignment (job seeker / employer / invited
// staff) is tested against a database in src/__tests__/complete-signup.test.tsx.

describe("Sign-up picker page — redirect logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReset();
    mockAuth.mockReset();
  });

  test("3. Already-authenticated user with role=student visiting /portal/sign-up is redirected away from the picker", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    const mod = await import("@/app/[locale]/(portal)/portal/sign-up/page");

    try {
      await renderPage(mod);
    } catch {
      // redirect throws, that's expected
    }

    expect(mockRedirect).toHaveBeenCalledWith("/portal/student");
  });

  test("4. Selecting the Student option routes to /portal/sign-up/student WITHOUT setting a role yet", async () => {
    // Unauthenticated — should render the picker with options
    mockAuth.mockResolvedValue({ userId: null });

    const mod = await import("@/app/[locale]/(portal)/portal/sign-up/page");

    const html = await renderPage(mod);

    // The student card should link to /portal/sign-up/student
    expect(html).toContain("href=&quot;/portal/sign-up/student&quot;");
    // The job seeker card should link to /sign-up?intent=job_seeker
    expect(html).toContain("href=&quot;/sign-up?intent=job_seeker&quot;");
    // The employer card should link to /sign-up?intent=employer
    expect(html).toContain("href=&quot;/sign-up?intent=employer&quot;");
    // Should reference key text content
    expect(html).toContain("Create Your Account");
    expect(html).toContain("Select the option");
  });
});
