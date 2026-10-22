// @vitest-environment node
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import { Role } from "@/lib/auth";
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
import DashboardPage from "./page";

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("next/link", () => ({
  default: vi.fn(
    ({ href, children }: { href: string; children: ReactNode }): string => {
      let text = "";
      function extract(nodes: ReactNode): void {
        if (typeof nodes === "string" || typeof nodes === "number") {
          text += String(nodes);
        } else if (Array.isArray(nodes)) {
          nodes.forEach(extract);
        } else if (nodes && typeof nodes === "object" && "props" in nodes) {
          extract(
            (nodes as unknown as { props: { children: ReactNode } }).props
              .children,
          );
        }
      }
      extract(children);
      return `<a href="${href}">${text}</a>`;
    },
  ),
}));

vi.mock("lucide-react", () => ({
  Briefcase: () => "💼",
  FileText: () => "📄",
  User: () => "👤",
  Search: () => "🔍",
}));

const pg = db as unknown as TestDb;

function withAuth(role: Role | undefined, userId = "user_1") {
  mockAuth.mockResolvedValue({
    userId,
    sessionClaims: role ? { metadata: { role } } : {},
  });
}

const render = async () =>
  renderToString(
    await DashboardPage({ params: Promise.resolve({ locale: "en" }) }),
  );

async function withBiodata(fullName: string, userId = "user_1") {
  await insertUser(pg, { id: userId, role: "JOB_SEEKER" });
  return insertStudentProfile(pg, { userId, fullName });
}

describe("Job Seeker Dashboard — /portal/job-seeker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
  });

  test("1. JOB_SEEKER with biodata sees three action tiles", async () => {
    withAuth(Role.JOB_SEEKER);
    await withBiodata("Alice");

    const html = await render();

    expect(html).toContain("Browse Jobs");
    expect(html).toContain("My Applications");
    expect(html).toContain("Update Profile");
  });

  test("2. JOB_SEEKER without biodata sees 'Complete Profile' button", async () => {
    withAuth(Role.JOB_SEEKER);

    const html = await render();

    expect(html).toContain("Complete Profile");
    expect(html).not.toContain("Update Profile");
  });

  test("3. STUDENT visiting /portal/job-seeker is denied", async () => {
    withAuth(Role.STUDENT);

    const html = await render();

    expect(html).toContain("your account type");
    expect(html).toContain("Job Seeker");
    expect(html).not.toContain("Browse Jobs");
  });

  test("4. JOB_SEEKER with applications sees their 3 most recent applications", async () => {
    withAuth(Role.JOB_SEEKER);
    const profile = await withBiodata("Bob");
    const titles = [
      "Oldest Role",
      "Frontend Developer",
      "UX Designer",
      "Newest Role",
    ];
    for (const [i, title] of titles.entries()) {
      const employer = await insertEmployer(pg, {
        companyName: `Company ${i}`,
      });
      const posting = await insertJobPosting(pg, {
        employerId: employer.id,
        title,
      });
      await pg.insert(application).values({
        jobPostingId: posting.id,
        candidateProfileId: profile.id,
        status: i === 2 ? "SHORTLISTED" : "APPLIED",
        appliedAt: daysFromNow(i - 10),
      });
    }
    // Someone else's application must not show up.
    const other = await insertStudentProfile(pg);
    const otherPosting = await insertJobPosting(pg, { title: "Not Mine" });
    await pg
      .insert(application)
      .values({ jobPostingId: otherPosting.id, candidateProfileId: other.id });

    const html = await render();

    expect(html).toContain("Newest Role");
    expect(html).toContain("UX Designer");
    expect(html).toContain("Frontend Developer");
    expect(html).not.toContain("Oldest Role"); // only the 3 most recent
    expect(html).not.toContain("Not Mine");
    expect(html).toContain(">Shortlisted<");
    expect(html).toContain("View All");
  });

  test("5. tiles link to correct destinations", async () => {
    withAuth(Role.JOB_SEEKER);
    await withBiodata("Alice");

    const html = await render();

    expect(html).toContain("href=&quot;/portal/jobs&quot;");
    expect(html).toContain("href=&quot;/portal/student/applications&quot;");
    expect(html).toContain("href=&quot;/portal/student/biodata&quot;");
  });
});
