// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { auditLogEntry, user } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertUser } from "@/__tests__/pg-fixtures";
import { Role } from "@/lib/auth";
import { logAdminAction, logSystemAction } from "./audit";

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

beforeEach(() => truncateAll(pg));

describe("logAdminAction", () => {
  test("writes a row with all fields populated", async () => {
    await logAdminAction({
      actorUserId: "user_1",
      actorRole: Role.CENTRE_STAFF,
      action: "course.create",
      entityType: "Course",
      entityId: "course_1",
      metadata: { title: "New Course" },
    });

    const rows = await pg.select().from(auditLogEntry);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorUserId: "user_1",
      actorRole: "CENTRE_STAFF",
      action: "course.create",
      entityType: "Course",
      entityId: "course_1",
      metadata: { title: "New Course" },
    });
  });

  test("creates the actor's User row if missing, and refreshes its role if present", async () => {
    await logAdminAction({
      actorUserId: "new_actor",
      actorRole: Role.CENTRE_STAFF,
      action: "a",
      entityType: "E",
      entityId: "1",
    });
    await insertUser(pg, { id: "promoted", role: "CENTRE_STAFF" });
    await logAdminAction({
      actorUserId: "promoted",
      actorRole: Role.SUPER_ADMIN,
      action: "a",
      entityType: "E",
      entityId: "2",
    });

    const users = await pg.select({ id: user.id, role: user.role }).from(user);
    expect(users).toEqual(
      expect.arrayContaining([
        { id: "new_actor", role: "CENTRE_STAFF" },
        { id: "promoted", role: "SUPER_ADMIN" },
      ]),
    );
    expect(await pg.select().from(auditLogEntry)).toHaveLength(2);
  });

  test("does not throw when the database write fails", async () => {
    const insert = vi.spyOn(pg, "insert").mockImplementation(() => {
      throw new Error("DB unavailable");
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      logAdminAction({
        actorUserId: "user_2",
        actorRole: Role.SUPER_ADMIN,
        action: "user.ban",
        entityType: "User",
        entityId: "user_3",
      }),
    ).resolves.toBeUndefined();

    insert.mockRestore();
    consoleError.mockRestore();
  });
});

describe("logSystemAction", () => {
  test("writes a row with a null actor (system), no User row needed", async () => {
    await logSystemAction({
      action: "VACANCY_AUTO_CLOSE",
      entityType: "JobPosting",
      entityId: "jp_1",
      metadata: { title: "Dev" },
    });

    const [row] = await pg.select().from(auditLogEntry);
    expect(row).toMatchObject({
      actorUserId: null,
      actorRole: null,
      action: "VACANCY_AUTO_CLOSE",
      entityId: "jp_1",
      metadata: { title: "Dev" },
    });
    expect(await pg.select().from(user)).toHaveLength(0);
  });
});
