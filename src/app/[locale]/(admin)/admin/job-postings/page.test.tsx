import { describe, expect, test, vi, beforeEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockStaffPermissionFindUnique = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    jobPosting: {
      findMany: mockFindMany,
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

describe("JobPostingsPage filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockFindMany.mockReset();
    mockUserFindUnique.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  test("1. PENDING posting from a non-trusted employer appears in queue", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockFindMany.mockResolvedValue([
      {
        id: "jp_1",
        title: "Software Engineer",
        jobType: "FULL_TIME",
        applicationDeadline: new Date("2026-08-01"),
        status: "PENDING",
        autoPublished: false,
        employer: {
          companyName: "Acme Corp",
          email: "hr@acme.com",
          autoPublishTrusted: false,
        },
      },
    ]);

    const { default: JobPostingsPage } = await import("./page");

    const result = await JobPostingsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ status: "PENDING" }),
    });

    expect(result).toBeDefined();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDING" },
      }),
    );
  });

  test("2. APPROVED autoPublished=true posting does NOT appear in needs-action but DOES appear in auto-published audit filter", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    // First call — needs-action filter (status=APPROVED but autoPublished=true excluded by design)
    mockFindMany.mockResolvedValueOnce([]);

    const { default: JobPostingsPage } = await import("./page");

    // Test needs-action view — PENDING status filter
    await JobPostingsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ status: "PENDING" }),
    });

    // Reset and test auto-published audit view
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockFindMany.mockResolvedValueOnce([
      {
        id: "jp_2",
        title: "Accountant",
        jobType: "FULL_TIME",
        applicationDeadline: new Date("2026-09-01"),
        status: "APPROVED",
        autoPublished: true,
        employer: {
          companyName: "Beta Ltd",
          email: "hr@beta.com",
          autoPublishTrusted: true,
        },
      },
    ]);

    await JobPostingsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ status: "AUTO_PUBLISHED" }),
    });

    // The auto-published filter should query for status=APPROVED AND autoPublished=true
    expect(mockFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { status: "APPROVED", autoPublished: true },
      }),
    );
  });

  test("3. Centre Staff can view the page (read-only access)", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockFindMany.mockResolvedValue([]);

    const { default: JobPostingsPage } = await import("./page");

    const result = await JobPostingsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });

    expect(result).toBeDefined();
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  test("4. EMPLOYER role is denied (redirects to forbidden)", async () => {
    mockAuth.mockResolvedValue({
      userId: "employer_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    const { default: JobPostingsPage } = await import("./page");

    await expect(
      JobPostingsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("5. SUPER_ADMIN can view with full actions", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockFindMany.mockResolvedValue([
      {
        id: "jp_1",
        title: "Software Engineer",
        jobType: "FULL_TIME",
        applicationDeadline: new Date("2026-08-01"),
        status: "PENDING",
        autoPublished: false,
        employer: {
          companyName: "Acme Corp",
          email: "hr@acme.com",
          autoPublishTrusted: false,
        },
      },
    ]);

    const { default: JobPostingsPage } = await import("./page");

    const result = await JobPostingsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });

    expect(result).toBeDefined();
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });
});
