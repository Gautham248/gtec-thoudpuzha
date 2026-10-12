// @vitest-environment node
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { application } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  daysFromNow,
  insertEmployer,
  insertJobPosting,
  insertStudentProfile,
  insertUser,
} from "@/__tests__/pg-fixtures";
import EmployerDashboardPage from "./page";

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

const render = async () =>
  renderToString(
    await EmployerDashboardPage({ params: Promise.resolve({ locale: "en" }) }),
  );

async function signedInEmployer(
  userId: string,
  companyName: string,
  status: "APPROVED" | "PENDING" = "APPROVED",
) {
  await insertUser(pg, { id: userId, role: "EMPLOYER" });
  mockAuth.mockResolvedValue({
    userId,
    sessionClaims: { metadata: { role: "EMPLOYER" } },
  });
  return insertEmployer(pg, { userId, companyName, status });
}

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
});

describe("Employer Dashboard — own postings only", () => {
  test("5. Dashboard lists only this employer's own, non-deleted postings with applicant counts", async () => {
    const me = await signedInEmployer("user_emp_1", "Acme Corp");
    const rival = await insertEmployer(pg, { companyName: "Rival Ltd" });
    const swe = await insertJobPosting(pg, {
      employerId: me.id,
      title: "Software Engineer",
      createdAt: daysFromNow(-2),
    });
    await insertJobPosting(pg, {
      employerId: me.id,
      title: "DevOps Engineer",
      status: "PENDING",
      createdAt: daysFromNow(-1),
    });
    await insertJobPosting(pg, {
      employerId: me.id,
      title: "Deleted Role",
      deletedAt: new Date(),
    });
    await insertJobPosting(pg, { employerId: rival.id, title: "Rival Role" });
    for (let i = 0; i < 3; i++) {
      const candidate = await insertStudentProfile(pg);
      await pg
        .insert(application)
        .values({ jobPostingId: swe.id, candidateProfileId: candidate.id });
    }

    const html = await render();

    expect(html).toContain("Software Engineer");
    expect(html).toContain("DevOps Engineer");
    expect(html).toContain("Acme Corp");
    expect(html).not.toContain("Deleted Role");
    expect(html).not.toContain("Rival Role");
    // Newest first
    expect(html.indexOf("DevOps Engineer")).toBeLessThan(
      html.indexOf("Software Engineer"),
    );
    // Per-posting applicant counts from the grouped count() query
    expect(html).toContain("3 applicant");
    expect(html).toContain("0 applicant");
  });

  test("Dashboard shows empty state when no postings exist", async () => {
    await signedInEmployer("user_emp_2", "Empty Co");

    const html = await render();

    expect(html).toContain("No job postings yet");
    expect(html).toContain("Post your first vacancy");
  });

  test("a pending employer is sent to the registration status page", async () => {
    await signedInEmployer("user_emp_3", "Waiting Co", "PENDING");

    await expect(render()).rejects.toThrow(
      "redirect:/portal/employer/register/status",
    );
  });

  test("an employer without a profile is sent to registration", async () => {
    await insertUser(pg, { id: "user_emp_4", role: "EMPLOYER" });
    mockAuth.mockResolvedValue({
      userId: "user_emp_4",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    await expect(render()).rejects.toThrow(
      "redirect:/portal/employer/register",
    );
  });
});
