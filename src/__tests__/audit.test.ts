import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";

const mockCreate = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockAuth = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    auditLogEntry: {
      create: mockCreate,
      findMany: mockFindMany,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// logAdminAction / logSystemAction are covered in src/lib/audit.test.ts.

describe("AuditLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
    mockFindMany.mockReset();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("is denied to a student-role user", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_student",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    const { default: AuditLogPage } =
      await import("@/app/[locale]/(admin)/admin/audit-log/page");

    await expect(
      AuditLogPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("is accessible to centre_staff", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_staff",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const createdAt = new Date();
    mockFindMany.mockResolvedValue([
      {
        id: "audit_1",
        actorUserId: "user_staff",
        actorRole: "CENTRE_STAFF",
        action: "course.create",
        entityType: "Course",
        entityId: "course_1",
        metadata: { title: "New Course" },
        createdAt,
        updatedAt: createdAt,
      },
    ]);

    const { default: AuditLogPage } =
      await import("@/app/[locale]/(admin)/admin/audit-log/page");

    const element = await AuditLogPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const html = renderToString(element);

    expect(html).toContain("Audit Log");
    expect(html).toContain("course.create");
    expect(html).toContain("Course");
    expect(html).toContain("course_1");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
