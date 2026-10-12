// @vitest-environment node
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { application } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  insertEmployer,
  insertJobPosting,
  insertStudentProfile,
  insertUser,
} from "@/__tests__/pg-fixtures";
import ApplicantsPage from "./page";

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
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const pg = db as unknown as TestDb;

const render = (postingId: string) =>
  ApplicantsPage({ params: Promise.resolve({ postingId, locale: "en" }) }).then(
    (el) => renderToString(el),
  );

let myPostingId: string;
let otherPostingId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  await insertUser(pg, { id: "user_emp_1", role: "EMPLOYER" });
  const me = await insertEmployer(pg, {
    userId: "user_emp_1",
    companyName: "Tech Corp",
  });
  const rival = await insertEmployer(pg, { companyName: "Rival Ltd" });
  myPostingId = (
    await insertJobPosting(pg, {
      employerId: me.id,
      title: "Software Engineer",
    })
  ).id;
  otherPostingId = (
    await insertJobPosting(pg, { employerId: rival.id, title: "Rival Role" })
  ).id;
  mockAuth.mockResolvedValue({
    userId: "user_emp_1",
    sessionClaims: { metadata: { role: "EMPLOYER" } },
  });
});

async function applicant(
  postingId: string,
  fullName: string,
  status: "APPLIED" | "VIEWED" | "SHORTLISTED",
) {
  const candidate = await insertStudentProfile(pg, {
    fullName,
    email: `${fullName}@example.com`,
  });
  const [row] = await pg
    .insert(application)
    .values({
      jobPostingId: postingId,
      candidateProfileId: candidate.id,
      status,
    })
    .returning();
  return row;
}

describe("Employer Applicants Page — isolation & auto-transition", () => {
  test("3. employer sees only applicants to THEIR posting", async () => {
    await applicant(myPostingId, "John Doe", "VIEWED");
    await applicant(myPostingId, "Jane Smith", "SHORTLISTED");
    await applicant(otherPostingId, "Someone Else", "APPLIED");

    const html = await render(myPostingId);

    expect(html).toContain("Software Engineer");
    expect(html).toContain("John Doe");
    expect(html).toContain("Jane Smith");
    expect(html).not.toContain("Someone Else");
  });

  test("3. employer does NOT see applicants to another employer's posting", async () => {
    await applicant(otherPostingId, "Someone Else", "APPLIED");

    await expect(render(otherPostingId)).rejects.toThrow(
      "redirect:/portal/employer",
    );
  });

  test("4. viewing APPLIED applicants transitions them to VIEWED automatically", async () => {
    const fresh = await applicant(myPostingId, "John Doe", "APPLIED");
    const shortlisted = await applicant(
      myPostingId,
      "Jane Smith",
      "SHORTLISTED",
    );
    const elsewhere = await applicant(
      otherPostingId,
      "Someone Else",
      "APPLIED",
    );

    const html = await render(myPostingId);

    expect(html).toContain("VIEWED");
    expect(html).not.toContain(">APPLIED<");
    const byId = Object.fromEntries(
      (await pg.select().from(application)).map((a) => [a.id, a]),
    );
    expect(byId[fresh.id].status).toBe("VIEWED");
    expect(byId[fresh.id].statusUpdatedAt.getTime()).toBeGreaterThanOrEqual(
      fresh.statusUpdatedAt.getTime(),
    );
    expect(byId[shortlisted.id].status).toBe("SHORTLISTED"); // only APPLIED moves
    expect(byId[elsewhere.id].status).toBe("APPLIED"); // other postings untouched
  });
});
