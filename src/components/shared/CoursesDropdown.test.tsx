import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CoursesDropdown } from "./CoursesDropdown";

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

const mockCourses = [
  { slug: "python-programming", titleEn: "Python Programming", titleMl: "പൈത്തൺ" },
  { slug: "full-stack", titleEn: "Full Stack Web Development", titleMl: null },
  { slug: "tally-erp", titleEn: "Tally ERP 9", titleMl: null },
  { slug: "spoken-english", titleEn: "Spoken English", titleMl: null },
  { slug: "digital-marketing", titleEn: "Digital Marketing", titleMl: null },
  { slug: "graphic-design", titleEn: "Graphic Design", titleMl: null },
  { slug: "data-science", titleEn: "Data Science", titleMl: null },
];

describe("CoursesDropdown", () => {
  test("renders dropdown button with label", () => {
    render(<CoursesDropdown courses={mockCourses} label="Courses" locale="en" />);
    expect(screen.getByRole("button", { name: /Courses/i })).toBeInTheDocument();
  });

  test("opens mega dropdown grid on click", () => {
    render(<CoursesDropdown courses={mockCourses} label="Courses" locale="en" />);
    
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByRole("button", { name: /Courses/i }));
    
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(screen.getByText("Available Courses (7)")).toBeInTheDocument();
    expect(screen.getByText("All Courses")).toBeInTheDocument();
    expect(screen.getByText("Python Programming")).toBeInTheDocument();
    expect(screen.getByText("Full Stack Web Development")).toBeInTheDocument();
  });

  test("uses Malayalam titles when locale is ml", () => {
    render(<CoursesDropdown courses={mockCourses} label="കോഴ്സുകൾ" locale="ml" />);
    
    fireEvent.click(screen.getByRole("button", { name: /കോഴ്സുകൾ/i }));
    
    expect(screen.getByText("പൈത്തൺ")).toBeInTheDocument();
    expect(screen.getByText("Full Stack Web Development")).toBeInTheDocument(); // fallback to English when titleMl is null
  });

  test("closes menu on Escape key press", () => {
    render(<CoursesDropdown courses={mockCourses} label="Courses" locale="en" />);
    
    fireEvent.click(screen.getByRole("button", { name: /Courses/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
