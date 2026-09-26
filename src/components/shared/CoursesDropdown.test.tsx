import { describe, expect, test, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { CoursesDropdown, MobileCoursesMenu } from "./CoursesDropdown";
import type { NavCourse } from "@/lib/nav-courses";

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

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

const itCat = {
  id: "cat_it",
  nameEn: "IT & Software",
  nameMl: null,
  sortOrder: 2,
};
const acc = {
  id: "cat_acc",
  nameEn: "Accounting",
  nameMl: "അക്കൗണ്ടിംഗ്",
  sortOrder: 1,
};

function course(
  slug: string,
  titleEn: string,
  overrides: Partial<NavCourse> = {},
): NavCourse {
  return {
    slug,
    titleEn,
    titleMl: null,
    durationText: null,
    featured: false,
    coverImageUrl: null,
    summaryEn: null,
    summaryMl: null,
    category: null,
    ...overrides,
  };
}

const mockCourses: NavCourse[] = [
  course("python-programming", "Python Programming", {
    titleMl: "പൈത്തൺ",
    category: itCat,
    durationText: "3 Months",
  }),
  course("full-stack", "Full Stack Web Development", { category: itCat }),
  course("tally-erp", "Tally ERP 9", { category: acc, featured: true }),
  course("spoken-english", "Spoken English"),
];

function openMenu(label = /Courses/i) {
  const button = screen.getByRole("button", { name: label });
  fireEvent.click(button);
  const panelId = button.getAttribute("aria-controls");
  return document.getElementById(panelId!)!;
}

describe("CoursesDropdown", () => {
  test("renders a collapsed trigger", () => {
    render(
      <CoursesDropdown courses={mockCourses} label="Courses" locale="en" />,
    );
    const button = screen.getByRole("button", { name: /Courses/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("groups courses by category in sortOrder, uncategorised last", () => {
    render(
      <CoursesDropdown courses={mockCourses} label="Courses" locale="en" />,
    );
    const panel = openMenu();

    const headings = Array.from(panel.querySelectorAll("h3")).map(
      (h) => h.textContent,
    );
    expect(headings).toEqual(["Accounting", "IT & Software", "Other courses"]);
    expect(screen.getByText("Python Programming")).toBeInTheDocument();
    expect(screen.getByText("3 Months")).toBeInTheDocument();
    expect(screen.getByText("All courses (4)")).toBeInTheDocument();
  });

  test("features the course flagged as featured", () => {
    render(
      <CoursesDropdown courses={mockCourses} label="Courses" locale="en" />,
    );
    const panel = openMenu();
    const featuredLinks = panel.querySelectorAll(
      'a[href="/courses/tally-erp"]',
    );
    // Once in its category column, once as the featured card.
    expect(featuredLinks).toHaveLength(2);
  });

  test("uses Malayalam titles when locale is ml", () => {
    render(
      <CoursesDropdown courses={mockCourses} label="കോഴ്സുകൾ" locale="ml" />,
    );
    openMenu(/കോഴ്സുകൾ/i);

    expect(screen.getByText("പൈത്തൺ")).toBeInTheDocument();
    expect(screen.getByText("അക്കൗണ്ടിംഗ്")).toBeInTheDocument();
    // Falls back to English when titleMl is null.
    expect(screen.getByText("Full Stack Web Development")).toBeInTheDocument();
  });

  test("closes on Escape and returns focus to the trigger", async () => {
    render(
      <CoursesDropdown courses={mockCourses} label="Courses" locale="en" />,
    );
    openMenu();
    expect(screen.getByText("Python Programming")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByText("Python Programming")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Courses/i })).toHaveFocus();
  });
});

describe("MobileCoursesMenu", () => {
  test("expands and collapses the grouped course list", async () => {
    const onNavigate = vi.fn();
    render(
      <MobileCoursesMenu
        courses={mockCourses}
        label="Courses"
        locale="en"
        onNavigate={onNavigate}
      />,
    );
    const button = screen.getByRole("button", { name: /Courses/i });
    expect(screen.queryByText("Tally ERP 9")).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByText("Tally ERP 9"));
    expect(onNavigate).toHaveBeenCalledTimes(1);

    fireEvent.click(button);
    await waitFor(() =>
      expect(screen.queryByText("Tally ERP 9")).not.toBeInTheDocument(),
    );
  });
});
