import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { db } from "@/db";
import { setMockRows } from "@/__tests__/drizzle-mock";
import JobDetailPage from "./page";

// "@/db" is the in-memory fake installed by src/__tests__/setup.ts.

const mockAuth = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockNotFound = vi.hoisted(() => {
  const err = new Error("NEXT_NOT_FOUND");
  err.name = "NotFoundError";
  return vi.fn(() => {
    throw err;
  });
});
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockGetSkillsByIds = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));

vi.mock("@/lib/jobs", () => ({
  getJobDetail: mockFindFirst,
}));

vi.mock("@/lib/skills", () => ({
  getSkillsByIds: mockGetSkillsByIds,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: mockRedirect,
}));

function makeJobDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: "jp_1",
    title: "Software Engineer",
    department: "Engineering",
    salaryMin: 50000,
    salaryMax: 80000,
    salaryVisibility: "DISCLOSE",
    jobType: "FULL_TIME",
    skillIds: ["skill_1"],
    applicationDeadline: new Date("2026-12-31"),
    description: "A great job opportunity.",
    createdAt: new Date("2026-06-01"),
    isOpen: true,
    employer: {
      companyName: "Tech Corp",
      companyAddress: "Kochi, Kerala",
      industrySector: "IT_SOFTWARE",
      employeeCountRange: "RANGE_51_200",
      aboutCompany: "We build great software.",
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Job detail page", () => {
  test("shows 'Complete your profile to apply' for incomplete profile", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });
    mockFindFirst.mockResolvedValue(makeJobDetail());
    mockGetSkillsByIds.mockResolvedValue([]);
    // Incomplete profile
    setMockRows(db, "candidateProfile", [
      {
        id: "cp_1",
        userId: "user_1",
        fullName: null,
        dateOfBirth: null,
        phone: null,
        email: null,
        courseCompletedIds: [],
        certificationIds: [],
        educationalQualification: null,
        yearOfPassing: null,
        address: null,
        languagesKnown: [],
        skillIds: [],
        preferredJobLocation: null,
        preferredJobType: null,
        careerObjective: null,
        photoUrl: null,
        profileVisible: true,
        isVerifiedStudent: false,
        studentRecordId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const { container: _container } = render(
      await JobDetailPage({
        params: Promise.resolve({ locale: "en", id: "jp_1" }),
      }),
    );

    expect(screen.getByText("Complete your profile to apply")).toBeDefined();
    expect(screen.getByText("Software Engineer")).toBeDefined();
  });

  test("shows Applied ✓ after applying (reload)", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });
    mockFindFirst.mockResolvedValue(makeJobDetail());
    mockGetSkillsByIds.mockResolvedValue([]);
    // Complete profile
    setMockRows(db, "candidateProfile", [
      {
        id: "cp_1",
        userId: "user_1",
        fullName: "John Doe",
        dateOfBirth: new Date("2000-01-01"),
        phone: "9999999999",
        email: "john@example.com",
        courseCompletedIds: [],
        certificationIds: [],
        educationalQualification: "GRADUATE",
        yearOfPassing: 2022,
        address: "Test",
        languagesKnown: ["English"],
        skillIds: [],
        preferredJobLocation: "Kochi",
        preferredJobType: "FULL_TIME",
        careerObjective: null,
        photoUrl: null,
        profileVisible: true,
        isVerifiedStudent: false,
        studentRecordId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    // Existing application found (persisted)
    setMockRows(db, "application", [
      {
        id: "app_1",
        jobPostingId: "jp_1",
        candidateProfileId: "cp_1",
        status: "APPLIED",
      },
    ]);

    render(
      await JobDetailPage({
        params: Promise.resolve({ locale: "en", id: "jp_1" }),
      }),
    );

    expect(screen.getByText("Applied ✓")).toBeDefined();
  });

  test("an application for a different job does not count as applied", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });
    mockFindFirst.mockResolvedValue(makeJobDetail());
    mockGetSkillsByIds.mockResolvedValue([]);
    setMockRows(db, "candidateProfile", [
      {
        id: "cp_1",
        userId: "user_1",
        fullName: "John Doe",
        dateOfBirth: new Date("2000-01-01"),
        phone: "9999999999",
        email: "john@example.com",
        courseCompletedIds: [],
        certificationIds: [],
        educationalQualification: "GRADUATE",
        yearOfPassing: 2022,
        address: "Test",
        languagesKnown: ["English"],
        skillIds: [],
        preferredJobLocation: "Kochi",
        preferredJobType: "FULL_TIME",
        profileVisible: true,
      },
    ]);
    setMockRows(db, "application", [
      {
        id: "app_9",
        jobPostingId: "jp_other",
        candidateProfileId: "cp_1",
        status: "APPLIED",
      },
    ]);

    render(
      await JobDetailPage({
        params: Promise.resolve({ locale: "en", id: "jp_1" }),
      }),
    );

    expect(screen.queryByText("Applied ✓")).toBeNull();
  });

  test("returns 404 for non-existent job id", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });
    mockFindFirst.mockResolvedValue(null);
    mockGetSkillsByIds.mockResolvedValue([]);

    await expect(
      JobDetailPage({
        params: Promise.resolve({ locale: "en", id: "nonexistent" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  test("returns 404 for expired job", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });
    // getJobDetail returns null because the deadline is past
    mockFindFirst.mockResolvedValue(null);
    mockGetSkillsByIds.mockResolvedValue([]);

    await expect(
      JobDetailPage({
        params: Promise.resolve({ locale: "en", id: "expired_job" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  test("a past applicant sees a closed job read-only with their status", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });
    mockFindFirst.mockResolvedValue(makeJobDetail({ isOpen: false }));
    mockGetSkillsByIds.mockResolvedValue([]);
    setMockRows(db, "candidateProfile", [
      {
        id: "cp_1",
        userId: "user_1",
        fullName: "John Doe",
        dateOfBirth: new Date("2000-01-01"),
        phone: "9999999999",
        email: "john@example.com",
        courseCompletedIds: [],
        certificationIds: [],
        educationalQualification: "GRADUATE",
        yearOfPassing: 2022,
        address: "Test",
        languagesKnown: ["English"],
        skillIds: [],
        preferredJobLocation: "Kochi",
        preferredJobType: "FULL_TIME",
        profileVisible: true,
      },
    ]);
    setMockRows(db, "application", [
      {
        id: "app_1",
        jobPostingId: "jp_1",
        candidateProfileId: "cp_1",
        status: "SHORTLISTED",
      },
    ]);

    render(
      await JobDetailPage({
        params: Promise.resolve({ locale: "en", id: "jp_1" }),
      }),
    );

    expect(mockFindFirst).toHaveBeenCalledWith("jp_1", { includeClosed: true });
    expect(screen.getByText("Software Engineer")).toBeDefined();
    expect(
      screen.getByText("This job is no longer accepting applications."),
    ).toBeDefined();
    expect(screen.getByText("Shortlisted")).toBeDefined();
    expect(screen.queryByText("Apply Now")).toBeNull();
  });

  test("a closed job is a 404 for a candidate who never applied", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });
    mockFindFirst.mockResolvedValue(makeJobDetail({ isOpen: false }));
    mockGetSkillsByIds.mockResolvedValue([]);
    setMockRows(db, "candidateProfile", [
      {
        id: "cp_1",
        userId: "user_1",
        fullName: "John Doe",
        dateOfBirth: new Date("2000-01-01"),
        phone: "9999999999",
        email: "john@example.com",
        courseCompletedIds: [],
        certificationIds: [],
        educationalQualification: "GRADUATE",
        yearOfPassing: 2022,
        address: "Test",
        languagesKnown: ["English"],
        skillIds: [],
        preferredJobLocation: "Kochi",
        preferredJobType: "FULL_TIME",
        profileVisible: true,
      },
    ]);
    setMockRows(db, "application", []);

    await expect(
      JobDetailPage({
        params: Promise.resolve({ locale: "en", id: "jp_1" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
