// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { auditLogEntry, jobPosting } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  form,
  insertEmployer,
  insertJobPosting,
  insertStaff,
  session,
} from "@/__tests__/pg-fixtures";
import {
  approveJobPosting,
  editAndApproveJobPosting,
  rejectJobPosting,
} from "./actions";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockSendModerationNotification = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/email", () => ({
  sendJobPostingModerationNotification: mockSendModerationNotification,
}));

const pg = db as unknown as TestDb;

let postingId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  mockAuth.mockResolvedValue(session("super_admin_1", "SUPER_ADMIN"));
  const employer = await insertEmployer(pg, {
    companyName: "Acme Corp",
    email: "hr@acme.com",
  });
  postingId = (
    await insertJobPosting(pg, {
      employerId: employer.id,
      title: "Software Engineer",
      status: "PENDING",
    })
  ).id;
});

const posting = async () => (await pg.select().from(jobPosting))[0];
const audits = () => pg.select().from(auditLogEntry);
const fd = (extra: Record<string, string> = {}) =>
  form({ postingId, locale: "en", ...extra });

describe("Super Admin moderation", () => {
  test("1. approving sets status=APPROVED and sends notification", async () => {
    await approveJobPosting(fd());

    expect((await posting()).status).toBe("APPROVED");
    expect(await audits()).toEqual([
      expect.objectContaining({
        actorUserId: "super_admin_1",
        actorRole: "SUPER_ADMIN",
        action: "jobPosting.approve",
        entityType: "JobPosting",
        entityId: postingId,
        metadata: { title: "Software Engineer", companyName: "Acme Corp" },
      }),
    ]);
    expect(mockSendModerationNotification).toHaveBeenCalledWith({
      jobTitle: "Software Engineer",
      companyName: "Acme Corp",
      employerEmail: "hr@acme.com",
      status: "APPROVED",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/job-postings");
  });

  test("2. rejecting requires a rejectionReason", async () => {
    await expect(rejectJobPosting(fd())).rejects.toThrow(
      "rejectionReason is required",
    );

    expect((await posting()).status).toBe("PENDING");
    expect(await audits()).toHaveLength(0);
    expect(mockSendModerationNotification).not.toHaveBeenCalled();
  });

  test("3. rejecting with reason sets status=REJECTED and persists rejectionReason", async () => {
    await rejectJobPosting(
      fd({ rejectionReason: "  Incomplete information  " }),
    );

    // 9. REGRESSION: the reason must be stored, not silently dropped.
    expect(await posting()).toMatchObject({
      status: "REJECTED",
      rejectionReason: "Incomplete information",
    });
    expect(mockSendModerationNotification).toHaveBeenCalledWith(
      expect.objectContaining({ status: "REJECTED" }),
    );
  });

  test("4. editAndApprove persists both edited fields and status change", async () => {
    await editAndApproveJobPosting(
      fd({
        title: "Senior Engineer",
        description: "Updated description",
        department: "Engineering",
        salaryMin: "50000",
        salaryMax: "80000",
      }),
    );

    expect(await posting()).toMatchObject({
      status: "APPROVED",
      title: "Senior Engineer",
      description: "Updated description",
      department: "Engineering",
      salaryMin: 50000,
      salaryMax: 80000,
    });
    expect(await audits()).toEqual([
      expect.objectContaining({
        action: "jobPosting.editAndApprove",
        metadata: expect.objectContaining({
          title: "Senior Engineer",
          editedFields: [
            "title",
            "description",
            "department",
            "salaryMin",
            "salaryMax",
          ],
        }),
      }),
    ]);
    expect(mockSendModerationNotification).toHaveBeenCalledWith({
      jobTitle: "Senior Engineer",
      companyName: "Acme Corp",
      employerEmail: "hr@acme.com",
      status: "APPROVED",
    });
  });

  test("editAndApprove leaves blank fields unchanged", async () => {
    await editAndApproveJobPosting(fd({ title: "  ", description: "" }));

    expect(await posting()).toMatchObject({
      status: "APPROVED",
      title: "Software Engineer",
    });
  });

  test("approving an unknown posting fails without auditing or emailing", async () => {
    await expect(
      approveJobPosting(form({ postingId: "missing", locale: "en" })),
    ).rejects.toThrow("Job posting not found");
    expect(await audits()).toHaveLength(0);
    expect(mockSendModerationNotification).not.toHaveBeenCalled();
  });
});

describe("permissions", () => {
  test("5. Centre Staff without a permission row cannot approve", async () => {
    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));

    await expect(approveJobPosting(fd())).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect((await posting()).status).toBe("PENDING");
    expect(await audits()).toHaveLength(0);
    expect(mockSendModerationNotification).not.toHaveBeenCalled();
  });

  test("6. Centre Staff with canApproveJobPostings=false is denied approve", async () => {
    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
    await insertStaff(pg, "staff_1", { canApproveJobPostings: false });

    await expect(approveJobPosting(fd())).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect((await posting()).status).toBe("PENDING");
  });

  test("7. Centre Staff WITH canApproveJobPostings=true can approve", async () => {
    mockAuth.mockResolvedValue(session("staff_with_perm", "CENTRE_STAFF"));
    await insertStaff(pg, "staff_with_perm", { canApproveJobPostings: true });

    await approveJobPosting(fd());

    expect((await posting()).status).toBe("APPROVED");
    expect(await audits()).toEqual([
      expect.objectContaining({
        actorUserId: "staff_with_perm",
        actorRole: "CENTRE_STAFF",
      }),
    ]);
  });

  test("a deactivated Centre Staff member is denied even with the permission", async () => {
    mockAuth.mockResolvedValue(session("gone_staff", "CENTRE_STAFF"));
    await insertStaff(pg, "gone_staff", { canApproveJobPostings: true });
    const { user } = await import("@/db/schema");
    await pg.update(user).set({ deactivatedAt: new Date() });

    await expect(approveJobPosting(fd())).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect((await posting()).status).toBe("PENDING");
  });

  test("8. Super Admin always passes regardless of StaffPermission row", async () => {
    await approveJobPosting(fd());

    expect((await posting()).status).toBe("APPROVED");
  });
});
