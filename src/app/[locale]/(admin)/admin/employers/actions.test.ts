// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { auditLogEntry, employerProfile } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  form,
  insertEmployer,
  insertStaff,
  session,
} from "@/__tests__/pg-fixtures";
import {
  approveAndTrustEmployer,
  approveEmployer,
  rejectEmployer,
  toggleAutoPublishTrusted,
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
  sendEmployerModerationNotification: mockSendModerationNotification,
}));

const pg = db as unknown as TestDb;

let employerId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  mockAuth.mockResolvedValue(session("super_admin_1", "SUPER_ADMIN"));
  employerId = (
    await insertEmployer(pg, {
      companyName: "Acme Corp",
      contactPersonName: "John Doe",
      email: "john@acme.com",
      status: "PENDING",
      rejectionReason: "old reason",
    })
  ).id;
});

const employer = async () =>
  (await pg.select().from(employerProfile)).find((e) => e.id === employerId)!;
const audits = () => pg.select().from(auditLogEntry);
const fd = (extra: Record<string, string> = {}) =>
  form({ profileId: employerId, locale: "en", ...extra });

describe("Super Admin moderation", () => {
  test("1. approving a PENDING employer sets status=APPROVED and sends notification", async () => {
    await approveEmployer(fd());

    expect(await employer()).toMatchObject({
      status: "APPROVED",
      rejectionReason: null,
    });
    expect(await audits()).toEqual([
      expect.objectContaining({
        actorUserId: "super_admin_1",
        actorRole: "SUPER_ADMIN",
        action: "employerProfile.approve",
        entityType: "EmployerProfile",
        entityId: employerId,
        metadata: { companyName: "Acme Corp" },
      }),
    ]);
    expect(mockSendModerationNotification).toHaveBeenCalledWith({
      companyName: "Acme Corp",
      contactPersonName: "John Doe",
      employerEmail: "john@acme.com",
      status: "APPROVED",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/employers");
  });

  test("2. rejecting requires a rejectionReason", async () => {
    await expect(rejectEmployer(fd())).rejects.toThrow(
      "rejectionReason is required",
    );

    expect((await employer()).status).toBe("PENDING");
    expect(await audits()).toHaveLength(0);
    expect(mockSendModerationNotification).not.toHaveBeenCalled();
  });

  test("rejecting with a reason stores the trimmed reason", async () => {
    await rejectEmployer(fd({ rejectionReason: "  Incomplete details  " }));

    expect(await employer()).toMatchObject({
      status: "REJECTED",
      rejectionReason: "Incomplete details",
    });
    expect(mockSendModerationNotification).toHaveBeenCalledWith(
      expect.objectContaining({ status: "REJECTED" }),
    );
  });

  test("3. approveAndTrust sets both status=APPROVED and autoPublishTrusted=true", async () => {
    await approveAndTrustEmployer(fd());

    expect(await employer()).toMatchObject({
      status: "APPROVED",
      autoPublishTrusted: true,
      rejectionReason: null,
    });
  });

  test("4. toggleAutoPublishTrusted flips the flag on an APPROVED employer", async () => {
    await pg.update(employerProfile).set({ status: "APPROVED" });

    await toggleAutoPublishTrusted(fd());
    expect((await employer()).autoPublishTrusted).toBe(true);

    await toggleAutoPublishTrusted(fd());
    expect((await employer()).autoPublishTrusted).toBe(false);
  });

  test("4b. toggleAutoPublishTrusted on a non-APPROVED employer throws", async () => {
    await expect(toggleAutoPublishTrusted(fd())).rejects.toThrow(
      "Can only toggle autoPublishTrusted on APPROVED employers",
    );
    expect((await employer()).autoPublishTrusted).toBe(false);
  });

  test("approving an unknown employer fails without auditing or emailing", async () => {
    await expect(
      approveEmployer(form({ profileId: "missing", locale: "en" })),
    ).rejects.toThrow("Employer profile not found");
    expect(await audits()).toHaveLength(0);
    expect(mockSendModerationNotification).not.toHaveBeenCalled();
  });
});

describe("permissions", () => {
  test.each([
    ["5. approve", approveEmployer],
    ["5b. reject", (f: FormData) => rejectEmployer(f)],
    ["5c. approveAndTrust", approveAndTrustEmployer],
    ["5d. toggleAutoPublishTrusted", toggleAutoPublishTrusted],
  ])(
    "%s is forbidden to Centre Staff without canApproveEmployers",
    async (_name, action) => {
      mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));

      await expect(action(fd({ rejectionReason: "x" }))).rejects.toThrow(
        "redirect:/en/forbidden",
      );

      expect(await employer()).toMatchObject({
        status: "PENDING",
        autoPublishTrusted: false,
      });
      expect(await audits()).toHaveLength(0);
      expect(mockSendModerationNotification).not.toHaveBeenCalled();
    },
  );

  test("6. Centre Staff with canApproveEmployers=false is denied approve", async () => {
    mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
    await insertStaff(pg, "staff_1", { canApproveEmployers: false });

    await expect(approveEmployer(fd())).rejects.toThrow(
      "redirect:/en/forbidden",
    );
    expect((await employer()).status).toBe("PENDING");
  });

  test("7. Centre Staff WITH canApproveEmployers=true can approve", async () => {
    mockAuth.mockResolvedValue(session("staff_with_perm", "CENTRE_STAFF"));
    await insertStaff(pg, "staff_with_perm", { canApproveEmployers: true });

    await approveEmployer(fd());

    expect((await employer()).status).toBe("APPROVED");
    expect(await audits()).toEqual([
      expect.objectContaining({
        actorUserId: "staff_with_perm",
        actorRole: "CENTRE_STAFF",
      }),
    ]);
  });

  test("8. Super Admin always passes regardless of StaffPermission row", async () => {
    await approveEmployer(fd());

    expect((await employer()).status).toBe("APPROVED");
    expect(await audits()).not.toHaveLength(0);
  });
});
