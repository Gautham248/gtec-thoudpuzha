import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { db } from "@/db";
import { setMockRows } from "@/__tests__/drizzle-mock";
import EmployersPage from "./page";

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
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function employer(
  id: string,
  companyName: string,
  status: string,
  createdAt: string,
) {
  return {
    id,
    companyName,
    contactPersonName: "John Doe",
    phone: "9876543210",
    email: `${id}@acme.com`,
    industrySector: "IT_SOFTWARE",
    status,
    autoPublishTrusted: false,
    rejectionReason: null,
    createdAt: new Date(createdAt),
  };
}

const render = async (searchParams: { status?: string } = {}) =>
  renderToString(
    await EmployersPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve(searchParams),
    }),
  );

describe("EmployersPage permission gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockRows(db, "employerProfile", [
      employer("ep_1", "Acme Corp", "PENDING", "2026-01-01"),
      employer("ep_2", "Beta Ltd", "APPROVED", "2026-02-01"),
    ]);
  });

  test("Centre Staff can view /admin/employers (read-only access)", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const html = await render();

    expect(html).toContain("Acme Corp");
    expect(html).toContain("Beta Ltd");
  });

  test("EMPLOYER role is denied (redirects to forbidden)", async () => {
    mockAuth.mockResolvedValue({
      userId: "employer_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    await expect(render()).rejects.toThrow("redirect:/en/forbidden");
  });

  test("SUPER_ADMIN can view /admin/employers, filtered by status", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    const html = await render({ status: "PENDING" });

    expect(html).toContain("Acme Corp");
    expect(html).not.toContain("Beta Ltd");
  });
});
