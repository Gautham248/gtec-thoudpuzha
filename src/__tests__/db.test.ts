// @vitest-environment node
// Basic schema/driver checks for the Drizzle client, against an in-memory
// Postgres (never the real database in DATABASE_URL).
import { beforeEach, describe, expect, test, vi } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { candidateProfile, user } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

beforeEach(() => truncateAll(pg));

describe("Drizzle client", () => {
  test("can connect and run a trivial query", async () => {
    const result = await pg.execute<{ one: number }>(sql`SELECT 1 as one`);
    expect(result.rows).toEqual([{ one: 1 }]);
  });
});

describe("Role enum values", () => {
  const roles = [
    "STUDENT",
    "JOB_SEEKER",
    "EMPLOYER",
    "CENTRE_STAFF",
    "SUPER_ADMIN",
  ] as const;

  test.each(roles)("User can be created with role %s", async (role) => {
    const [created] = await pg
      .insert(user)
      .values({ id: `test-user-${role}`, role })
      .returning();

    expect(created).toMatchObject({
      id: `test-user-${role}`,
      role,
      languagePreference: "en",
    });
  });

  test("an unknown role is rejected by the database", async () => {
    await expect(
      pg.execute(sql`insert into "User" (id, role) values ('x', 'NOT_A_ROLE')`),
    ).rejects.toThrow();
  });
});

describe("CandidateProfile", () => {
  test("can be created linked to a User, with isVerifiedStudent defaulting to false", async () => {
    await pg.insert(user).values({ id: "test-cp-user", role: "STUDENT" });

    const [profile] = await pg
      .insert(candidateProfile)
      .values({ userId: "test-cp-user" })
      .returning();

    expect(profile.userId).toBe("test-cp-user");
    expect(profile.isVerifiedStudent).toBe(false);
    expect(profile.profileVisible).toBe(true);
    expect(profile.skillIds).toEqual([]);

    const loaded = await pg.query.candidateProfile.findFirst({
      where: eq(candidateProfile.id, profile.id),
      with: { user: true },
    });
    expect(loaded?.user.role).toBe("STUDENT");
  });

  test("requires an existing User (foreign key)", async () => {
    await expect(
      pg.insert(candidateProfile).values({ userId: "missing" }),
    ).rejects.toThrow();
  });
});
