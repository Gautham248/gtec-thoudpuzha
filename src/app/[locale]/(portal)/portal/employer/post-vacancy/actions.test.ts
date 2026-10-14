// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { jobPosting } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertEmployer, insertUser } from "@/__tests__/pg-fixtures";
import { submitVacancy } from "./actions";

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

const pg = db as unknown as TestDb;

function validFormData(overrides?: Record<string, string>): FormData {
  const fd = new FormData();
  fd.set("title", overrides?.title ?? "Software Engineer");
  fd.set("department", overrides?.department ?? "Engineering");
  fd.set("salaryMin", overrides?.salaryMin ?? "50000");
  fd.set("salaryMax", overrides?.salaryMax ?? "80000");
  fd.set("salaryVisibility", overrides?.salaryVisibility ?? "DISCLOSE");
  fd.set("jobType", overrides?.jobType ?? "FULL_TIME");
  fd.set("skillIds", overrides?.skillIds ?? '["skill_1","skill_2"]');
  fd.set("applicationDeadline", overrides?.applicationDeadline ?? "2026-12-31");
  fd.set("description", overrides?.description ?? "Great job opportunity");
  return fd;
}

async function signedInEmployer(
  status: "APPROVED" | "PENDING" | "REJECTED",
  autoPublishTrusted = false,
) {
  await insertUser(pg, { id: "user_emp_1", role: "EMPLOYER" });
  mockAuth.mockResolvedValue({
    userId: "user_emp_1",
    sessionClaims: { metadata: { role: "EMPLOYER" } },
  });
  return insertEmployer(pg, {
    userId: "user_emp_1",
    status,
    autoPublishTrusted,
  });
}

const postings = () => pg.select().from(jobPosting);

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("submitVacancy — auto-publish branching and salary visibility", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
  });

  test("2. Approved but non-trusted employer gets status=PENDING and autoPublished=false", async () => {
    const employer = await signedInEmployer("APPROVED", false);

    await expect(submitVacancy(validFormData())).rejects.toThrow(
      "redirect:/portal/employer",
    );

    expect(await postings()).toEqual([
      expect.objectContaining({
        employerId: employer.id,
        title: "Software Engineer",
        department: "Engineering",
        jobType: "FULL_TIME",
        skillIds: ["skill_1", "skill_2"],
        description: "Great job opportunity",
        status: "PENDING",
        autoPublished: false,
      }),
    ]);
  });

  test("3. Approved AND trusted employer gets status=APPROVED and autoPublished=true", async () => {
    await signedInEmployer("APPROVED", true);

    await expect(submitVacancy(validFormData())).rejects.toThrow(
      "redirect:/portal/employer",
    );

    expect(await postings()).toEqual([
      expect.objectContaining({ status: "APPROVED", autoPublished: true }),
    ]);
  });

  test("4. Salary visibility DISCLOSE persists correctly", async () => {
    await signedInEmployer("APPROVED");

    await expect(
      submitVacancy(validFormData({ salaryVisibility: "DISCLOSE" })),
    ).rejects.toThrow("redirect:");

    expect(await postings()).toEqual([
      expect.objectContaining({
        salaryVisibility: "DISCLOSE",
        salaryMin: 50000,
        salaryMax: 80000,
      }),
    ]);
  });

  test("4b. Salary visibility PRIVATE persists correctly", async () => {
    await signedInEmployer("APPROVED");

    await expect(
      submitVacancy(validFormData({ salaryVisibility: "PRIVATE" })),
    ).rejects.toThrow("redirect:");

    expect(await postings()).toEqual([
      expect.objectContaining({ salaryVisibility: "PRIVATE" }),
    ]);
  });

  test.each(["PENDING", "REJECTED"] as const)(
    "1. Non-approved (%s) employer is blocked from submitting (redirects to status)",
    async (status) => {
      await signedInEmployer(status);

      await expect(submitVacancy(validFormData())).rejects.toThrow(
        "redirect:/portal/employer/register/status",
      );
      expect(await postings()).toHaveLength(0);
    },
  );
});
