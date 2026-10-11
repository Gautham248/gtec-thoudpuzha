import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { db } from "@/db";
import { setMockRows } from "@/__tests__/drizzle-mock";
import JobPostingsPage from "./page";

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

function posting(
  id: string,
  title: string,
  status: string,
  autoPublished: boolean,
  companyName: string,
) {
  return {
    id,
    title,
    jobType: "FULL_TIME",
    applicationDeadline: new Date("2026-12-01"),
    description: "desc",
    status,
    autoPublished,
    skillIds: [],
    salaryVisibility: "PRIVATE",
    createdAt: new Date("2026-06-01"),
    employerId: `emp_${id}`,
    employer: {
      id: `emp_${id}`,
      companyName,
      email: `hr@${companyName.toLowerCase().replace(/\s/g, "")}.com`,
      autoPublishTrusted: autoPublished,
    },
  };
}

const render = async (searchParams: { status?: string } = {}) =>
  renderToString(
    await JobPostingsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve(searchParams),
    }),
  );

const signIn = (userId: string, role: string) =>
  mockAuth.mockResolvedValue({ userId, sessionClaims: { metadata: { role } } });

describe("JobPostingsPage filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockRows(db, "jobPosting", [
      posting("jp_1", "Software Engineer", "PENDING", false, "Acme Corp"),
      posting("jp_2", "Accountant", "APPROVED", true, "Beta Ltd"),
      posting("jp_3", "Designer", "APPROVED", false, "Gamma Inc"),
    ]);
  });

  test("1. PENDING posting from a non-trusted employer appears in queue", async () => {
    signIn("super_admin_1", "SUPER_ADMIN");

    const html = await render({ status: "PENDING" });

    expect(html).toContain("Software Engineer");
    expect(html).not.toContain("Accountant");
    expect(html).not.toContain("Designer");
  });

  test("2. APPROVED autoPublished=true posting does NOT appear in needs-action but DOES appear in auto-published audit filter", async () => {
    signIn("super_admin_1", "SUPER_ADMIN");

    expect(await render({ status: "PENDING" })).not.toContain("Accountant");

    const auditView = await render({ status: "AUTO_PUBLISHED" });
    expect(auditView).toContain("Accountant");
    // Approved but not auto-published postings are not part of the audit view.
    expect(auditView).not.toContain("Designer");
  });

  test("3. Centre Staff can view the page (read-only access)", async () => {
    signIn("staff_1", "CENTRE_STAFF");

    const html = await render();

    expect(html).toContain("Software Engineer");
    expect(html).toContain("Accountant");
  });

  test("4. EMPLOYER role is denied (redirects to forbidden)", async () => {
    signIn("employer_1", "EMPLOYER");

    await expect(render()).rejects.toThrow("redirect:/en/forbidden");
  });

  test("5. SUPER_ADMIN can view with full actions", async () => {
    signIn("super_admin_1", "SUPER_ADMIN");

    const html = await render();

    expect(html).toContain("Software Engineer");
    expect(html).toContain("Acme Corp");
  });
});
