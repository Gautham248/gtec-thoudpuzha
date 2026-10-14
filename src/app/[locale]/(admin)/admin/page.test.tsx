// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { db } from "@/db";
import { enquiry, employerProfile, jobPosting, skill } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  insertCourse,
  insertEmployer,
  insertJobPosting,
  insertStaff,
  session,
} from "@/__tests__/pg-fixtures";
import AdminDashboardPage from "./page";

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
    await AdminDashboardPage({ params: Promise.resolve({ locale: "en" }) }),
  );

/** The stat card for `label`: the number rendered just before/after it. */
const statNear = (html: string, label: string) => {
  const at = html.indexOf(label);
  return html.slice(Math.max(0, at - 400), at + 400);
};

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  // Every CENTRE_STAFF test signs in as staff_1, who may moderate everything.
  await insertStaff(pg, "staff_1", {
    canApproveEmployers: true,
    canApproveJobPostings: true,
    canModerateSkillsTaxonomy: true,
  });
  mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
});

describe("AdminDashboardPage", () => {
  test("redirects to forbidden for non-admin roles", async () => {
    mockAuth.mockResolvedValue(session("employer_1", "EMPLOYER"));

    await expect(render()).rejects.toThrow("redirect:/en/forbidden");
  });

  test("shows pending employer registration count matching PENDING EmployerProfile rows", async () => {
    for (let i = 0; i < 3; i++) await insertEmployer(pg, { status: "PENDING" });
    await insertEmployer(pg, { status: "APPROVED" });

    const html = await render();

    expect(html).toContain("Pending Employer Registrations");
    expect(statNear(html, "Pending Employer Registrations")).toMatch(/>3</);
    expect(await pg.$count(employerProfile)).toBe(4);
  });

  test("shows pending job posting count matching PENDING JobPosting rows", async () => {
    for (let i = 0; i < 5; i++)
      await insertJobPosting(pg, { status: "PENDING" });
    await insertJobPosting(pg, { status: "APPROVED" });

    const html = await render();

    expect(html).toContain("Pending Job Postings");
    expect(statNear(html, "Pending Job Postings")).toMatch(/>5</);
    expect(await pg.$count(jobPosting)).toBe(6);
  });

  test("counts pending skills", async () => {
    await pg.insert(skill).values([
      { label: "A", status: "PENDING" },
      { label: "B", status: "PENDING" },
      { label: "C", status: "APPROVED" },
    ]);

    const html = await render();

    expect(statNear(html, "Pending Skills Taxonomy")).toMatch(/>2</);
  });

  test("recent enquiries list shows the 5 most recent Enquiry rows, newest first", async () => {
    const course = await insertCourse(pg, {
      titleEn: "Diploma in Computer Application",
    });
    const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
    await pg.insert(enquiry).values(
      names.map((name, daysAgo) => ({
        name,
        phone: "9876543210",
        courseId: course.id,
        source: "homepage-hero",
        createdAt: new Date(Date.UTC(2026, 6, 1 - (daysAgo + 1))),
      })),
    );

    const html = await render();

    expect(html).not.toContain("Frank"); // oldest of 6 — only 5 shown
    const positions = names.slice(0, 5).map((n) => html.indexOf(n));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions); // newest first
    expect(html).toContain("Diploma in Computer Application");
  });

  test("shows a role-based welcome", async () => {
    let html = await render();
    expect(html).toContain("Welcome");
    expect(html).toContain("Staff");

    mockAuth.mockResolvedValue(session("super_admin_1", "SUPER_ADMIN"));
    html = await render();
    expect(html).toContain("Welcome");
    expect(html).toContain("Super Admin");
  });

  test("audit-log quick link button is visible to super_admin but not to centre_staff", async () => {
    mockAuth.mockResolvedValue(session("super_admin_1", "SUPER_ADMIN"));
    let html = await render();

    // Super Admin sees both the explicit "View Audit Log" button and the Audit Log card
    expect(html).toContain("View Audit Log");
    expect(html).toContain("audit-log");
    expect(html).toContain("Site Settings");
    expect(html).toContain("Staff Management");

    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
    html = await render();

    // The explicit "View Audit Log" button still requires isSuperAdmin
    expect(html).not.toContain("View Audit Log");
    // Audit Log card shows for all staff (unrestricted route)
    expect(html).toContain("Audit Log");
    // Super admin cards show as greyed-out "No access" cards
    expect(html).toContain("Site Settings");
    expect(html).toContain("Staff Management");
    expect(html).toContain("No access");
  });
});
