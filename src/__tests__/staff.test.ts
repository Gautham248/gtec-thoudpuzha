import { describe, expect, test, vi, beforeEach } from "vitest";
import { Role } from "@/lib/auth";
import { db } from "@/db";
import { setMockRows } from "@/__tests__/drizzle-mock";

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockClerkClient = vi.hoisted(() => vi.fn());
const mockCreateInvitation = vi.hoisted(() => vi.fn());
const mockFindUniqueUser = vi.hoisted(() => vi.fn());
const mockUpdateUser = vi.hoisted(() => vi.fn());
const mockFindManyUser = vi.hoisted(() => vi.fn());
const mockAuditCreate = vi.hoisted(() => vi.fn());
const mockStaffPermissionFindUnique = vi.hoisted(() => vi.fn());
const mockStaffPermissionUpsert = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkClient: mockClerkClient,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: mockFindUniqueUser,
      update: mockUpdateUser,
      findMany: mockFindManyUser,
    },
    staffPermission: {
      findUnique: mockStaffPermissionFindUnique,
      upsert: mockStaffPermissionUpsert,
    },
    auditLogEntry: { create: mockAuditCreate },
  },
}));

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

vi.mock("@/lib/audit", () => ({ logAdminAction: mockAuditCreate }));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("inviteStaff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });
    mockClerkClient.mockResolvedValue({
      invitations: { createInvitation: mockCreateInvitation },
    });
    mockCreateInvitation.mockResolvedValue({ id: "inv_1" });
  });

  test("1. Sending a staff invite creates a Clerk invitation with role=CENTRE_STAFF pre-set", async () => {
    const { inviteStaff } =
      await import("@/app/[locale]/(admin)/admin/staff/actions");

    const formData = new FormData();
    formData.set("email", "staff@example.com");
    formData.set("locale", "en");

    await inviteStaff(formData);

    expect(mockClerkClient).toHaveBeenCalledOnce();
    expect(mockCreateInvitation).toHaveBeenCalledWith({
      emailAddress: "staff@example.com",
      publicMetadata: { role: "CENTRE_STAFF" },
      redirectUrl: "/en/complete-signup",
    });
  });

  test("inviteStaff is denied to centre_staff (not SUPER_ADMIN)", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const { inviteStaff } =
      await import("@/app/[locale]/(admin)/admin/staff/actions");

    const formData = new FormData();
    formData.set("email", "staff@example.com");
    formData.set("locale", "en");

    await expect(inviteStaff(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect(mockCreateInvitation).not.toHaveBeenCalled();
  });
});

describe("deactivateStaff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });
    mockUpdateUser.mockResolvedValue({
      id: "staff_1",
      deactivatedAt: new Date(),
    });
  });

  test("3. Deactivating sets deactivatedAt", async () => {
    const { deactivateStaff } =
      await import("@/app/[locale]/(admin)/admin/staff/actions");

    const formData = new FormData();
    formData.set("userId", "staff_1");
    formData.set("locale", "en");

    await deactivateStaff(formData);

    expect(mockUpdateUser).toHaveBeenCalledWith({
      where: { id: "staff_1" },
      data: { deactivatedAt: expect.any(Date) },
    });
  });

  test("deactivateStaff is denied to centre_staff", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const { deactivateStaff } =
      await import("@/app/[locale]/(admin)/admin/staff/actions");

    const formData = new FormData();
    formData.set("userId", "staff_2");
    formData.set("locale", "en");

    await expect(deactivateStaff(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});

describe("reactivateStaff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });
    mockUpdateUser.mockResolvedValue({ id: "staff_1", deactivatedAt: null });
  });

  test("4. Reactivating clears deactivatedAt", async () => {
    const { reactivateStaff } =
      await import("@/app/[locale]/(admin)/admin/staff/actions");

    const formData = new FormData();
    formData.set("userId", "staff_1");
    formData.set("locale", "en");

    await reactivateStaff(formData);

    expect(mockUpdateUser).toHaveBeenCalledWith({
      where: { id: "staff_1" },
      data: { deactivatedAt: null },
    });
  });
});

describe("requireRole — deactivation enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("3b. Deactivated CENTRE_STAFF user fails requireRole even with valid role", async () => {
    mockAuth.mockResolvedValue({
      userId: "deactivated_staff",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    setMockRows(db, "user", [
      {
        id: "deactivated_staff",
        role: "CENTRE_STAFF",
        deactivatedAt: new Date("2026-07-20"),
      },
    ]);

    const result = await (
      await import("@/lib/auth")
    ).requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

    expect(result).toEqual({
      authorized: false,
      reason: "deactivated",
    });
  });

  test("4b. Reactivated staff passes requireRole again", async () => {
    mockAuth.mockResolvedValue({
      userId: "reactivated_staff",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockFindUniqueUser.mockResolvedValue({
      deactivatedAt: null,
    });

    const result = await (
      await import("@/lib/auth")
    ).requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

    expect(result).toEqual({
      authorized: true,
      role: "CENTRE_STAFF",
      userId: "reactivated_staff",
    });
  });

  test("requireRole ignores deactivatedAt for non-staff roles", async () => {
    mockAuth.mockResolvedValue({
      userId: "student_1",
      sessionClaims: { metadata: { role: "STUDENT" } },
    });

    const result = await (
      await import("@/lib/auth")
    ).requireRole([Role.STUDENT]);

    // Should succeed without even querying the DB for student roles
    expect(result).toEqual({
      authorized: true,
      role: "STUDENT",
      userId: "student_1",
    });
    expect(mockFindUniqueUser).not.toHaveBeenCalled();
  });
});

describe("staff page", () => {
  test("2. /admin/staff is denied to centre_staff-role user (403)", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const { default: StaffPage } =
      await import("@/app/[locale]/(admin)/admin/staff/page");

    await expect(
      StaffPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("staff page loads for super_admin", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });
    mockFindManyUser.mockResolvedValue([]);

    const { default: StaffPage } =
      await import("@/app/[locale]/(admin)/admin/staff/page");

    const _element = await StaffPage({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(mockFindManyUser).toHaveBeenCalledWith({
      where: {
        role: { in: ["CENTRE_STAFF", "SUPER_ADMIN"] },
      },
      orderBy: { createdAt: "desc" },
      include: { staffPermission: true },
    });
  });
});
