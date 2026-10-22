import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
// Imported at module level (vi.mock calls are hoisted above it) so loading the
// page's module graph happens during collection, not inside a test's time limit.
import * as mod from "./page";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

const mockGetActiveJobPostings = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/en/portal/jobs",
}));

vi.mock("@/lib/jobs", () => ({
  getActiveJobPostings: mockGetActiveJobPostings,
}));

vi.mock("@/lib/skills", () => ({
  getApprovedSkills: vi.fn().mockResolvedValue([]),
}));

describe("Jobs page — role-based access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
    mockGetActiveJobPostings.mockResolvedValue([]);
  });

  test("accessible to a student", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    await expect(
      mod.default({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.not.toThrow();
  });

  test("accessible to a job_seeker", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_js_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });

    await expect(
      mod.default({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.not.toThrow();
  });

  test("denied to an employer — redirects to forbidden", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_emp_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    await expect(
      mod.default({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("each job card links to its detail page", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });
    mockGetActiveJobPostings.mockResolvedValue([
      {
        id: "jp_1",
        title: "Software Engineer",
        department: null,
        salaryMin: null,
        salaryMax: null,
        salaryVisibility: "PRIVATE",
        jobType: "FULL_TIME",
        skillIds: [],
        applicationDeadline: new Date("2026-12-31T00:00:00Z"),
        description: "A great job",
        createdAt: new Date("2026-06-01"),
        employer: { companyName: "Tech Corp", companyAddress: "Kochi" },
      },
    ]);

    const html = renderToString(
      await mod.default({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain('href="/en/portal/jobs/jp_1"');
    expect(html).toContain("31 Dec 2026");
  });
});
