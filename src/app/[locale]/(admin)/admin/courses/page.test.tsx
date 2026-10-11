// @vitest-environment node
import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertCategory, insertCourse } from "@/__tests__/pg-fixtures";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

describe("CoursesPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    await truncateAll(pg);
  });

  test("renders course list with edit and delete in separate forms (no nested <form> elements)", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    const category = await insertCategory(pg, {
      nameEn: "IT Courses",
      sortOrder: 1,
    });
    await insertCourse(pg, {
      titleEn: "Web Dev",
      slug: "web-dev",
      categoryId: category.id,
      durationText: "3 months",
      status: "DRAFT",
    });
    await insertCategory(pg, { nameEn: "Empty Category", sortOrder: 2 });

    const { default: CoursesPage } = await import("./page");
    const { renderToString } = await import("react-dom/server");

    const element = await CoursesPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("Web Dev");
    // Per-category course counts come from a grouped count() query.
    expect(html).toContain("1<!-- --> courses");
    expect(html).toContain("0<!-- --> courses");
    // Both Save (edit form) and Delete (separate form) buttons must be present
    expect(html).toContain(">Save Changes</button>");
    expect(html).toContain(">Delete</button>");

    // Verify no nested form-inside-form: count total <form> tags. A cleaned-up
    // page with 1 category row + 1 course row should have at least 4 <form> tags
    // (category create, course create, course edit, course delete).
    const formTags = html.match(/<form[\s>]/g);
    expect(formTags).not.toBeNull();
    expect(formTags!.length).toBeGreaterThanOrEqual(4);

    // Verify the course delete form is its own sibling form, not nested inside
    // the edit form. Look for a pattern: edit form's Save button, then </form>,
    // then <form, then Delete button.
    const afterSaveFormClose = html.split(">Save Changes</button>")[1] || "";
    expect(afterSaveFormClose).toMatch(/<\/form>/);
    const afterFirstFormClose = afterSaveFormClose.split("</form>")[1] || "";
    expect(afterFirstFormClose).toMatch(/<form/);
    expect(afterFirstFormClose).toContain(">Delete</button>");
  });

  test("redirects non-CENTRE_STAFF/SUPER_ADMIN to forbidden", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    const { default: CoursesPage } = await import("./page");

    await expect(
      CoursesPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
