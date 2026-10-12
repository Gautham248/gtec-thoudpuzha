// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { db } from "@/db";
import { application } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  insertEmployer,
  insertJobPosting,
  insertStudentProfile,
  insertUser,
  session,
} from "@/__tests__/pg-fixtures";
import StudentApplicationsPage from "./page";

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));

const pg = db as unknown as TestDb;

const render = async () =>
  renderToString(
    await StudentApplicationsPage({
      params: Promise.resolve({ locale: "en" }),
    }),
  );

async function candidate(
  userId: string,
  role: "STUDENT" | "JOB_SEEKER" = "STUDENT",
) {
  await insertUser(pg, { id: userId, role });
  return insertStudentProfile(pg, { userId });
}

async function apply(
  candidateProfileId: string,
  title: string,
  companyName: string,
  status: "APPLIED" | "SHORTLISTED" = "APPLIED",
  appliedAt = new Date("2026-07-22"),
) {
  const employer = await insertEmployer(pg, { companyName });
  const posting = await insertJobPosting(pg, {
    employerId: employer.id,
    title,
  });
  await pg
    .insert(application)
    .values({
      jobPostingId: posting.id,
      candidateProfileId,
      status,
      appliedAt,
    });
}

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
});

describe("Student Applications Page — isolation", () => {
  test("2. candidate sees only their own applications, newest first", async () => {
    const me = await candidate("user_candidate_1");
    const other = await candidate("user_candidate_2", "JOB_SEEKER");
    await apply(
      me.id,
      "Software Engineer",
      "Tech Corp",
      "APPLIED",
      new Date("2026-07-20"),
    );
    await apply(
      me.id,
      "DevOps Engineer",
      "Startup Inc",
      "SHORTLISTED",
      new Date("2026-07-22"),
    );
    await apply(other.id, "Secret Role", "Other Co");
    mockAuth.mockResolvedValue(session("user_candidate_1", "STUDENT"));

    const html = await render();

    expect(html).toContain("Software Engineer");
    expect(html).toContain("DevOps Engineer");
    expect(html).toContain("Tech Corp");
    expect(html).toContain("Startup Inc");
    expect(html).toContain("APPLIED");
    expect(html).toContain("SHORTLISTED");
    expect(html).not.toContain("Secret Role");
    expect(html.indexOf("DevOps Engineer")).toBeLessThan(
      html.indexOf("Software Engineer"),
    );
  });

  test("2. candidate does NOT see another candidate's applications", async () => {
    const first = await candidate("user_candidate_1");
    await candidate("user_candidate_2", "JOB_SEEKER");
    await apply(first.id, "Software Engineer", "Tech Corp");
    mockAuth.mockResolvedValue(session("user_candidate_2", "JOB_SEEKER"));

    const html = await render();

    expect(html).toContain("haven&#x27;t applied to any jobs yet");
    expect(html).not.toContain("Software Engineer");
  });

  test("shows empty state when candidate has no applications", async () => {
    await candidate("user_no_apps", "JOB_SEEKER");
    mockAuth.mockResolvedValue(session("user_no_apps", "JOB_SEEKER"));

    const html = await render();

    expect(html).toContain("haven&#x27;t applied to any jobs yet");
    expect(html).toContain("Browse Jobs");
  });

  test("asks for a biodata when the user has no profile yet", async () => {
    await insertUser(pg, { id: "user_new", role: "STUDENT" });
    mockAuth.mockResolvedValue(session("user_new", "STUDENT"));

    const html = await render();

    expect(html).toContain("/portal/student/biodata");
  });
});
