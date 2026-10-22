// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { application } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  daysFromNow,
  insertJobPosting,
  insertStudentProfile,
  insertUser,
} from "@/__tests__/pg-fixtures";
import { applyToJob } from "./actions";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

const pg = db as unknown as TestDb;

const completeProfile = {
  fullName: "John Doe",
  dateOfBirth: new Date("2000-01-01"),
  phone: "9999999999",
  email: "john@example.com",
  educationalQualification: "GRADUATE" as const,
  yearOfPassing: 2022,
  address: "Test",
  languagesKnown: ["English"],
  preferredJobLocation: "Kochi",
  preferredJobType: "FULL_TIME" as const,
};

let postingId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  await insertUser(pg, { id: "user_1", role: "JOB_SEEKER" });
  postingId = (await insertJobPosting(pg)).id;
  mockAuth.mockResolvedValue({
    userId: "user_1",
    sessionClaims: { metadata: { role: "JOB_SEEKER" } },
  });
});

function apply() {
  const fd = new FormData();
  fd.append("jobPostingId", postingId);
  fd.append("locale", "en");
  return applyToJob(fd);
}

describe("applyToJob", () => {
  test("returns error when candidate profile is incomplete", async () => {
    await insertStudentProfile(pg, { userId: "user_1", fullName: null });

    expect(await apply()).toEqual({ error: "PROFILE_INCOMPLETE" });
    expect(await pg.$count(application)).toBe(0);
  });

  test("returns error when there is no profile at all", async () => {
    expect(await apply()).toEqual({ error: "PROFILE_INCOMPLETE" });
  });

  test("creates an Application record when profile is complete", async () => {
    const profile = await insertStudentProfile(pg, {
      userId: "user_1",
      ...completeProfile,
    });

    expect(await apply()).toEqual({ applied: true });

    expect(await pg.select().from(application)).toEqual([
      expect.objectContaining({
        jobPostingId: postingId,
        candidateProfileId: profile.id,
        status: "APPLIED",
      }),
    ]);
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      `/en/portal/jobs/${postingId}`,
    );
  });

  test("blocks duplicate application to the same job", async () => {
    await insertStudentProfile(pg, { userId: "user_1", ...completeProfile });

    expect(await apply()).toEqual({ applied: true });
    expect(await apply()).toEqual({ error: "ALREADY_APPLIED" });
    expect(await pg.$count(application)).toBe(1);
  });

  test.each([
    ["pending", { status: "PENDING" as const }],
    ["rejected", { status: "REJECTED" as const }],
    ["closed", { status: "CLOSED" as const }],
    ["expired", { applicationDeadline: daysFromNow(-1) }],
    ["soft-deleted", { deletedAt: daysFromNow(-1) }],
  ])("refuses to apply to a %s posting", async (_label, posting) => {
    await insertStudentProfile(pg, { userId: "user_1", ...completeProfile });
    postingId = (await insertJobPosting(pg, posting)).id;

    expect(await apply()).toEqual({ error: "JOB_CLOSED" });
    expect(await pg.$count(application)).toBe(0);
  });

  test("refuses to apply to a posting that does not exist", async () => {
    await insertStudentProfile(pg, { userId: "user_1", ...completeProfile });
    postingId = "missing";

    expect(await apply()).toEqual({ error: "JOB_CLOSED" });
  });
});
