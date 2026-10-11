import { describe, expect, test, vi, beforeEach } from "vitest";
import { setMockRows } from "@/__tests__/drizzle-mock";
import { db } from "@/db";

const mockAuth = vi.hoisted(() => vi.fn());
const mockEmployerProfileCount = vi.hoisted(() => vi.fn());
const mockJobPostingCount = vi.hoisted(() => vi.fn());
const mockSkillCount = vi.hoisted(() => vi.fn());
const mockEnquiryFindMany = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockStaffPermissionFindUnique = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    employerProfile: {
      count: mockEmployerProfileCount,
    },
    jobPosting: {
      count: mockJobPostingCount,
    },
    skill: {
      count: mockSkillCount,
    },
    enquiry: {
      findMany: mockEnquiryFindMany,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    staffPermission: {
      findUnique: mockStaffPermissionFindUnique,
    },
  },
}));

const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

function makeEnquiry(id: string, name: string, daysAgo: number) {
  const date = new Date("2026-07-01T00:00:00Z");
  date.setDate(date.getDate() - daysAgo);
  return {
    id,
    name,
    phone: "9876543210",
    course: { titleEn: "Diploma in Computer Application" },
    source: "homepage-hero",
    createdAt: date,
  };
}

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockEmployerProfileCount.mockReset();
    mockJobPostingCount.mockReset();
    mockSkillCount.mockReset();
    mockEnquiryFindMany.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
    setMockRows(db, "staffPermission", [
      {
        userId: "staff_1", // every CENTRE_STAFF test below signs in as staff_1
        canApproveEmployers: true,
        canApproveJobPostings: true,
        canModerateSkillsTaxonomy: true,
      },
    ]);
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  test("redirects to forbidden for non-admin roles", async () => {
    mockAuth.mockResolvedValue({
      userId: "employer_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    const { default: AdminDashboardPage } = await import("./page");

    await expect(
      AdminDashboardPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("shows pending employer registration count matching PENDING EmployerProfile rows", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockEmployerProfileCount.mockResolvedValue(3);
    mockJobPostingCount.mockResolvedValue(0);
    mockSkillCount.mockResolvedValue(0);
    mockEnquiryFindMany.mockResolvedValue([]);

    const { default: AdminDashboardPage } = await import("./page");
    const { renderToString } = await import("react-dom/server");
    const element = await AdminDashboardPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(mockEmployerProfileCount).toHaveBeenCalledWith({
      where: { status: "PENDING" },
    });
    expect(html).toContain("3");
    expect(html).toContain("Pending Employer Registrations");
  });

  test("shows pending job posting count matching PENDING JobPosting rows", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockEmployerProfileCount.mockResolvedValue(0);
    mockJobPostingCount.mockResolvedValue(5);
    mockSkillCount.mockResolvedValue(0);
    mockEnquiryFindMany.mockResolvedValue([]);

    const { default: AdminDashboardPage } = await import("./page");
    const { renderToString } = await import("react-dom/server");
    const element = await AdminDashboardPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(mockJobPostingCount).toHaveBeenCalledWith({
      where: { status: "PENDING" },
    });
    expect(html).toContain("5");
    expect(html).toContain("Pending Job Postings");
  });

  test("recent enquiries list shows the 5 most recent Enquiry rows, newest first", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockEmployerProfileCount.mockResolvedValue(0);
    mockJobPostingCount.mockResolvedValue(0);
    mockSkillCount.mockResolvedValue(0);

    const enquiries = [
      makeEnquiry("e1", "Alice", 1),
      makeEnquiry("e2", "Bob", 2),
      makeEnquiry("e3", "Charlie", 3),
      makeEnquiry("e4", "Diana", 4),
      makeEnquiry("e5", "Eve", 5),
      makeEnquiry("e6", "Frank", 6),
    ];

    // Return 5 newest (oldest excluded)
    const expected = enquiries.slice(0, 5);

    mockEnquiryFindMany.mockImplementation((args) => {
      // Verify ordering and limit
      expect(args.orderBy.createdAt).toBe("desc");
      expect(args.take).toBe(5);
      return Promise.resolve(expected);
    });

    const { default: AdminDashboardPage } = await import("./page");
    const { renderToString } = await import("react-dom/server");
    const element = await AdminDashboardPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(mockEnquiryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    );
    // Check newest-first order
    const names = expected.map((e) => e.name);
    // Frank (day 6) should NOT appear — only 5 shown
    expect(html).not.toContain("Frank");

    // Verify the 5 shown are the newest ones
    for (const name of names) {
      expect(html).toContain(name);
    }
  });

  test("audit-log quick link button is visible to super_admin but not to centre_staff", async () => {
    // --- Super Admin ---
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });
    mockEmployerProfileCount.mockResolvedValue(0);
    mockJobPostingCount.mockResolvedValue(0);
    mockSkillCount.mockResolvedValue(0);
    mockEnquiryFindMany.mockResolvedValue([]);

    const { default: AdminDashboardPage } = await import("./page");
    const { renderToString } = await import("react-dom/server");

    let element = await AdminDashboardPage({
      params: Promise.resolve({ locale: "en" }),
    });
    let html = renderToString(element);

    // Super Admin sees both the explicit "View Audit Log" button and the Audit Log card
    expect(html).toContain("View Audit Log");
    expect(html).toContain("audit-log");
    // Also sees super-admin-only cards
    expect(html).toContain("Site Settings");
    expect(html).toContain("Staff Management");

    // --- Centre Staff ---
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
    setMockRows(db, "staffPermission", [
      {
        userId: "staff_1",
        canEditCourses: false,
        canEditGallery: false,
        canEditCertificationPartners: false,
        canEditNewsEvents: false,
        canEditFlashNews: false,
        canProvisionStudents: false,
        canApproveEmployers: true,
        canApproveJobPostings: true,
        canModerateSkillsTaxonomy: true,
      },
    ]);
    mockEmployerProfileCount.mockResolvedValue(0);
    mockJobPostingCount.mockResolvedValue(0);
    mockSkillCount.mockResolvedValue(0);
    mockEnquiryFindMany.mockResolvedValue([]);
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });

    // Re-import to get fresh module state
    const { default: AdminDashboardPage2 } = await import("./page");

    element = await AdminDashboardPage2({
      params: Promise.resolve({ locale: "en" }),
    });
    html = renderToString(element);

    // The explicit "View Audit Log" button still requires isSuperAdmin
    expect(html).not.toContain("View Audit Log");
    // Audit Log card shows for all staff (unrestricted route)
    expect(html).toContain("Audit Log");
    // Super admin cards show as "No access" greyed-out cards
    expect(html).toContain("Site Settings");
    expect(html).toContain("Staff Management");
    // Verify those are greyed out, not active links
    expect(html).toContain("No access");
  });
});
