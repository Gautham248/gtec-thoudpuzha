import { beforeAll, describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { CoursesDropdown } from "./CoursesDropdown";
import type { NavCourse } from "@/lib/nav-courses";

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

vi.mock("@/lib/i18n/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const programming = { id: "cat-prog", nameEn: "Programming", nameMl: "പ്രോഗ്രാമിംഗ്", sortOrder: 1 };
const office = { id: "cat-office", nameEn: "Office & Accounting", nameMl: null, sortOrder: 2 };

function course(
  slug: string,
  titleEn: string,
  category: NavCourse["category"],
  overrides: Partial<NavCourse> = {},
): NavCourse {
  return {
    id: slug,
    slug,
    titleEn,
    titleMl: null,
    durationText: null,
    featured: false,
    coverImageUrl: null,
    summaryEn: null,
    summaryMl: null,
    category,
    ...overrides,
  };
}

const mockCourses: NavCourse[] = [
  course("python-programming", "Python Programming", programming, { titleMl: "പൈത്തൺ", durationText: "3 months" }),
  course("full-stack", "Full Stack Web Development", programming, { featured: true }),
  course("data-science", "Data Science", programming),
  course("java", "Java", programming),
  course("c-programming", "C Programming", programming),
  course("react", "React", programming),
  course("tally-erp", "Tally ERP 9", office),
  course("spoken-english", "Spoken English", null),
];

function openMenu(label = "Courses") {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(label, "i") }));
  return screen.getByRole("menu");
}

describe("CoursesDropdown", () => {
  test("renders dropdown button with label", () => {
    render(<CoursesDropdown courses={mockCourses} label="Courses" locale="en" />);
    expect(screen.getByRole("button", { name: /Courses/i })).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  test("lists categories in sort order with course counts, uncategorised last", () => {
    render(<CoursesDropdown courses={mockCourses} label="Courses" locale="en" />);
    const menu = openMenu();

    const rail = within(menu).getAllByRole("menuitem").filter((el) => el.tagName === "BUTTON");
    expect(rail.map((el) => el.textContent)).toEqual([
      "Programming6",
      "Office & Accounting1",
      "Other courses1",
    ]);
  });

  test("shows at most 5 courses for the active category with a View all link", () => {
    render(<CoursesDropdown courses={mockCourses} label="Courses" locale="en" />);
    const menu = openMenu();

    const courseLinks = within(menu)
      .getAllByRole("menuitem")
      .filter((el) => el.getAttribute("href")?.startsWith("/courses/"));
    // 5 category courses + the featured course card.
    expect(courseLinks).toHaveLength(6);
    expect(within(menu).queryByText("React")).not.toBeInTheDocument();
    expect(within(menu).getByText("3 months")).toBeInTheDocument();

    const viewAll = within(menu).getByText("View all 6 courses").closest("a");
    expect(viewAll).toHaveAttribute("href", "/courses?category=programming");
  });

  test("switches courses when hovering another category", async () => {
    render(<CoursesDropdown courses={mockCourses} label="Courses" locale="en" />);
    const menu = openMenu();

    fireEvent.mouseEnter(within(menu).getByText("Office & Accounting").closest("button")!);
    expect(await within(menu).findByText("Tally ERP 9")).toBeInTheDocument();
    expect(within(menu).queryByText("Python Programming")).not.toBeInTheDocument();
    expect(within(menu).getByText("View category").closest("a")).toHaveAttribute(
      "href",
      "/courses?category=office-accounting",
    );
  });

  test("shows the featured course card", () => {
    render(<CoursesDropdown courses={mockCourses} label="Courses" locale="en" />);
    const menu = openMenu();

    expect(within(menu).getByText("Featured course")).toBeInTheDocument();
    expect(within(menu).getAllByText("Full Stack Web Development")).toHaveLength(2);
  });

  test("uses Malayalam names when locale is ml", () => {
    render(<CoursesDropdown courses={mockCourses} label="കോഴ്സുകൾ" locale="ml" />);
    const menu = openMenu("കോഴ്സുകൾ");

    expect(within(menu).getAllByText("പ്രോഗ്രാമിംഗ്").length).toBeGreaterThan(0);
    expect(within(menu).getByText("പൈത്തൺ")).toBeInTheDocument();
    // Falls back to English when titleMl is null.
    expect(within(menu).getByText("Data Science")).toBeInTheDocument();
  });

  test("closes menu on Escape key press", async () => {
    render(<CoursesDropdown courses={mockCourses} label="Courses" locale="en" />);
    openMenu();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
