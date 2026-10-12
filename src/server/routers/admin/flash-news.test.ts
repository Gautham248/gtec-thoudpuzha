// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { auditLogEntry, flashNewsItem } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertStaff, session } from "@/__tests__/pg-fixtures";
import { api } from "@/server/action";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockRevalidateTag = vi.hoisted(() => vi.fn());

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: mockRevalidateTag,
}));

const pg = db as unknown as TestDb;
const flashNews = () => api().admin.flashNews;
const items = () =>
  pg.query.flashNewsItem.findMany({
    orderBy: (f, { asc }) => asc(f.sortOrder),
  });

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  await insertStaff(pg, "staff_1");
  mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
});

describe("admin.flashNews", () => {
  test("rejects users who are not staff", async () => {
    mockAuth.mockResolvedValue(session("student_1", "STUDENT"));

    await expect(flashNews().create({ textEn: "Hi" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "forbidden",
    });
    expect(await items()).toEqual([]);
  });

  test("create appends the item last, audits it and revalidates", async () => {
    await flashNews().create({ textEn: "First" });
    await flashNews().create({
      textEn: "Second",
      textMl: "",
      expiresAt: "2030-01-01",
      locale: "ml",
    });

    const [first, second] = await items();
    expect(first).toMatchObject({ textEn: "First", sortOrder: 1 });
    expect(second).toMatchObject({
      textEn: "Second",
      textMl: null,
      sortOrder: 2,
      expiresAt: new Date("2030-01-01"),
    });
    expect(await pg.select().from(auditLogEntry)).toHaveLength(2);
    expect(mockRevalidateTag).toHaveBeenCalledWith("flash-news", "max");
    expect(mockRevalidatePath).toHaveBeenLastCalledWith("/ml/admin/flash-news");
  });

  test("accepts the FormData a <form> posts", async () => {
    const fd = new FormData();
    fd.set("textEn", "From a form");
    await flashNews().create(fd);

    expect((await items())[0].textEn).toBe("From a form");
  });

  test("update reads an unchecked 'active' checkbox as false", async () => {
    await flashNews().create({ textEn: "Item" });
    const [item] = await items();

    await flashNews().update({ id: item.id, textEn: "Edited" });

    expect((await items())[0]).toMatchObject({
      textEn: "Edited",
      active: false,
    });
  });

  test("update and delete of a missing item fail", async () => {
    await expect(
      flashNews().update({ id: "missing", textEn: "x" }),
    ).rejects.toThrow("Flash news item not found");
    await expect(flashNews().delete({ id: "missing" })).rejects.toThrow(
      "Flash news item not found",
    );
  });

  test("setActive and move", async () => {
    await flashNews().create({ textEn: "A" });
    await flashNews().create({ textEn: "B" });
    const [a] = await items();

    await flashNews().setActive({ id: a.id, active: "false" });
    await flashNews().move({ id: a.id, direction: "down" });

    expect((await items()).map((i) => [i.textEn, i.active])).toEqual([
      ["B", true],
      ["A", false],
    ]);
  });

  test("rejects input of the wrong shape", async () => {
    await expect(
      flashNews().move({ id: "x", direction: "sideways" as "up" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(pg.select().from(flashNewsItem)).resolves.toEqual([]);
  });
});
