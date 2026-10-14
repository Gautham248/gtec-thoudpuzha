import { renderToString } from "react-dom/server";
import { describe, expect, test, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { Role } from "@/lib/auth";
import { db } from "@/db";
import { setMockRows } from "@/__tests__/drizzle-mock";
import DashboardPage from "@/app/[locale]/(portal)/portal/student/page";

// "@/db" is the in-memory fake installed by src/__tests__/setup.ts.

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("next/link", () => ({
  default: vi.fn(
    ({ href, children }: { href: string; children: ReactNode }): string => {
      let text = "";
      function extract(nodes: ReactNode): void {
        if (typeof nodes === "string" || typeof nodes === "number") {
          text += String(nodes);
        } else if (Array.isArray(nodes)) {
          nodes.forEach(extract);
        } else if (nodes && typeof nodes === "object" && "props" in nodes) {
          extract(
            (nodes as unknown as { props: { children: ReactNode } }).props
              .children,
          );
        }
      }
      extract(children);
      return `<a href="${href}">${text}</a>`;
    },
  ),
}));

vi.mock("lucide-react", () => ({
  BookOpen: () => "📘",
  Video: () => "🎥",
  FileText: () => "📄",
  BarChart3: () => "📊",
  Calendar: () => "📅",
  ScrollText: () => "📜",
}));

function withAuth(role: Role | undefined, userId = "user_1") {
  mockAuth.mockResolvedValue({
    userId,
    sessionClaims: role ? { metadata: { role } } : {},
  });
}

function withProfile(courseCompletedIds: string[], userId = "user_1") {
  setMockRows(db, "candidateProfile", [
    { id: "cp_1", userId, courseCompletedIds },
  ]);
}

describe("Student Dashboard — /portal/student", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("1. a student with a linked course sees all six tiles", async () => {
    withAuth(Role.STUDENT);
    withProfile(["course_1"]);

    const element = await DashboardPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("Study Notes");
    expect(html).toContain("Video Lectures");
    expect(html).toContain("Assignments");
    expect(html).toContain("My Progress");
    expect(html).toContain("Timetable");
    expect(html).toContain("Past Papers");
  });

  test("2. a student with NO linked course sees the empty state", async () => {
    withAuth(Role.STUDENT);
    withProfile([]);

    const element = await DashboardPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("Welcome to the Student Portal");
    expect(html).toContain("contact the centre");
    expect(html).not.toContain("Study Notes");
    expect(html).not.toContain("Video Lectures");
  });

  test("a student with no profile yet sees the empty state", async () => {
    withAuth(Role.STUDENT);

    const html = renderToString(
      await DashboardPage({ params: Promise.resolve({ locale: "en" }) }),
    );

    expect(html).toContain("Welcome to the Student Portal");
    expect(html).not.toContain("Study Notes");
  });

  test("only the signed-in student's own profile counts", async () => {
    withAuth(Role.STUDENT, "user_2");
    withProfile(["course_1"], "user_1");

    const html = renderToString(
      await DashboardPage({ params: Promise.resolve({ locale: "en" }) }),
    );

    expect(html).not.toContain("Study Notes");
  });

  test("3. a job_seeker-role user is denied /portal/student entirely", async () => {
    withAuth(Role.JOB_SEEKER);

    const element = await DashboardPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("&#x27;t for your account type");
    expect(html).toContain("Student");
    expect(html).not.toContain("Study Notes");
    expect(html).not.toContain("Student Dashboard");
  });

  test("4. each tile links to the correct sub-route", async () => {
    withAuth(Role.STUDENT);
    withProfile(["course_1"]);

    const element = await DashboardPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("href=&quot;/portal/student/resources/notes&quot;");
    expect(html).toContain(
      "href=&quot;/portal/student/resources/lectures&quot;",
    );
    expect(html).toContain(
      "href=&quot;/portal/student/resources/assignments&quot;",
    );
    expect(html).toContain(
      "href=&quot;/portal/student/resources/progress&quot;",
    );
    expect(html).toContain(
      "href=&quot;/portal/student/resources/timetable&quot;",
    );
    expect(html).toContain(
      "href=&quot;/portal/student/resources/past-papers&quot;",
    );
  });
});
