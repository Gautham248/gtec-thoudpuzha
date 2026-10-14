import { renderToString } from "react-dom/server";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { PortalRoleGate } from "@/components/shared/PortalRoleGate";
import { Role } from "@/lib/auth";

const mockAuth = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() => vi.fn());

const mockClerkMiddleware = vi.hoisted(
  () =>
    (
      _handler: (auth: unknown, req: Request) => Promise<Response | undefined>,
    ) => {
      // no-op
    },
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkMiddleware: mockClerkMiddleware,
  clerkClient: () =>
    Promise.resolve({
      users: {
        getUser: mockGetUser,
      },
    }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

function withAuth(role: Role | undefined, userId = "user_1") {
  mockAuth.mockResolvedValue({
    userId,
    sessionClaims: role ? { metadata: { role } } : {},
  });
}

describe("PortalRoleGate — fine-grained role gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("1. job_seeker is denied /portal/student/resources with friendly message", async () => {
    withAuth(Role.JOB_SEEKER);
    const element = await PortalRoleGate({
      allowedRoles: [Role.STUDENT],
      children: <div>Academic Resources Content</div>,
    });
    const html = renderToString(element);
    expect(html).toContain("&#x27;t for your account type");
    expect(html).toContain("Student");
    expect(html).not.toContain("Academic Resources Content");
    expect(html).not.toContain("403");
  });

  test("2. student succeeds at /portal/student/resources", async () => {
    withAuth(Role.STUDENT);
    const element = await PortalRoleGate({
      allowedRoles: [Role.STUDENT],
      children: <div>Academic Resources Content</div>,
    });
    const html = renderToString(element);
    expect(html).toContain("Academic Resources Content");
    expect(html).not.toContain("&#x27;t for your account type");
  });

  test("3. both student and job_seeker succeed at /portal/student/biodata", async () => {
    for (const role of [Role.STUDENT, Role.JOB_SEEKER]) {
      withAuth(role);
      const element = await PortalRoleGate({
        allowedRoles: [Role.STUDENT, Role.JOB_SEEKER],
        children: <div>Biodata Content</div>,
      });
      const html = renderToString(element);
      expect(html).toContain("Biodata Content");
      expect(html).not.toContain("not for your account type");
    }
  });

  test("4. student is denied /portal/employer/* with friendly message", async () => {
    withAuth(Role.STUDENT);
    const element = await PortalRoleGate({
      allowedRoles: [Role.EMPLOYER],
      children: <div>Employer Content</div>,
    });
    const html = renderToString(element);
    expect(html).toContain("&#x27;t for your account type");
    expect(html).toContain("Employer");
    expect(html).not.toContain("Employer Content");
    expect(html).not.toContain("403");
  });

  test("5. employer succeeds at /portal/employer/*", async () => {
    withAuth(Role.EMPLOYER);
    const element = await PortalRoleGate({
      allowedRoles: [Role.EMPLOYER],
      children: <div>Employer Content</div>,
    });
    const html = renderToString(element);
    expect(html).toContain("Employer Content");
    expect(html).not.toContain("not for your account type");
  });

  test("6. regression: resource-based auth protects admin via requireRole in layout", async () => {
    const { requireRole, Role } = await import("@/lib/auth");

    // unauthenticated — requireRole returns unauthenticated
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: {} });
    const result1 = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
    expect(result1.authorized).toBe(false);
    if (!result1.authorized) expect(result1.reason).toBe("unauthenticated");

    // staff passes
    mockAuth.mockResolvedValue({
      userId: "user_4",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    const result2 = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
    expect(result2.authorized).toBe(true);

    // non-admin role denied
    mockAuth.mockResolvedValue({
      userId: "user_student",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });
    const result3 = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
    expect(result3.authorized).toBe(false);
    if (!result3.authorized) expect(result3.reason).toBe("forbidden");
  });

  test("7. stale-session race: fetchRoleFromApi returns metadata role from Clerk API", async () => {
    const { fetchRoleFromApi } = await import("@/proxy");

    mockGetUser.mockResolvedValue({
      publicMetadata: { role: "JOB_SEEKER" },
    });

    const role = await fetchRoleFromApi("user_new");
    expect(role).toBe("JOB_SEEKER");
    expect(mockGetUser).toHaveBeenCalledWith("user_new");
  });

  test("8. fetchRoleFromApi returns undefined when Clerk API has no role", async () => {
    const { fetchRoleFromApi } = await import("@/proxy");

    mockGetUser.mockResolvedValue({
      publicMetadata: {},
    });

    const role = await fetchRoleFromApi("user_no_role");
    expect(role).toBeUndefined();
  });

  test("9. fetchRoleFromApi returns undefined when Clerk API errors", async () => {
    const { fetchRoleFromApi } = await import("@/proxy");

    mockGetUser.mockRejectedValue(new Error("Network error"));

    const role = await fetchRoleFromApi("user_err");
    expect(role).toBeUndefined();
  });

  test("10. requireRole lets authenticated users through when role is present (no-race path)", async () => {
    const { requireRole, Role } = await import("@/lib/auth");

    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "JOB_SEEKER" } },
    });
    const result = await requireRole([Role.STUDENT, Role.JOB_SEEKER]);
    expect(result.authorized).toBe(true);
    if (result.authorized) expect(result.role).toBe("JOB_SEEKER");
  });

  test("11. requireRole blocks when role is absent (simulates pre-fallback scenario)", async () => {
    const { requireRole, Role } = await import("@/lib/auth");

    mockAuth.mockResolvedValue({ userId: "user_2", sessionClaims: {} });
    mockGetUser.mockResolvedValueOnce({ publicMetadata: {} });
    const result = await requireRole([Role.STUDENT, Role.JOB_SEEKER]);
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.reason).toBe("no_role");
  });
});
