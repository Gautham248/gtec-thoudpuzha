import { describe, expect, test, vi, beforeEach } from "vitest";
// Imported at module level (vi.mock calls are hoisted above it) so loading the
// page's module graph happens during collection, not inside a test's time limit.
import * as mod from "./page";

const mockAuth = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockSkillsFindMany = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    jobPosting: {
      findMany: mockFindMany,
    },
    skill: {
      findMany: mockSkillsFindMany,
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

describe("Jobs page — role-based access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  test("accessible to a student", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });
    mockFindMany.mockResolvedValue([]);
    mockSkillsFindMany.mockResolvedValue([]);

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
    mockFindMany.mockResolvedValue([]);
    mockSkillsFindMany.mockResolvedValue([]);

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
});
