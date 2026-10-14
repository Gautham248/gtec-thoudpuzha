import { auth as clerkAuth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { fetchRoleFromApi } from "@/lib/role-fallback";

export enum Role {
  STUDENT = "STUDENT",
  JOB_SEEKER = "JOB_SEEKER",
  EMPLOYER = "EMPLOYER",
  CENTRE_STAFF = "CENTRE_STAFF",
  SUPER_ADMIN = "SUPER_ADMIN",
}

/**
 * Reads the user's role with the stale-JWT-claim fallback applied.
 *
 * THE SINGLE SOURCE OF TRUTH for "what is this user's role right now" —
 * every page and Server Action that needs the role should call this
 * instead of reading `session.sessionClaims?.metadata?.role` directly.
 *
 * Background: Clerk's JWT session claims can lag up to ~60s behind a
 * role that was just set (e.g. via updateUserMetadata during sign-up).
 * Reading the raw claim directly reproduces that race — this was found
 * and patched three separate times in three different files
 * (middleware.ts, then requireRole()/requirePermission(), then
 * saveBiodata()) before it was clear the fix needed to be structural,
 * not file-by-file. See 04_AUTH_DEBUGGING_LOG.md. Nineteen other files
 * were found still reading the raw claim when this was written — if
 * you're adding a new role check, this is why that pattern is banned.
 *
 * Returns `undefined` if the user has no role in either the JWT or the
 * Backend API (including if userId is missing from the session).
 */
export async function getEffectiveRole(
  session: Pick<
    Awaited<ReturnType<typeof clerkAuth>>,
    "userId" | "sessionClaims"
  >,
): Promise<Role | undefined> {
  if (!session.userId) return undefined;

  const claimRole = session.sessionClaims?.metadata?.role as Role | undefined;
  if (claimRole) return claimRole;

  const apiRole = await fetchRoleFromApi(session.userId);
  return apiRole as Role | undefined;
}

export type RequireRoleResult =
  | {
      authorized: false;
      reason: "unauthenticated" | "no_role" | "forbidden" | "deactivated";
    }
  | { authorized: true; role: Role; userId: string };

export async function requireRole(
  allowedRoles: Role[],
): Promise<RequireRoleResult> {
  const session = await clerkAuth();

  if (!session.userId) {
    return { authorized: false, reason: "unauthenticated" };
  }

  const role = await getEffectiveRole(session);

  if (!role) {
    return { authorized: false, reason: "no_role" };
  }

  if (!allowedRoles.includes(role)) {
    return { authorized: false, reason: "forbidden" };
  }

  // Deactivation check — enforced even for valid roles
  if (role === Role.CENTRE_STAFF || role === Role.SUPER_ADMIN) {
    const user = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, session.userId!),
      columns: { deactivatedAt: true },
    });
    if (user?.deactivatedAt) {
      return { authorized: false, reason: "deactivated" };
    }
  }

  return { authorized: true, role, userId: session.userId };
}

/**
 * Portal-specific role gate — same check as requireRole but semantically
 * distinct so callers can render a friendly "this area isn't for your
 * account type" message instead of a hard 403 redirect.
 */
export async function requirePortalRole(
  allowedRoles: Role[],
): Promise<RequireRoleResult> {
  return requireRole(allowedRoles);
}

export type PermissionKey = keyof typeof StaffPermissionKeys;

export const StaffPermissionKeys = {
  canEditCourses: "canEditCourses",
  canEditGallery: "canEditGallery",
  canEditCertificationPartners: "canEditCertificationPartners",
  canEditNewsEvents: "canEditNewsEvents",
  canEditFlashNews: "canEditFlashNews",
  canProvisionStudents: "canProvisionStudents",
  canApproveEmployers: "canApproveEmployers",
  canApproveJobPostings: "canApproveJobPostings",
  canModerateSkillsTaxonomy: "canModerateSkillsTaxonomy",
} as const;

export type RequirePermissionResult =
  | {
      authorized: false;
      reason:
        | "unauthenticated"
        | "no_role"
        | "forbidden"
        | "deactivated"
        | "no_permission";
    }
  | { authorized: true; role: Role; userId: string };

/**
 * Check if the current user has a specific permission.
 * Super Admin always passes regardless of StaffPermission row state.
 * Centre Staff must have the specific boolean flag set to true in their StaffPermission row.
 */
export async function requirePermission(
  permissionKey: PermissionKey,
): Promise<RequirePermissionResult> {
  const session = await clerkAuth();

  if (!session.userId) {
    return { authorized: false, reason: "unauthenticated" };
  }

  const role = await getEffectiveRole(session);

  if (!role) {
    return { authorized: false, reason: "no_role" };
  }

  if (role !== Role.CENTRE_STAFF && role !== Role.SUPER_ADMIN) {
    return { authorized: false, reason: "forbidden" };
  }

  // Deactivation check
  const user = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, session.userId!),
    columns: { deactivatedAt: true },
  });
  if (user?.deactivatedAt) {
    return { authorized: false, reason: "deactivated" };
  }

  // Super Admin always passes
  if (role === Role.SUPER_ADMIN) {
    return { authorized: true, role, userId: session.userId };
  }

  // Centre Staff — check the specific permission flag
  const permission = await db.query.staffPermission.findFirst({
    where: (p, { eq }) => eq(p.userId, session.userId!),
  });

  if (!permission || !permission[permissionKey]) {
    return { authorized: false, reason: "no_permission" };
  }

  return { authorized: true, role, userId: session.userId };
}

/**
 * Fetches all staff permissions in a single DB query.
 * Super Admin should bypass this — they always have all permissions.
 */
export async function getAllStaffPermissions(
  userId: string,
): Promise<Record<PermissionKey, boolean>> {
  const permission = await db.query.staffPermission.findFirst({
    where: (p, { eq }) => eq(p.userId, userId),
  });
  if (!permission) {
    return {
      canEditCourses: false,
      canEditGallery: false,
      canEditCertificationPartners: false,
      canEditNewsEvents: false,
      canEditFlashNews: false,
      canProvisionStudents: false,
      canApproveEmployers: false,
      canApproveJobPostings: false,
      canModerateSkillsTaxonomy: false,
    };
  }
  return {
    canEditCourses: permission.canEditCourses,
    canEditGallery: permission.canEditGallery,
    canEditCertificationPartners: permission.canEditCertificationPartners,
    canEditNewsEvents: permission.canEditNewsEvents,
    canEditFlashNews: permission.canEditFlashNews,
    canProvisionStudents: permission.canProvisionStudents,
    canApproveEmployers: permission.canApproveEmployers,
    canApproveJobPostings: permission.canApproveJobPostings,
    canModerateSkillsTaxonomy: permission.canModerateSkillsTaxonomy,
  };
}
