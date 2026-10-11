// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import {
  auditLogEntry,
  candidateProfile,
  jobPosting,
  skill,
} from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  form,
  insertJobPosting,
  insertStudentProfile,
  session,
} from "@/__tests__/pg-fixtures";
import { approveSkill, deleteSkill, mergeSkill } from "./actions";
import SkillsTaxonomyPage from "./page";

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

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
  await pg.insert(skill).values([
    { id: "skill_a", label: "JS", status: "PENDING" },
    { id: "skill_b", label: "JavaScript", status: "APPROVED" },
    { id: "skill_c", label: "CSS", status: "APPROVED" },
  ]);
});

const skills = async () =>
  Object.fromEntries((await pg.select().from(skill)).map((s) => [s.id, s]));
const skillIdsOf = async (table: typeof candidateProfile | typeof jobPosting) =>
  Object.fromEntries(
    (
      await pg.select({ id: table.id, skillIds: table.skillIds }).from(table)
    ).map((r) => [r.id, r.skillIds]),
  );

const denyAsJobSeeker = () =>
  mockAuth.mockResolvedValue(session("js_1", "JOB_SEEKER"));

describe("approveSkill", () => {
  test("1. Approving a PENDING skill sets status to APPROVED and audits it", async () => {
    await approveSkill(form({ id: "skill_a", locale: "en" }));

    expect((await skills()).skill_a.status).toBe("APPROVED");
    const [audit] = await pg.select().from(auditLogEntry);
    expect(audit).toMatchObject({
      action: "skill.approve",
      entityId: "skill_a",
      metadata: { label: "JS" },
    });
  });

  test("approveSkill denies job_seeker", async () => {
    denyAsJobSeeker();

    await expect(
      approveSkill(form({ id: "skill_a", locale: "en" })),
    ).rejects.toThrow("redirect:/en/forbidden");
    expect((await skills()).skill_a.status).toBe("PENDING");
  });
});

describe("mergeSkill", () => {
  const merge = () =>
    mergeSkill(
      form({ sourceId: "skill_a", targetId: "skill_b", locale: "en" }),
    );

  test("2. Merging skill A into skill B re-points all CandidateProfile references", async () => {
    const p1 = await insertStudentProfile(pg, {
      skillIds: ["skill_a", "skill_c"],
    });
    const p2 = await insertStudentProfile(pg, { skillIds: ["skill_a"] });
    const p3 = await insertStudentProfile(pg, {
      skillIds: ["skill_a", "skill_b"],
    });
    const untouched = await insertStudentProfile(pg, { skillIds: ["skill_c"] });

    await merge();

    expect(await skillIdsOf(candidateProfile)).toEqual({
      [p1.id]: ["skill_c", "skill_b"], // skill_a replaced, skill_c preserved
      [p2.id]: ["skill_b"],
      [p3.id]: ["skill_b"], // no duplicate when B was already present
      [untouched.id]: ["skill_c"],
    });
    expect(await skills()).not.toHaveProperty("skill_a");
  });

  test("3. Merging skill A into skill B re-points all JobPosting references too", async () => {
    const posting = await insertJobPosting(pg, {
      skillIds: ["skill_a", "skill_x"],
    });

    await merge();

    expect((await skillIdsOf(jobPosting))[posting.id]).toEqual([
      "skill_x",
      "skill_b",
    ]);
    expect(await skills()).not.toHaveProperty("skill_a");
    const [audit] = await pg.select().from(auditLogEntry);
    expect(audit).toMatchObject({
      action: "skill.merge",
      entityId: "skill_a",
      metadata: {
        mergedIntoId: "skill_b",
        sourceLabel: "JS",
        targetLabel: "JavaScript",
        repointedCandidateProfiles: 0,
        repointedJobPostings: 1,
      },
    });
  });

  test("merging into an unknown skill changes nothing", async () => {
    const p = await insertStudentProfile(pg, { skillIds: ["skill_a"] });

    await expect(
      mergeSkill(form({ sourceId: "skill_a", targetId: "nope", locale: "en" })),
    ).rejects.toThrow("redirect:/en/admin/skills-taxonomy");

    expect((await skillIdsOf(candidateProfile))[p.id]).toEqual(["skill_a"]);
    expect(await skills()).toHaveProperty("skill_a");
  });

  test("mergeSkill denies job_seeker", async () => {
    denyAsJobSeeker();

    await expect(merge()).rejects.toThrow("redirect:/en/forbidden");
    expect(await skills()).toHaveProperty("skill_a");
  });
});

describe("deleteSkill", () => {
  test("4. Deleting a skill with active references is blocked, suggesting merge instead", async () => {
    await insertStudentProfile(pg, { skillIds: ["skill_c"] });

    await expect(
      deleteSkill(form({ id: "skill_c", locale: "en" })),
    ).rejects.toThrow("redirect:/en/admin/skills-taxonomy");
    expect(await skills()).toHaveProperty("skill_c");
  });

  test("a job posting reference also blocks deletion", async () => {
    await insertJobPosting(pg, { skillIds: ["skill_c"] });

    await expect(
      deleteSkill(form({ id: "skill_c", locale: "en" })),
    ).rejects.toThrow("redirect:/en/admin/skills-taxonomy");
    expect(await skills()).toHaveProperty("skill_c");
  });

  test("deleteSkill succeeds when no references exist", async () => {
    await deleteSkill(form({ id: "skill_c", locale: "en" }));

    expect(await skills()).not.toHaveProperty("skill_c");
  });

  test("deleteSkill denies job_seeker", async () => {
    denyAsJobSeeker();

    await expect(
      deleteSkill(form({ id: "skill_c", locale: "en" })),
    ).rejects.toThrow("redirect:/en/forbidden");
    expect(await skills()).toHaveProperty("skill_c");
  });
});

describe("skills-taxonomy page", () => {
  test("5. /admin/skills-taxonomy is denied to a job_seeker-role user", async () => {
    denyAsJobSeeker();

    await expect(
      SkillsTaxonomyPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("shows per-skill usage counts from the grouped queries", async () => {
    await insertStudentProfile(pg, { skillIds: ["skill_b", "skill_c"] });
    await insertStudentProfile(pg, { skillIds: ["skill_b"] });
    await insertJobPosting(pg, { skillIds: ["skill_b"] });

    const { renderToString } = await import("react-dom/server");
    const html = renderToString(
      await SkillsTaxonomyPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("JavaScript");
    // JavaScript's table row: label cell, status, then 2 candidates and 1 posting.
    expect(html).toMatch(
      /JavaScript<\/td>(?:(?!<\/tr>)[\s\S])*?>2<\/td>\s*<td[^>]*>1<\/td>/,
    );
    // CSS: 1 candidate, 0 postings.
    expect(html).toMatch(
      /CSS<\/td>(?:(?!<\/tr>)[\s\S])*?>1<\/td>\s*<td[^>]*>0<\/td>/,
    );
  });
});
