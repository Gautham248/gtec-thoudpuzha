import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  approveJobPosting,
  rejectJobPosting,
  editAndApproveJobPosting,
} from "./actions";
import { db } from "@/db";
import { getInsertedRows, setMockRows } from "@/__tests__/drizzle-mock";

const mockAuth = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
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
    jobPosting: {
      findMany: mockFindMany,
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
  sendJobPostingModerationNotification: mockSendModerationNotification,
}));

describe("approveJobPosting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockUpdate.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockSendModerationNotification.mockReset();
    mockUserFindUnique.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
    mockStaffPermissionFindUnique.mockReset();
  });

  test("1. approving sets status=APPROVED and sends notification", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockUpdate.mockResolvedValue({
      id: "jp_1",
      title: "Software Engineer",
      status: "APPROVED",
      employer: {
        companyName: "Acme Corp",
        email: "hr@acme.com",
      },
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockSendModerationNotification.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append("postingId", "jp_1");
    formData.append("locale", "en");

    await approveJobPosting(formData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "jp_1" },
      data: { status: "APPROVED" },
      include: { employer: true },
    });

    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "super_admin_1",
        actorRole: "SUPER_ADMIN",
        action: "jobPosting.approve",
        entityType: "JobPosting",
        entityId: "jp_1",
      }),
    );

    expect(mockSendModerationNotification).toHaveBeenCalledWith({
      jobTitle: "Software Engineer",
      companyName: "Acme Corp",
      employerEmail: "hr@acme.com",
      status: "APPROVED",
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/job-postings");
  });

  test("2. rejecting requires a rejectionReason", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    const formData = new FormData();
    formData.append("postingId", "jp_1");
    formData.append("locale", "en");
    // No rejectionReason

    await expect(rejectJobPosting(formData)).rejects.toThrow(
      "rejectionReason is required",
    );

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(auditEntries()).toHaveLength(0);
    expect(mockSendModerationNotification).not.toHaveBeenCalled();
  });

  test("3. rejecting with reason sets status=REJECTED and persists rejectionReason", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockUpdate.mockResolvedValue({
      id: "jp_1",
      title: "Software Engineer",
      status: "REJECTED",
      employer: {
        companyName: "Acme Corp",
        email: "hr@acme.com",
      },
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockSendModerationNotification.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append("postingId", "jp_1");
    formData.append("rejectionReason", "Missing details");
    formData.append("locale", "en");

    await rejectJobPosting(formData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "jp_1" },
      data: { status: "REJECTED", rejectionReason: "Missing details" },
      include: { employer: true },
    });

    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        action: "jobPosting.reject",
        metadata: expect.objectContaining({
          rejectionReason: "Missing details",
        }),
      }),
    );

    expect(mockSendModerationNotification).toHaveBeenCalledWith({
      jobTitle: "Software Engineer",
      companyName: "Acme Corp",
      employerEmail: "hr@acme.com",
      status: "REJECTED",
      rejectionReason: "Missing details",
    });
  });

  test("4. editAndApprove persists both edited fields and status change", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockUpdate.mockResolvedValue({
      id: "jp_1",
      title: "Senior Engineer",
      status: "APPROVED",
      employer: {
        companyName: "Acme Corp",
        email: "hr@acme.com",
      },
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockSendModerationNotification.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append("postingId", "jp_1");
    formData.append("title", "Senior Engineer");
    formData.append("description", "Updated description");
    formData.append("department", "Engineering");
    formData.append("salaryMin", "50000");
    formData.append("salaryMax", "80000");
    formData.append("locale", "en");

    await editAndApproveJobPosting(formData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "jp_1" },
      data: {
        status: "APPROVED",
        title: "Senior Engineer",
        description: "Updated description",
        department: "Engineering",
        salaryMin: 50000,
        salaryMax: 80000,
      },
      include: { employer: true },
    });

    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        action: "jobPosting.editAndApprove",
        metadata: expect.objectContaining({
          title: "Senior Engineer",
        }),
      }),
    );

    expect(mockSendModerationNotification).toHaveBeenCalledWith({
      jobTitle: "Senior Engineer",
      companyName: "Acme Corp",
      employerEmail: "hr@acme.com",
      status: "APPROVED",
    });
  });

  test("5. Centre Staff cannot approve (redirects to forbidden)", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const formData = new FormData();
    formData.append("postingId", "jp_1");
    formData.append("locale", "en");

    await expect(approveJobPosting(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(auditEntries()).toHaveLength(0);
    expect(mockSendModerationNotification).not.toHaveBeenCalled();
  });

  // ─── Permission-grant tests ────────────────────────────────────────────────

  test("6. Centre Staff without canApproveJobPostings=true is denied approve", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_no_perm",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });

    const formData = new FormData();
    formData.append("postingId", "jp_1");
    formData.append("locale", "en");

    await expect(approveJobPosting(formData)).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("7. Centre Staff WITH canApproveJobPostings=true can approve", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_with_perm",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
    setMockRows(db, "staffPermission", [
      {
        id: "sp_1",
        userId: "staff_with_perm",
        canApproveJobPostings: true,
      },
    ]);

    mockUpdate.mockResolvedValue({
      id: "jp_1",
      title: "Software Engineer",
      status: "APPROVED",
      employer: {
        companyName: "Acme Corp",
        email: "hr@acme.com",
      },
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockSendModerationNotification.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append("postingId", "jp_1");
    formData.append("locale", "en");

    await approveJobPosting(formData);

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
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });

    mockUpdate.mockResolvedValue({
      id: "jp_1",
      title: "Software Engineer",
      status: "APPROVED",
      employer: {
        companyName: "Acme Corp",
        email: "hr@acme.com",
      },
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockSendModerationNotification.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append("postingId", "jp_1");
    formData.append("locale", "en");

    await approveJobPosting(formData);

    expect(mockUpdate).toHaveBeenCalled();
    expect(auditEntries()).not.toHaveLength(0);
  });

  // ─── Regression: Bug UAT-001 ──────────────────────────────────────────

  test("9. REGRESSION: rejectionReason is persisted in the update call, not silently dropped", async () => {
    mockAuth.mockResolvedValue({
      userId: "super_admin_1",
      sessionClaims: { metadata: { role: "SUPER_ADMIN" } },
    });

    mockUpdate.mockResolvedValue({
      id: "jp_1",
      title: "Software Engineer",
      status: "REJECTED",
      rejectionReason: "Incomplete information",
      employer: {
        companyName: "Acme Corp",
        email: "hr@acme.com",
      },
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });
    mockSendModerationNotification.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append("postingId", "jp_1");
    formData.append("rejectionReason", "Incomplete information");
    formData.append("locale", "en");

    await rejectJobPosting(formData);

    // The old code only set { status: "REJECTED" } — rejectionReason was missing.
    // This assertion would have failed before the fix.
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rejectionReason: "Incomplete information",
        }),
      }),
    );
  });
});
