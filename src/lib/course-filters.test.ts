import { describe, expect, test } from "vitest";
import {
  collectCategories,
  resolveCategory,
  slugifyCategory,
} from "./course-filters";

const cat = (id: string, nameEn: string, sortOrder: number) => ({
  category: { id, nameEn, nameMl: null, sortOrder },
});

const courses = [
  cat("c_it", "IT & Software", 2),
  cat("c_acc", "Accounting & Finance", 1),
  cat("c_acc", "Accounting & Finance", 1),
  cat("c_mm", "Multimedia & Design", 3),
  cat("c_web", "Web Development", 4),
  cat("c_ds", "Data Science & AI", 5),
  { category: null },
];

describe("collectCategories", () => {
  test("dedupes, counts, and orders by sortOrder", () => {
    const cats = collectCategories(courses);
    expect(cats.map((c) => c.id)).toEqual([
      "c_acc",
      "c_it",
      "c_mm",
      "c_web",
      "c_ds",
    ]);
    expect(cats[0]).toMatchObject({ slug: "accounting-finance", count: 2 });
  });
});

describe("resolveCategory", () => {
  const cats = collectCategories(courses);

  test("returns null for empty or unknown values", () => {
    expect(resolveCategory(undefined, cats)).toBeNull();
    expect(resolveCategory("", cats)).toBeNull();
    expect(resolveCategory("cooking", cats)).toBeNull();
  });

  test("matches our own slugs and ids", () => {
    expect(resolveCategory("it-software", cats)?.id).toBe("c_it");
    expect(resolveCategory("c_mm", cats)?.id).toBe("c_mm");
  });

  test.each([
    ["accounting", "c_acc"],
    ["it-software", "c_it"],
    ["multimedia", "c_mm"],
    ["web-dev", "c_web"],
    ["datascience", "c_ds"],
  ])("home strip link %s resolves to %s", (param, id) => {
    expect(resolveCategory(param, cats)?.id).toBe(id);
  });

  test("slugify strips ampersands and punctuation", () => {
    expect(slugifyCategory("Data Science & AI")).toBe("data-science-ai");
  });
});
