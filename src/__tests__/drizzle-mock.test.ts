// @vitest-environment node
import { describe, expect, test } from "vitest";
import { createMockDb, failMockQuery, setMockRows } from "./drizzle-mock";

const d = (iso: string) => new Date(iso);

describe("drizzle-mock", () => {
  test("filters, orders (Postgres null ordering), limits and picks columns", async () => {
    const db = createMockDb();
    setMockRows(db, "newsEvent", [
      { id: "a", slug: "a", type: "NEWS", publishedAt: d("2026-01-01") },
      { id: "b", slug: "b", type: "NEWS", publishedAt: null },
      { id: "c", slug: "c", type: "EVENT", publishedAt: d("2026-03-01") },
      { id: "d", slug: "d", type: "NEWS", publishedAt: d("2026-02-01") },
    ]);

    const published = await db.query.newsEvent.findMany({
      where: (n, { isNotNull }) => isNotNull(n.publishedAt),
      orderBy: (n, { desc }) => desc(n.publishedAt),
      columns: { slug: true },
    });
    expect(published).toEqual([{ slug: "c" }, { slug: "d" }, { slug: "a" }]);

    const descAll = await db.query.newsEvent.findMany({
      orderBy: (n, { desc }) => desc(n.publishedAt),
      columns: { slug: true },
    });
    expect(descAll[0]).toEqual({ slug: "b" }); // NULLS FIRST on DESC

    const ascAll = await db.query.newsEvent.findMany({
      orderBy: (n, { asc }) => asc(n.publishedAt),
      columns: { slug: true },
      limit: 4,
    });
    expect(ascAll.at(-1)).toEqual({ slug: "b" }); // NULLS LAST on ASC

    const news = await db.query.newsEvent.findMany({
      where: (n, { and, eq, isNotNull }) => and(eq(n.type, "NEWS"), isNotNull(n.publishedAt)),
      limit: 1,
      orderBy: (n, { desc }) => desc(n.publishedAt),
    });
    expect(news).toHaveLength(1);
    expect(news[0].slug).toBe("d");
    // Without `columns`, every schema column is present (unset ones as null).
    expect(news[0]).toHaveProperty("bodyEn", null);
  });

  test("returns relations only when requested via `with`, applying nested options", async () => {
    const db = createMockDb();
    setMockRows(db, "galleryCategory", [
      {
        id: "g1",
        slug: "events",
        sortOrder: 1,
        items: [
          { id: "i2", sortOrder: 2, url: "b" },
          { id: "i1", sortOrder: 1, url: "a" },
          { id: "i3", sortOrder: 3, url: "c" },
        ],
      },
    ]);

    const plain = await db.query.galleryCategory.findFirst({});
    expect(plain).not.toHaveProperty("items");

    const withItems = await db.query.galleryCategory.findFirst({
      where: (c, { eq }) => eq(c.slug, "events"),
      with: { items: { orderBy: (i, { asc }) => asc(i.sortOrder), limit: 2 } },
    });
    expect((withItems!.items as { id: string }[]).map((i) => i.id)).toEqual(["i1", "i2"]);
  });

  test("findFirst returns undefined when nothing matches; failures reject", async () => {
    const db = createMockDb();
    expect(
      await db.query.course.findFirst({ where: (c, { eq }) => eq(c.slug, "x") }),
    ).toBeUndefined();

    failMockQuery(db, "course");
    await expect(db.query.course.findMany()).rejects.toThrow("db down");
  });

  test("supports or / ne / gt / notInArray", async () => {
    const db = createMockDb();
    const now = d("2026-06-01");
    setMockRows(db, "flashNewsItem", [
      { id: "1", active: true, expiresAt: null },
      { id: "2", active: true, expiresAt: d("2026-07-01") },
      { id: "3", active: true, expiresAt: d("2026-05-01") },
      { id: "4", active: false, expiresAt: null },
    ]);
    const live = await db.query.flashNewsItem.findMany({
      where: (f, { and, eq, gt, isNull, or }) =>
        and(eq(f.active, true), or(isNull(f.expiresAt), gt(f.expiresAt, now))),
      columns: { id: true },
    });
    expect(live).toEqual([{ id: "1" }, { id: "2" }]);

    const others = await db.query.flashNewsItem.findMany({
      where: (f, { and, ne, notInArray }) => and(ne(f.id, "1"), notInArray(f.id, ["2"])),
      columns: { id: true },
    });
    expect(others).toEqual([{ id: "3" }, { id: "4" }]);
  });
});
