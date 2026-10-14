// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, truncateAll, type TestDb } from "./pg-test-db";
import { course, siteSettings, user, whyChooseUsCard } from "@/db/schema";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => truncateAll(db));

describe("pg-test-db", () => {
  test("applies schema defaults: cuid id, list [], timestamps", async () => {
    const [row] = await db
      .insert(course)
      .values({ slug: "s", titleEn: "T" })
      .returning();

    expect(row.id).toMatch(/^[a-z0-9]{24,}$/);
    expect(row.certifications).toEqual([]);
    expect(row.status).toBe("DRAFT");
    expect(row.createdAt).toBeInstanceOf(Date);
    expect(row.updatedAt).toBeInstanceOf(Date);
  });

  test("bumps updatedAt on update, like Prisma's @updatedAt", async () => {
    const [row] = await db
      .insert(course)
      .values({ slug: "s", titleEn: "T" })
      .returning();
    await new Promise((r) => setTimeout(r, 5));
    const [updated] = await db
      .update(course)
      .set({ titleEn: "T2" })
      .where(eq(course.id, row.id))
      .returning();

    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      row.updatedAt.getTime(),
    );
  });

  test("supports upserts and relational reads", async () => {
    await db.insert(user).values({ id: "u1", role: "STUDENT" });
    await db
      .insert(user)
      .values({ id: "u1", role: "CENTRE_STAFF" })
      .onConflictDoUpdate({ target: user.id, set: { role: "CENTRE_STAFF" } });
    expect((await db.query.user.findFirst())?.role).toBe("CENTRE_STAFF");

    const [s] = await db.insert(siteSettings).values({}).returning();
    await db.insert(whyChooseUsCard).values([
      {
        siteSettingsId: s.id,
        titleEn: "B",
        descriptionEn: "",
        icon: "AWARD",
        sortOrder: 2,
      },
      {
        siteSettingsId: s.id,
        titleEn: "A",
        descriptionEn: "",
        icon: "AWARD",
        sortOrder: 1,
      },
    ]);
    const withCards = await db.query.siteSettings.findFirst({
      with: { whyChooseUsCards: { orderBy: (c, { asc }) => asc(c.sortOrder) } },
    });
    expect(withCards?.whyChooseUsCards.map((c) => c.titleEn)).toEqual([
      "A",
      "B",
    ]);
  });

  test("enforces foreign keys", async () => {
    await expect(
      db.insert(whyChooseUsCard).values({
        siteSettingsId: "missing",
        titleEn: "x",
        descriptionEn: "",
        icon: "AWARD",
      }),
    ).rejects.toThrow();
  });
});
