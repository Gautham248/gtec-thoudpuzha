// EnrollmentDashboard UI only. The enroll/unenroll actions and the page's
// role gate are tested against Postgres in actions.test.ts.
import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EnrollmentDashboard from "./enrollment-dashboard";

const mockRouterPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: mockRouterPush }),
}));

const stubCourses = [
  { id: "c1", titleEn: "Python Programming" },
  { id: "c2", titleEn: "Data Science" },
  { id: "c3", titleEn: "Web Development" },
];

function makeStudent(
  id: string,
  name: string,
  phone: string,
  studentId: string,
  studentRecordId: string,
  enrollmentRefs: Array<{
    id: string;
    courseId: string;
    course: { id: string; titleEn: string };
  }>,
) {
  return {
    id,
    fullName: name,
    phone,
    studentId,
    studentRecordId,
    enrollments: enrollmentRefs.map((e) => ({
      ...e,
      enrolledAt: new Date("2025-01-15"),
    })),
  };
}

const students = [
  makeStudent("cp1", "Alice Johnson", "9876543210", "GTEC001", "sr1", [
    {
      id: "enc1",
      courseId: "c1",
      course: { id: "c1", titleEn: "Python Programming" },
    },
    {
      id: "enc2",
      courseId: "c2",
      course: { id: "c2", titleEn: "Data Science" },
    },
  ]),
  makeStudent("cp2", "Bob Smith", "9876543211", "GTEC002", "sr2", [
    {
      id: "enc3",
      courseId: "c1",
      course: { id: "c1", titleEn: "Python Programming" },
    },
  ]),
  makeStudent("cp3", "Carol Williams", "9876543212", "GTEC003", "sr3", []),
];

const baseProps = {
  students,
  courses: stubCourses,
  locale: "en",
  selectedStudentProfileId: null,
};

describe("EnrollmentDashboard component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouterPush.mockClear();
  });

  test("1. table renders all students with correct enrollment counts and course names", () => {
    render(<EnrollmentDashboard {...baseProps} />);

    // All 3 student names
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carol Williams").length).toBeGreaterThan(0);

    // Student IDs (human-readable)
    expect(screen.getAllByText("GTEC001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GTEC002").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GTEC003").length).toBeGreaterThan(0);

    // Phones
    expect(screen.getAllByText("9876543210").length).toBeGreaterThan(0);
    expect(screen.getAllByText("9876543211").length).toBeGreaterThan(0);
    expect(screen.getAllByText("9876543212").length).toBeGreaterThan(0);

    // Alice has 2 enrollments: badge "2" and course names
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Python Programming, Data Science").length,
    ).toBeGreaterThan(0);

    // Bob has 1 enrollment: course name appears (also in dropdown, so multiple hits)
    const pythonHits = screen.getAllByText("Python Programming");
    expect(pythonHits.length).toBeGreaterThanOrEqual(2);

    // Carol has 0: "None"
    expect(screen.getAllByText("None").length).toBeGreaterThan(0);
  });

  test("2. course filter narrows the table to only students enrolled in the selected course", () => {
    render(<EnrollmentDashboard {...baseProps} />);

    const select = screen.getByLabelText("Course Filter") as HTMLSelectElement;

    // Select "Python Programming"
    fireEvent.change(select, { target: { value: "c1" } });

    // Alice and Bob (both in Python) should show; Carol should not
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.queryByText("Carol Williams")).toBeNull();

    // Switch to "Data Science"
    fireEvent.change(select, { target: { value: "c2" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bob Smith")).toBeNull();
    expect(screen.queryByText("Carol Williams")).toBeNull();

    // Switch to "Web Development" — no one enrolled
    fireEvent.change(select, { target: { value: "c3" } });
    expect(screen.getByText("No students found.")).toBeTruthy();

    // Back to All
    fireEvent.change(select, { target: { value: "" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carol Williams").length).toBeGreaterThan(0);
  });

  test("3. name / Student-ID search filters the table", () => {
    render(<EnrollmentDashboard {...baseProps} />);

    const input = screen.getByPlaceholderText("Name or Student ID…");

    // Search by name
    fireEvent.change(input, { target: { value: "bob" } });
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.queryByText("Alice Johnson")).toBeNull();
    expect(screen.queryByText("Carol Williams")).toBeNull();

    // Search by Student ID
    fireEvent.change(input, { target: { value: "GTEC003" } });
    expect(screen.getAllByText("Carol Williams").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bob Smith")).toBeNull();

    // Search by partial ID
    fireEvent.change(input, { target: { value: "GTEC00" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carol Williams").length).toBeGreaterThan(0);

    // No match
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No students found.")).toBeTruthy();

    // Clear search — all back
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carol Williams").length).toBeGreaterThan(0);
  });

  test("course filter and search work together", () => {
    render(<EnrollmentDashboard {...baseProps} />);

    const select = screen.getByLabelText("Course Filter") as HTMLSelectElement;
    const input = screen.getByPlaceholderText("Name or Student ID…");

    // Filter to Python course (Alice + Bob)
    fireEvent.change(select, { target: { value: "c1" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Smith").length).toBeGreaterThan(0);

    // Now search "alice" within Python students
    fireEvent.change(input, { target: { value: "alice" } });
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bob Smith")).toBeNull();
  });
});

// ─── Action Tests (requirements 4-7) ─────────────────────────────
