// @vitest-environment node
// Every admin procedure enforces its access rule before touching input or data.
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { auditLogEntry } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertStaff, insertUser, session } from "@/__tests__/pg-fixtures";
import { appRouter } from "./_app";
import { createCallerFactory } from "@/server/trpc";

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@/lib/role-fallback", () => ({ fetchRoleFromApi: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const pg = db as unknown as TestDb;
const caller = createCallerFactory(appRouter)({});

type Procedure = (input: unknown) => Promise<unknown>;

function procedure(path: string): Procedure {
  let node: unknown = caller;
  for (const key of path.split(".")) {
    node = (node as Record<string, unknown>)[key];
  }
  return node as Procedure;
}

const adminPaths = Object.keys(appRouter._def.procedures).filter(
  (path) => path.startsWith("admin.") && path !== "admin.courseContent.get",
);

const SUPER_ADMIN_ONLY = ["admin.settings.", "admin.staff."];
const PERMISSION_GATED = {
  "admin.employers.": "canApproveEmployers",
  "admin.jobPostings.": "canApproveJobPostings",
} as const;

const superAdminOnly = adminPaths.filter((p) =>
  SUPER_ADMIN_ONLY.some((prefix) => p.startsWith(prefix)),
);
const permissionGated = adminPaths.filter((p) =>
  Object.keys(PERMISSION_GATED).some((prefix) => p.startsWith(prefix)),
);
const staffOpen = adminPaths.filter(
  (p) => !superAdminOnly.includes(p) && !permissionGated.includes(p),
);

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
});

describe("admin procedures", () => {
  test("cover every admin area", () => {
    expect(adminPaths.length).toBeGreaterThan(50);
  });

  test.each(adminPaths)("%s rejects a signed-out caller", async (path) => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });

    await expect(procedure(path)({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test.each(adminPaths)("%s rejects a student", async (path) => {
    mockAuth.mockResolvedValue(session("student_1", "STUDENT"));

    await expect(procedure(path)({})).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "forbidden",
    });
    expect(await pg.select().from(auditLogEntry)).toEqual([]);
  });

  test.each(adminPaths)("%s rejects deactivated staff", async (path) => {
    await insertUser(pg, {
      id: "staff_1",
      role: "SUPER_ADMIN",
      deactivatedAt: new Date(),
    });
    mockAuth.mockResolvedValue(session("staff_1", "SUPER_ADMIN"));

    await expect(procedure(path)({})).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "deactivated",
    });
  });

  test.each(superAdminOnly)(
    "%s is for Super Admins only, even fully-permitted staff",
    async (path) => {
      await insertStaff(pg, "staff_1", {
        canApproveEmployers: true,
        canApproveJobPostings: true,
      });
      mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));

      await expect(procedure(path)({})).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    },
  );

  test.each(permissionGated)(
    "%s needs its permission flag for Centre Staff",
    async (path) => {
      await insertStaff(pg, "staff_1");
      mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));

      await expect(procedure(path)({})).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "no_permission",
      });
    },
  );

  test.each(staffOpen)(
    "%s lets Centre Staff past the auth check",
    async (path) => {
      await insertStaff(pg, "staff_1");
      mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));

      // Empty input then fails on validation or a missing row, never on auth.
      const error = await procedure(path)({}).catch((e: unknown) => e);
      expect(error).not.toMatchObject({ code: "FORBIDDEN" });
      expect(error).not.toMatchObject({ code: "UNAUTHORIZED" });
    },
  );
});
