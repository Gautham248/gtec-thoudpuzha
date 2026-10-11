import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  approveEmployer,
  rejectEmployer,
  approveAndTrustEmployer,
  toggleAutoPublishTrusted,
} from "./actions";
import { db } from "@/db";
import { getInsertedRows, setMockRows } from "@/__tests__/drizzle-mock";

const mockAuth = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockStaffPermissionFindUnique = vi.hoisted(() => vi.fn());
const mockAuditCreate = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockSendModerationNotification = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    employerProfile: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    staffPermission: {
      findUnique: mockStaffPermissionFindUnique,
    },
    auditLogEntry: {
      create: mockAuditCreate,
    },
  },
}));

const auditEntries = () => getInsertedRows(db, "auditLogEntry");

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/email", () => ({
  sendEmployerModerationNotification: mockSendModerationNotification,
}));

describe("approveEmployer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockUpdate.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockSendModerationNotification.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("1. approving a PENDING employer sets status=APPROVED and sends notification", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockUpdate.mockResolvedValue({
      id: "ep_1",
      companyName: "Acme Corp",
      contactPersonName: "John Doe",
      email: "john@acme.com",
      status: "APPROVED",
      rejectionReason: null,
      autoPublishTrusted: false,
      user: { id: "user_1" },
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockSendModerationNotification.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");

    await approveEmployer(formData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "ep_1" },
      data: { status: "APPROVED", rejectionReason: null },
      include: { user: true },
    });

    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "super_admin_1",
        actorRole: "SUPER_ADMIN",
        action: "employerProfile.approve",
        entityType: "EmployerProfile",
        entityId: "ep_1",
      }),
    );

    expect(mockSendModerationNotification).toHaveBeenCalledWith({
      companyName: "Acme Corp",
      contactPersonName: "John Doe",
      employerEmail: "john@acme.com",
      status: "APPROVED",
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/employers");
  });

  test("2. rejecting requires a rejectionReason", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");
    // No rejectionReason

    await expect(rejectEmployer(formData)).rejects.toThrow(
      "rejectionReason is required",
    );

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(auditEntries()).toHaveLength(0);
    expect(mockSendModerationNotification).not.toHaveBeenCalled();
  });

  test("3. approveAndTrust sets both status=APPROVED and autoPublishTrusted=true", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockUpdate.mockResolvedValue({
      id: "ep_1",
      companyName: "Acme Corp",
      contactPersonName: "John",
      email: "john@acme.com",
      status: "APPROVED",
      autoPublishTrusted: true,
      rejectionReason: null,
      user: { id: "user_1" },
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockSendModerationNotification.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");

    await approveAndTrustEmployer(formData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "ep_1" },
      data: {
        status: "APPROVED",
        autoPublishTrusted: true,
        rejectionReason: null,
      },
      include: { user: true },
    });

    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        action: "employerProfile.approveAndTrust",
        metadata: expect.objectContaining({ autoPublishTrusted: true }),
      }),
    );

    expect(mockSendModerationNotification).toHaveBeenCalledWith(
      expect.objectContaining({ status: "APPROVED" }),
    );
  });

  test("4. toggleAutoPublishTrusted flips the flag on an APPROVED employer", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    // Start as APPROVED with autoPublishTrusted=false
    mockFindUnique.mockResolvedValue({
      id: "ep_1",
      status: "APPROVED",
      autoPublishTrusted: false,
    });

    mockUpdate.mockResolvedValue({
      id: "ep_1",
      autoPublishTrusted: true,
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");

    await toggleAutoPublishTrusted(formData);

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: "ep_1" } });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "ep_1" },
      data: { autoPublishTrusted: true },
    });

    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "super_admin_1",
        action: "employerProfile.trust",
        metadata: { autoPublishTrusted: true },
      }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/employers");
  });

  test("4b. toggleAutoPublishTrusted on a non-APPROVED employer throws", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockFindUnique.mockResolvedValue({
      id: "ep_1",
      status: "PENDING",
      autoPublishTrusted: false,
    });

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");

    await expect(toggleAutoPublishTrusted(formData)).rejects.toThrow(
      "Can only toggle autoPublishTrusted on APPROVED employers",
    );

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("5. Centre Staff cannot approve (redirects to forbidden)", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");

    await expect(approveEmployer(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(auditEntries()).toHaveLength(0);
    expect(mockSendModerationNotification).not.toHaveBeenCalled();
  });

  test("5b. Centre Staff cannot reject (redirects to forbidden)", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("rejectionReason", "Invalid docs");
    formData.append("locale", "en");

    await expect(rejectEmployer(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("5c. Centre Staff cannot approveAndTrust (redirects to forbidden)", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");

    await expect(approveAndTrustEmployer(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("5d. Centre Staff cannot toggleAutoPublishTrusted (redirects to forbidden)", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");

    await expect(toggleAutoPublishTrusted(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // ─── Permission-grant tests ────────────────────────────────────────────────

  test("6. Centre Staff without canApproveEmployers=true is denied approve", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_no_perm",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
    // no row = no permission

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");

    await expect(approveEmployer(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(auditEntries()).toHaveLength(0);
  });

  test("7. Centre Staff WITH canApproveEmployers=true can approve", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_with_perm",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
    setMockRows(db, "staffPermission", [
      {
        id: "sp_1",
        userId: "staff_with_perm",
        canApproveEmployers: true,
      },
    ]);

    mockUpdate.mockResolvedValue({
      id: "ep_1",
      companyName: "Acme Corp",
      contactPersonName: "John Doe",
      email: "john@acme.com",
      status: "APPROVED",
      rejectionReason: null,
      autoPublishTrusted: false,
      user: { id: "user_1" },
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockSendModerationNotification.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");

    await approveEmployer(formData);

    expect(mockUpdate).toHaveBeenCalled();
    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "staff_with_perm",
        actorRole: "CENTRE_STAFF",
      }),
    );
  });

  test("8. Super Admin always passes regardless of StaffPermission row", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });
    // Even with null StaffPermission, Super Admin should pass
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });

    mockUpdate.mockResolvedValue({
      id: "ep_1",
      companyName: "Acme Corp",
      contactPersonName: "John Doe",
      email: "john@acme.com",
      status: "APPROVED",
      rejectionReason: null,
      user: { id: "user_1" },
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockSendModerationNotification.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append("profileId", "ep_1");
    formData.append("locale", "en");

    await approveEmployer(formData);

    expect(mockUpdate).toHaveBeenCalled();
    expect(auditEntries()).not.toHaveLength(0);
  });
});
