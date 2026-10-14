// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { candidateProfile } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertUser, session } from "@/__tests__/pg-fixtures";
import { getCurrentProfile, saveBiodata, submitBiodataForm } from "./actions";

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
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

const pg = db as unknown as TestDb;

const validData = {
  courseCompletedIds: [],
  certificationIds: [],
  languagesKnown: [],
  skillIds: [],
};

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  await insertUser(pg, { id: "user_1", role: "STUDENT" });
  mockAuth.mockResolvedValue(session("user_1", "STUDENT"));
});

const profiles = () => pg.select().from(candidateProfile);

describe("submitBiodataForm", () => {
  test("redirects STUDENT to /portal/student after save", async () => {
    await expect(submitBiodataForm(validData)).rejects.toThrow(
      "redirect:/portal/student",
    );
    expect(await profiles()).toHaveLength(1);
  });

  test("still persists the profile via saveBiodata's underlying logic", async () => {
    await expect(
      submitBiodataForm({ ...validData, fullName: "Alice" }),
    ).rejects.toThrow("redirect:");

    expect(await profiles()).toEqual([
      expect.objectContaining({
        userId: "user_1",
        fullName: "Alice",
        profileVisible: true,
      }),
    ]);
  });
});

describe("saveBiodata", () => {
  test("creates the profile on first save, then updates the same row", async () => {
    const first = await saveBiodata({
      ...validData,
      fullName: "Alice",
      skillIds: ["s1"],
      dateOfBirth: "2000-01-15",
    });

    const second = await saveBiodata({
      ...validData,
      fullName: "Alice Updated",
      skillIds: ["s1", "s2"],
      profileVisible: false,
    });

    const rows = await profiles();
    expect(rows).toHaveLength(1);
    expect(second.id).toBe(first.id);
    expect(rows[0]).toMatchObject({
      fullName: "Alice Updated",
      skillIds: ["s1", "s2"],
      profileVisible: false,
      dateOfBirth: null, // omitted on the second save → cleared, as before
    });
    // Like Prisma's upsert, the update path bumps updatedAt.
    expect(rows[0].updatedAt.getTime()).toBeGreaterThanOrEqual(
      first.updatedAt.getTime(),
    );
  });

  test("is forbidden to employers", async () => {
    mockAuth.mockResolvedValue(session("emp_1", "EMPLOYER"));

    await expect(saveBiodata(validData)).rejects.toThrow("Forbidden");
    expect(await profiles()).toHaveLength(0);
  });

  test("getCurrentProfile returns null before a profile exists, then the profile", async () => {
    expect(await getCurrentProfile()).toBeNull();

    await saveBiodata({ ...validData, fullName: "Alice" });

    expect(await getCurrentProfile()).toMatchObject({
      userId: "user_1",
      fullName: "Alice",
    });
  });
});
