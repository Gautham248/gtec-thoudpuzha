/**
 * tRPC core: the procedure builders every router uses.
 *
 * The routers run on the server only. Pages keep posting plain <form>s to
 * Server Actions, and each action is a thin wrapper that calls its procedure
 * through `api()` (see ./action.ts). No HTTP endpoint is exposed.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import {
  requirePermission,
  requireRole,
  Role,
  type PermissionKey,
} from "@/lib/auth";

const t = initTRPC.create({ isServer: true });

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

/** No auth check; procedures that do their own (or need none) start here. */
export const publicProcedure = t.procedure;

type DeniedReason =
  "unauthenticated" | "no_role" | "forbidden" | "deactivated" | "no_permission";

function deny(reason: DeniedReason): never {
  throw new TRPCError({
    code: reason === "unauthenticated" ? "UNAUTHORIZED" : "FORBIDDEN",
    message: reason,
  });
}

/** Signed-in users holding one of `roles` (staff must not be deactivated). */
export function roleProcedure(roles: Role[]) {
  return t.procedure.use(async ({ next }) => {
    const auth = await requireRole(roles);
    if (!auth.authorized) deny(auth.reason);
    return next({ ctx: { userId: auth.userId, role: auth.role } });
  });
}

/** Centre Staff and Super Admin. */
export const staffProcedure = roleProcedure([
  Role.CENTRE_STAFF,
  Role.SUPER_ADMIN,
]);

/** Super Admin only. */
export const superAdminProcedure = roleProcedure([Role.SUPER_ADMIN]);

/** Super Admin, or Centre Staff holding the given permission flag. */
export function permissionProcedure(permission: PermissionKey) {
  return t.procedure.use(async ({ next }) => {
    const auth = await requirePermission(permission);
    if (!auth.authorized) deny(auth.reason);
    return next({ ctx: { userId: auth.userId, role: auth.role } });
  });
}

export { Role };
export type { DeniedReason };
