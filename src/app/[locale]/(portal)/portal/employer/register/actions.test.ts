// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { employerProfile } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertEmployer, insertUser } from "@/__tests__/pg-fixtures";
import { submitEmployerRegistration, updateEmployerProfile } from "./actions";

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockClerkClient = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockCheckRateLimit = vi.hoisted(() =>
  vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 })),
);
const mockGetClientIp = vi.hoisted(() =>
  vi.fn(() => Promise.resolve("127.0.0.1")),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: mockGetClientIp,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkClient: mockClerkClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

const pg = db as unknown as TestDb;

// ─── Helpers ────────────────────────────────────────────────────────────────

function validFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("companyName", overrides.companyName ?? "Acme Corp");
  fd.set("industrySector", overrides.industrySector ?? "IT_SOFTWARE");
  fd.set("contactPersonName", overrides.contactPersonName ?? "Jane Doe");
  fd.set("designation", overrides.designation ?? "HR Manager");
  fd.set("phone", overrides.phone ?? "9876543210");
  fd.set("email", overrides.email ?? "jane@acme.com");
  fd.set("companyAddress", overrides.companyAddress ?? "123 Main St");
  fd.set("hasWebsite", overrides.hasWebsite ?? "no");
  fd.set("employeeCountRange", overrides.employeeCountRange ?? "RANGE_11_50");
  fd.set("aboutCompany", overrides.aboutCompany ?? "A software company.");
  if (overrides.websiteUrl !== undefined) {
    fd.set("websiteUrl", overrides.websiteUrl);
  }
  return fd;
}

const profiles = () => pg.select().from(employerProfile);

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  await insertUser(pg, { id: "user_employer_1", role: "EMPLOYER" });
  mockAuth.mockResolvedValue({
    userId: "user_employer_1",
    sessionClaims: { metadata: { role: "EMPLOYER" } },
  });
});

describe("submitEmployerRegistration", () => {
  test("1. Submitting with 'No website' selected succeeds without a URL", async () => {
    await expect(
      submitEmployerRegistration(validFormData({ hasWebsite: "no" })),
    ).rejects.toThrow("redirect:/portal/employer/register/status");

    expect(await profiles()).toEqual([
      expect.objectContaining({
        userId: "user_employer_1",
        companyName: "Acme Corp",
        hasWebsite: false,
        websiteUrl: null,
      }),
    ]);
  });

  test("2. Submitting with 'Add link' but no URL provided is rejected server-side", async () => {
    const result = await submitEmployerRegistration(
      validFormData({ hasWebsite: "yes", websiteUrl: "" }),
    );

    expect(result?.success).toBe(false);
    expect(result?.error).toContain("website URL");
    expect(await profiles()).toHaveLength(0);
  });

  test("3. A newly registered employer has status=PENDING and autoPublishTrusted=false by default", async () => {
    await expect(submitEmployerRegistration(validFormData())).rejects.toThrow(
      "redirect:/portal/employer/register/status",
    );

    expect(await profiles()).toEqual([
      expect.objectContaining({ status: "PENDING", autoPublishTrusted: false }),
    ]);
  });

  test("5. An employer who already has an EmployerProfile cannot submit the registration form again", async () => {
    await insertEmployer(pg, {
      userId: "user_employer_1",
      status: "PENDING",
      companyName: "First",
    });

    await expect(submitEmployerRegistration(validFormData())).rejects.toThrow(
      "redirect:/portal/employer/register/status",
    );

    expect((await profiles()).map((p) => p.companyName)).toEqual(["First"]);
  });
});

describe("updateEmployerProfile", () => {
  test("updates the signed-in employer's own profile", async () => {
    await insertEmployer(pg, {
      userId: "user_employer_1",
      companyName: "Old Name",
    });

    const result = await updateEmployerProfile(
      validFormData({
        companyName: "New Name",
        hasWebsite: "yes",
        websiteUrl: "https://new.example",
      }),
    );

    expect(result?.success).not.toBe(false);
    expect(await profiles()).toEqual([
      expect.objectContaining({
        companyName: "New Name",
        hasWebsite: true,
        websiteUrl: "https://new.example",
      }),
    ]);
  });

  test("an employer without a profile is sent to registration", async () => {
    await expect(updateEmployerProfile(validFormData())).rejects.toThrow(
      "redirect:/portal/employer/register",
    );
  });
});
