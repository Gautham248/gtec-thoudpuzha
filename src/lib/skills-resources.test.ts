// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import {
  academicResource,
  candidateProfile,
  skill,
  studentCourseEnrollment,
} from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { daysFromNow, insertCourse, insertUser } from "@/__tests__/pg-fixtures";
import {
  createPENDINGSkill,
  getApprovedSkills,
  getSkillsByIds,
} from "./skills";
import { getStudentResourcePages } from "./resources";

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

beforeEach(() => truncateAll(pg));

describe("skills", () => {
  test("getApprovedSkills returns only APPROVED skills, A–Z, with the DTO fields", async () => {
    await pg.insert(skill).values([
      { label: "React", status: "APPROVED" },
      { label: "Angular", status: "APPROVED" },
      { label: "Pending thing", status: "PENDING" },
    ]);

    const skills = await getApprovedSkills();

    expect(skills.map((s) => s.label)).toEqual(["Angular", "React"]);
    expect(Object.keys(skills[0]).sort()).toEqual([
      "createdAt",
      "id",
      "label",
      "status",
    ]);
  });

  test("getSkillsByIds returns the requested skills and [] for no ids", async () => {
    const [a, , c] = await pg
      .insert(skill)
      .values([{ label: "A" }, { label: "B" }, { label: "C" }])
      .returning();

    const found = await getSkillsByIds([a.id, c.id, "missing"]);

    expect(found.map((s) => s.label).sort()).toEqual(["A", "C"]);
    expect(await getSkillsByIds([])).toEqual([]);
  });

  test("createPENDINGSkill inserts a PENDING skill and returns its DTO", async () => {
    const created = await createPENDINGSkill("Rust");

    expect(created).toMatchObject({ label: "Rust", status: "PENDING" });
    expect(created.id).toEqual(expect.any(String));
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(await pg.select().from(skill)).toHaveLength(1);
  });

  test("createPENDINGSkill rejects a duplicate label (unique constraint)", async () => {
    await createPENDINGSkill("Rust");
    await expect(createPENDINGSkill("Rust")).rejects.toThrow();
  });
});

describe("getStudentResourcePages", () => {
  async function student() {
    const user = await insertUser(pg);
    const [profile] = await pg
      .insert(candidateProfile)
      .values({ userId: user.id })
      .returning();
    return profile;
  }

  test("returns resources of the requested type for enrolled courses only, newest first", async () => {
    const profile = await student();
    const enrolled = await insertCourse(pg, { titleEn: "Enrolled" });
    const other = await insertCourse(pg, { titleEn: "Other" });
    await pg.insert(studentCourseEnrollment).values({
      studentProfileId: profile.id,
      courseId: enrolled.id,
    });
    const resource = (
      title: string,
      courseId: string,
      type: "NOTE" | "LECTURE",
      days: number,
    ) => ({
      title,
      courseId,
      type,
      fileUrl: `files/${title}`,
      uploadedAt: daysFromNow(days),
    });
    await pg
      .insert(academicResource)
      .values([
        resource("old note", enrolled.id, "NOTE", -5),
        resource("new note", enrolled.id, "NOTE", -1),
        resource("lecture", enrolled.id, "LECTURE", -1),
        resource("other course note", other.id, "NOTE", -1),
      ]);

    const { resources, enrolledCourses } = await getStudentResourcePages(
      profile.id,
      "NOTE",
    );

    expect(resources.map((r) => r.title)).toEqual(["new note", "old note"]);
    expect(enrolledCourses).toEqual([{ id: enrolled.id, titleEn: "Enrolled" }]);
  });

  test("returns empty lists for a student with no enrollments", async () => {
    const profile = await student();

    expect(await getStudentResourcePages(profile.id, "NOTE")).toEqual({
      resources: [],
      enrolledCourses: [],
    });
  });
});
