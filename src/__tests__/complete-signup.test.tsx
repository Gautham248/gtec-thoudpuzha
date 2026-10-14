// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { candidateProfile, staffPermission, user } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  insertStaff,
  insertStudentProfile,
  insertUser,
} from "@/__tests__/pg-fixtures";
import CompleteSignupPage from "@/app/[locale]/complete-signup/page";

const mockAuth = vi.hoisted(() => vi.fn());
const mockClerkClient = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() => vi.fn());
const mockUpdateUserMetadata = vi.hoisted(() => vi.fn());

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

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

const pg = db as unknown as TestDb;

const visit = (searchParams: { intent?: string } = {}) =>
  CompleteSignupPage({
    searchParams: Promise.resolve(searchParams),
    params: Promise.resolve({ locale: "en" }),
  });

const users = () => pg.select({ id: user.id, role: user.role }).from(user);

describe("CompleteSignupPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
    mockClerkClient.mockResolvedValue({
      users: {
        getUser: mockGetUser,
        updateUserMetadata: mockUpdateUserMetadata,
      },
    });
    mockGetUser.mockResolvedValue({ publicMetadata: {} });
  });

  test("1. STAFF-invited user gets DB rows created and is redirected to /admin", async () => {
    mockAuth.mockResolvedValue({ userId: "invited_staff", sessionClaims: {} });
    mockGetUser.mockResolvedValue({ publicMetadata: { role: "CENTRE_STAFF" } });

    await expect(visit()).rejects.toThrow("redirect:/en/admin");

    expect(await users()).toEqual([
      { id: "invited_staff", role: "CENTRE_STAFF" },
    ]);
    expect(await pg.select().from(staffPermission)).toEqual([
      expect.objectContaining({
        userId: "invited_staff",
        canEditCourses: true,
      }),
    ]);
  });

  test("2. STAFF-invited user with existing StaffPermission row does not duplicate or reset it", async () => {
    await insertStaff(pg, "invited_staff", { canEditCourses: false });
    mockAuth.mockResolvedValue({ userId: "invited_staff", sessionClaims: {} });
    mockGetUser.mockResolvedValue({ publicMetadata: { role: "CENTRE_STAFF" } });

    await expect(visit()).rejects.toThrow("redirect:/en/admin");

    const permissions = await pg.select().from(staffPermission);
    expect(permissions).toHaveLength(1);
    expect(permissions[0].canEditCourses).toBe(false); // existing choice kept
  });

  test("3. job_seeker intent still works — creates profile and redirects to biodata", async () => {
    mockAuth.mockResolvedValue({ userId: "js_1", sessionClaims: {} });

    await expect(visit({ intent: "job_seeker" })).rejects.toThrow(
      "redirect:/en/portal/student/biodata",
    );

    expect(mockUpdateUserMetadata).toHaveBeenCalledWith("js_1", {
      publicMetadata: { role: "JOB_SEEKER" },
    });
    expect(await users()).toEqual([{ id: "js_1", role: "JOB_SEEKER" }]);
    expect(await pg.select().from(candidateProfile)).toEqual([
      expect.objectContaining({ userId: "js_1", isVerifiedStudent: false }),
    ]);
  });

  test("job_seeker visiting again keeps their existing profile", async () => {
    await insertUser(pg, { id: "js_1", role: "JOB_SEEKER" });
    await insertStudentProfile(pg, {
      userId: "js_1",
      fullName: "Already Filled",
    });
    mockAuth.mockResolvedValue({ userId: "js_1", sessionClaims: {} });

    await expect(visit({ intent: "job_seeker" })).rejects.toThrow("redirect:");

    expect(await pg.select().from(candidateProfile)).toEqual([
      expect.objectContaining({ fullName: "Already Filled" }),
    ]);
  });

  test("4. employer intent still works — redirects to employer register", async () => {
    mockAuth.mockResolvedValue({ userId: "emp_1", sessionClaims: {} });

    await expect(visit({ intent: "employer" })).rejects.toThrow(
      "redirect:/en/portal/employer/register",
    );

    expect(mockUpdateUserMetadata).toHaveBeenCalledWith("emp_1", {
      publicMetadata: { role: "EMPLOYER" },
    });
    expect(await users()).toEqual([{ id: "emp_1", role: "EMPLOYER" }]);
  });

  test("5. No intent and no invited role redirects to homepage", async () => {
    mockAuth.mockResolvedValue({ userId: "unknown_user", sessionClaims: {} });

    await expect(visit()).rejects.toThrow("redirect:/en");

    expect(await users()).toEqual([]);
  });

  test("6. Unauthenticated user is redirected to /sign-in", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(visit()).rejects.toThrow("redirect:/sign-in");
  });
});
