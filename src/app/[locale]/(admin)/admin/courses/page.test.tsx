import { describe, expect, test, vi, beforeEach } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());
const mockFindManyCategories = vi.hoisted(() => vi.fn());
const mockFindManyCourses = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    courseCategory: {
      findMany: mockFindManyCategories,
    },
    course: {
      findMany: mockFindManyCourses,
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ deactivatedAt: null }),
    },
    staffPermission: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockFindManyCategories.mockReset();
    mockFindManyCourses.mockReset();
  });

  test("renders course list with edit and delete in separate forms (no nested <form> elements)", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockFindManyCategories.mockResolvedValue([
      { id: "cat_1", nameEn: "IT Courses", nameMl: null, sortOrder: 1, _count: { courses: 1 } },
    ]);

    mockFindManyCourses.mockResolvedValue([
      {
        id: "course_1",
        titleEn: "Web Dev",
        titleMl: null,
        slug: "web-dev",
        categoryId: "cat_1",
        descriptionEn: null,
        descriptionMl: null,
        durationText: "3 months",
        syllabus: null,
        certifications: [],
        careerOutcomesEn: null,
        careerOutcomesMl: null,
        coverImageUrl: null,
        featured: false,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
        category: { id: "cat_1", nameEn: "IT Courses", nameMl: null, sortOrder: 1 },
      },
    ]);

    const { default: CoursesPage } = await import("./page");
    const { renderToString } = await import("react-dom/server");

    const element = await CoursesPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

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
