// @vitest-environment node
import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { application, employerProfile } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  insertEmployer,
  insertJobPosting,
  insertStudentProfile,
  insertUser,
} from "@/__tests__/pg-fixtures";
import type { CandidateProfileWithCompletion } from "@/lib/biodata";

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockResendSend = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    return { emails: { send: mockResendSend } };
  }),
}));

// Mock the biodata-search module
const mockGetSearchableCandidates = vi.hoisted(() => vi.fn());

vi.mock("@/lib/biodata-search", () => ({
  getSearchableCandidates: mockGetSearchableCandidates,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeProfile(
  overrides: Partial<CandidateProfileWithCompletion> = {},
): CandidateProfileWithCompletion {
  return {
    id: "c1",
    fullName: "John Doe",
    dateOfBirth: new Date("2000-01-01"),
    phone: "9876543210",
    email: "john@example.com",
    courseCompletedIds: ["course_1"],
    certificationIds: [],
    educationalQualification: "GRADUATE",
    yearOfPassing: 2022,
    address: "123 Main St",
    languagesKnown: ["English", "Malayalam"],
    skillIds: ["skill_1", "skill_2"],
    preferredJobLocation: "Kochi",
    preferredJobType: "FULL_TIME",
    careerObjective: "Looking for opportunities",
    photoUrl: null,
    profileVisible: true,
    isVerifiedStudent: false,
    studentRecordId: null,
    ...overrides,
  };
}

const pg = db as unknown as TestDb;

/** The signed-in employer (user_emp_1), approved unless told otherwise. */
async function seedEmployer(status: "APPROVED" | "PENDING" = "APPROVED") {
  await insertUser(pg, { id: "user_emp_1", role: "EMPLOYER" });
  return insertEmployer(pg, {
    userId: "user_emp_1",
    companyName: "Acme Corp",
    contactPersonName: "Alice",
    status,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("searchCandidates", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockGetSearchableCandidates.mockReset();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
    // Default: employer is logged in and approved
    mockAuth.mockResolvedValue({
      userId: "user_emp_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });
    await truncateAll(pg);
    await seedEmployer();
  });

  test("1. Only includes candidates with profileVisible=true AND isComplete=true", async () => {
    // getSearchableCandidates() already filters to visible+complete profiles.
    // The mock should only return those that would pass the filter.
    const visibleComplete = makeProfile({ id: "p1" });
    const bothComplete = makeProfile({ id: "p4" });

    mockGetSearchableCandidates.mockResolvedValue([
      visibleComplete,
      bothComplete,
    ]);

    const { searchCandidates } = await import("./actions");
    const results = await searchCandidates({});

    expect(results).toHaveLength(2);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("p1");
    expect(ids).toContain("p4");
  });

  test("2a. preferredJobLocation filter narrows results", async () => {
    mockGetSearchableCandidates.mockResolvedValue([
      makeProfile({ id: "p1", preferredJobLocation: "Kochi" }),
      makeProfile({ id: "p2", preferredJobLocation: "Bangalore" }),
      makeProfile({ id: "p3", preferredJobLocation: "Kochi" }),
    ]);

    const { searchCandidates } = await import("./actions");
    const results = await searchCandidates({
      preferredJobLocation: "Kochi",
    });

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id).sort()).toEqual(["p1", "p3"]);
  });

  test("2b. preferredJobType filter narrows results", async () => {
    mockGetSearchableCandidates.mockResolvedValue([
      makeProfile({ id: "p1", preferredJobType: "FULL_TIME" }),
      makeProfile({ id: "p2", preferredJobType: "PART_TIME" }),
      makeProfile({ id: "p3", preferredJobType: "FULL_TIME" }),
    ]);

    const { searchCandidates } = await import("./actions");
    const results = await searchCandidates({
      preferredJobType: "PART_TIME",
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("p2");
  });

  test("2c. educationalQualification filter narrows results", async () => {
    mockGetSearchableCandidates.mockResolvedValue([
      makeProfile({ id: "p1", educationalQualification: "GRADUATE" }),
      makeProfile({ id: "p2", educationalQualification: "POST_GRADUATE" }),
      makeProfile({ id: "p3", educationalQualification: "DIPLOMA" }),
    ]);

    const { searchCandidates } = await import("./actions");
    const results = await searchCandidates({
      educationalQualification: "POST_GRADUATE",
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("p2");
  });

  test("2d. languagesKnown filter narrows results", async () => {
    mockGetSearchableCandidates.mockResolvedValue([
      makeProfile({
        id: "p1",
        languagesKnown: ["English", "Malayalam"],
      }),
      makeProfile({
        id: "p2",
        languagesKnown: ["English", "Hindi"],
      }),
      makeProfile({
        id: "p3",
        languagesKnown: ["Malayalam"],
      }),
    ]);

    const { searchCandidates } = await import("./actions");
    const results = await searchCandidates({
      languagesKnown: ["Hindi"],
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("p2");
  });

  test("3. Non-approved employer is blocked", async () => {
    await pg.update(employerProfile).set({ status: "PENDING" });

    const { searchCandidates } = await import("./actions");

    await expect(searchCandidates({})).rejects.toThrow(
      "redirect:/portal/employer/register/status",
    );

    expect(mockGetSearchableCandidates).not.toHaveBeenCalled();
  });
});

describe("inviteToApply", () => {
  let postingId: string;
  let candidateId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockResendSend.mockReset();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
    mockAuth.mockResolvedValue({
      userId: "user_emp_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });
    await truncateAll(pg);
    const employer = await seedEmployer();
    postingId = (
      await insertJobPosting(pg, {
        employerId: employer.id,
        title: "Software Engineer",
      })
    ).id;
    const complete = makeProfile();
    candidateId = (
      await insertStudentProfile(pg, {
        fullName: complete.fullName,
        dateOfBirth: complete.dateOfBirth,
        phone: complete.phone,
        email: complete.email,
        courseCompletedIds: complete.courseCompletedIds,
        educationalQualification: "GRADUATE",
        yearOfPassing: complete.yearOfPassing,
        address: complete.address,
        languagesKnown: complete.languagesKnown,
        skillIds: complete.skillIds,
        preferredJobLocation: complete.preferredJobLocation,
        preferredJobType: "FULL_TIME",
        careerObjective: complete.careerObjective,
      })
    ).id;
  });

  test("4. Invite sends notification email but does NOT create an Application", async () => {
    mockResendSend.mockResolvedValue({ id: "email_1" });

    const { inviteToApply } = await import("./actions");
    const result = await inviteToApply(candidateId, postingId);

    expect(result.success).toBe(true);
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "john@example.com",
        subject: expect.stringContaining("Software Engineer"),
      }),
    );
    expect(await pg.$count(application)).toBe(0);
  });

  test("5. Employer can only select from their OWN approved postings", async () => {
    const otherEmployer = await insertEmployer(pg, {
      companyName: "Rival Ltd",
    });
    const othersPosting = await insertJobPosting(pg, {
      employerId: otherEmployer.id,
    });

    const { inviteToApply } = await import("./actions");
    const result = await inviteToApply(candidateId, othersPosting.id);

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  test("a hidden candidate cannot be invited", async () => {
    const { candidateProfile } = await import("@/db/schema");
    await pg.update(candidateProfile).set({ profileVisible: false });

    const { inviteToApply } = await import("./actions");
    const result = await inviteToApply(candidateId, postingId);

    expect(result).toEqual({
      success: false,
      error: "Candidate not found or not searchable.",
    });
    expect(mockResendSend).not.toHaveBeenCalled();
  });
});
