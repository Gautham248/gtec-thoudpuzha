// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staffPermission, user } from "@/db/schema";
import { requireRole, Role } from "@/lib/auth";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  form,
  insertStaff,
  insertUser,
  session,
} from "@/__tests__/pg-fixtures";
import {
  deactivateStaff,
  inviteStaff,
  reactivateStaff,
  setStaffPermission,
} from "@/app/[locale]/(admin)/admin/staff/actions";
import StaffPage from "@/app/[locale]/(admin)/admin/staff/page";

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockClerkClient = vi.hoisted(() => vi.fn());
const mockCreateInvitation = vi.hoisted(() => vi.fn());
const mockAuditCreate = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkClient: mockClerkClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

vi.mock("@/lib/audit", () => ({ logAdminAction: mockAuditCreate }));

const pg = db as unknown as TestDb;

const deactivatedAt = async (id: string) =>
  (await pg.query.user.findFirst({ where: eq(user.id, id) }))?.deactivatedAt;

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  mockAuth.mockResolvedValue(session("super_admin_1", "SUPER_ADMIN"));
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("inviteStaff", () => {
  beforeEach(() => {
    mockClerkClient.mockResolvedValue({
      invitations: { createInvitation: mockCreateInvitation },
    });
    mockCreateInvitation.mockResolvedValue({ id: "inv_1" });
  });

  test("1. Sending a staff invite creates a Clerk invitation with role=CENTRE_STAFF pre-set", async () => {
    await inviteStaff(form({ email: "staff@example.com", locale: "en" }));

    expect(mockClerkClient).toHaveBeenCalledOnce();
    expect(mockCreateInvitation).toHaveBeenCalledWith({
      emailAddress: "staff@example.com",
      publicMetadata: { role: "CENTRE_STAFF" },
      redirectUrl: "/en/complete-signup",
    });
  });

  test("inviteStaff is denied to centre_staff (not SUPER_ADMIN)", async () => {
    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));

    await expect(
      inviteStaff(form({ email: "staff@example.com", locale: "en" })),
    ).rejects.toThrow("redirect:/en/forbidden");
    expect(mockCreateInvitation).not.toHaveBeenCalled();
  });
});

describe("deactivateStaff / reactivateStaff", () => {
  test("3. Deactivating sets deactivatedAt", async () => {
    await insertUser(pg, { id: "staff_1", role: "CENTRE_STAFF" });

    await deactivateStaff(form({ userId: "staff_1", locale: "en" }));

    expect(await deactivatedAt("staff_1")).toBeInstanceOf(Date);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: "staff_1" }),
    );
  });

  test("deactivateStaff is denied to centre_staff", async () => {
    await insertUser(pg, { id: "staff_2", role: "CENTRE_STAFF" });
    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));

    await expect(
      deactivateStaff(form({ userId: "staff_2", locale: "en" })),
    ).rejects.toThrow("redirect:/en/forbidden");
    expect(await deactivatedAt("staff_2")).toBeNull();
  });

  test("4. Reactivating clears deactivatedAt", async () => {
    await insertUser(pg, {
      id: "staff_1",
      role: "CENTRE_STAFF",
      deactivatedAt: new Date(),
    });

    await reactivateStaff(form({ userId: "staff_1", locale: "en" }));

    expect(await deactivatedAt("staff_1")).toBeNull();
  });

  test("deactivating an unknown user fails without auditing", async () => {
    await expect(
      deactivateStaff(form({ userId: "ghost", locale: "en" })),
    ).rejects.toThrow("User not found");
    expect(mockAuditCreate).not.toHaveBeenCalled();
  });
});

describe("setStaffPermission", () => {
  test("creates the permission row on first change, then updates it", async () => {
    await insertUser(pg, { id: "staff_1", role: "CENTRE_STAFF" });
    const perms = async () =>
      pg.query.staffPermission.findFirst({
        where: eq(staffPermission.userId, "staff_1"),
      });

    await setStaffPermission(
      form({
        userId: "staff_1",
        permissionKey: "canApproveEmployers",
        value: "true",
        locale: "en",
      }),
    );
    expect((await perms())?.canApproveEmployers).toBe(true);

    await setStaffPermission(
      form({
        userId: "staff_1",
        permissionKey: "canApproveEmployers",
        value: "false",
        locale: "en",
      }),
    );
    const row = await perms();
    expect(row?.canApproveEmployers).toBe(false);
    expect(await pg.$count(staffPermission)).toBe(1);
  });

  test("rejects an unknown permission key", async () => {
    await expect(
      setStaffPermission(
        form({
          userId: "staff_1",
          permissionKey: "canDoAnything",
          value: "true",
          locale: "en",
        }),
      ),
    ).rejects.toThrow("Invalid permission key");
  });
});

describe("requireRole — deactivation enforcement", () => {
  test("3b. Deactivated CENTRE_STAFF user fails requireRole even with valid role", async () => {
    mockAuth.mockResolvedValue(session("deactivated_staff", "CENTRE_STAFF"));
    await insertUser(pg, {
      id: "deactivated_staff",
      role: "CENTRE_STAFF",
      deactivatedAt: new Date("2026-07-20"),
    });

    expect(await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN])).toEqual({
      authorized: false,
      reason: "deactivated",
    });
  });

  test("4b. Reactivated staff passes requireRole again", async () => {
    mockAuth.mockResolvedValue(session("reactivated_staff", "CENTRE_STAFF"));
    await insertUser(pg, {
      id: "reactivated_staff",
      role: "CENTRE_STAFF",
      deactivatedAt: null,
    });

    expect(await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN])).toEqual({
      authorized: true,
      role: "CENTRE_STAFF",
      userId: "reactivated_staff",
    });
  });

  test("requireRole ignores deactivatedAt for non-staff roles", async () => {
    mockAuth.mockResolvedValue(session("student_1", "STUDENT"));
    await insertUser(pg, {
      id: "student_1",
      role: "STUDENT",
      deactivatedAt: new Date(),
    });

    expect(await requireRole([Role.STUDENT])).toEqual({
      authorized: true,
      role: "STUDENT",
      userId: "student_1",
    });
  });
});

describe("staff page", () => {
  test("2. /admin/staff is denied to centre_staff-role user (403)", async () => {
    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));

    await expect(
      StaffPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });

  test("staff page lists only staff and admins for super_admin", async () => {
    await insertStaff(pg, "staff_member_1");
    await insertUser(pg, { id: "admin_member_1", role: "SUPER_ADMIN" });
    await insertUser(pg, { id: "student_member_1", role: "STUDENT" });

    const html = renderToString(
      await StaffPage({ params: Promise.resolve({ locale: "en" }) }),
    );

    expect(html).toContain("staff_member_1");
    expect(html).toContain("admin_member_1");
    expect(html).not.toContain("student_member_1");
  });
});
