import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { db } from "@/db";
import { setMockRows } from "@/__tests__/drizzle-mock";
import AuditLogPage from "@/app/[locale]/(admin)/admin/audit-log/page";

// logAdminAction / logSystemAction are covered in src/lib/audit.test.ts.
// "@/db" is the in-memory fake installed by src/__tests__/setup.ts.

const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockAuth = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

function entry(id: string, action: string, minutesAgo: number) {
  const createdAt = new Date(Date.now() - minutesAgo * 60_000);
  return {
    id,
    actorUserId: "user_staff",
    actorRole: "CENTRE_STAFF",
    action,
    entityType: "Course",
    entityId: `course_${id}`,
    metadata: { title: "New Course" },
    createdAt,
    updatedAt: createdAt,
  };
}

describe("AuditLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("is denied to a student-role user", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_student",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    await expect(
      AuditLogPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("is accessible to centre_staff and lists entries newest first", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_staff",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    setMockRows(db, "auditLogEntry", [
      entry("1", "course.create", 10),
      entry("2", "course.update", 1),
    ]);

    const html = renderToString(
      await AuditLogPage({ params: Promise.resolve({ locale: "en" }) }),
    );

    expect(html).toContain("Audit Log");
    expect(html).toContain("course.create");
    expect(html).toContain("course_1");
    expect(html.indexOf("course.update")).toBeLessThan(
      html.indexOf("course.create"),
    );
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  test("shows at most the 50 most recent entries", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_staff",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    setMockRows(
      db,
      "auditLogEntry",
      Array.from({ length: 55 }, (_, i) =>
        entry(String(i), `action.n${i}.`, i),
      ),
    );

    const html = renderToString(
      await AuditLogPage({ params: Promise.resolve({ locale: "en" }) }),
    );

    expect(html).toContain("action.n49.");
    expect(html).not.toContain("action.n50.");
  });
});
