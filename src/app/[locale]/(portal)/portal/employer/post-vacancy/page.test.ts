import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { setMockRows } from "@/__tests__/drizzle-mock";
import PostVacancyPage from "./page";

// "@/db" is the in-memory fake installed by src/__tests__/setup.ts.

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/skills", () => ({
  getApprovedSkills: vi.fn().mockResolvedValue([]),
}));

vi.mock("./post-vacancy-form", () => ({
  PostVacancyForm: vi.fn(() =>
    createElement("div", null, "Post a Vacancy Form"),
  ),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Post Vacancy page — employer status gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  test("An employer with status=PENDING is blocked from the post-vacancy route, redirected to status page", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_emp_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });
    setMockRows(db, "employerProfile", [
      { id: "ep_1", userId: "user_emp_1", status: "PENDING" },
    ]);

    await expect(PostVacancyPage()).rejects.toThrow(
      "redirect:/portal/employer/register/status",
    );
  });

  test("An employer with status=REJECTED is also blocked", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_emp_2",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });
    setMockRows(db, "employerProfile", [
      { id: "ep_2", userId: "user_emp_2", status: "REJECTED" },
    ]);

    await expect(PostVacancyPage()).rejects.toThrow(
      "redirect:/portal/employer/register/status",
    );
  });

  test("An employer with no profile is redirected", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_emp_4",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    await expect(PostVacancyPage()).rejects.toThrow(
      "redirect:/portal/employer/register/status",
    );
  });

  test("An employer with status=APPROVED can access the post-vacancy page", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_emp_3",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });
    setMockRows(db, "employerProfile", [
      { id: "ep_3", userId: "user_emp_3", status: "APPROVED" },
    ]);

    const element = await PostVacancyPage();
    const html = renderToString(element);
    expect(html).toContain("Post a Vacancy Form");
  });
});
