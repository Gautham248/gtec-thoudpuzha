"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  requireRole,
  Role,
  StaffPermissionKeys,
  type PermissionKey,
} from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staffPermission, user } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { clerkClient } from "@clerk/nextjs/server";
import { logAdminAction } from "@/lib/audit";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

export async function inviteStaff(formData: FormData) {
  const authResult = await requireRole([Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const email = formData.get("email") as string;
  const locale = localeFromFormData(formData);

  const clerk = await clerkClient();
  await clerk.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role: Role.CENTRE_STAFF },
    redirectUrl: `/${locale}/complete-signup`,
  });

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "staff.invite",
    entityType: "User",
    entityId: email,
    metadata: { email, invitedRole: Role.CENTRE_STAFF },
  });

  revalidatePath(`/${locale}/admin/staff`);
}

export async function deactivateStaff(formData: FormData) {
  const authResult = await requireRole([Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const userId = formData.get("userId") as string;
  const locale = localeFromFormData(formData);

  expectRow(
    await db
      .update(user)
      .set({ deactivatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({ id: user.id }),
    "User",
  );

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "staff.deactivate",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath(`/${locale}/admin/staff`);
}

export async function reactivateStaff(formData: FormData) {
  const authResult = await requireRole([Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const userId = formData.get("userId") as string;
  const locale = localeFromFormData(formData);

  expectRow(
    await db
      .update(user)
      .set({ deactivatedAt: null })
      .where(eq(user.id, userId))
      .returning({ id: user.id }),
    "User",
  );

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "staff.reactivate",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath(`/${locale}/admin/staff`);
}

export async function setStaffPermission(formData: FormData) {
  const authResult = await requireRole([Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const targetUserId = formData.get("userId") as string;
  const permissionKey = formData.get("permissionKey") as PermissionKey;
  const value = formData.get("value") === "true";

  if (!targetUserId || !permissionKey) {
    throw new Error("userId and permissionKey are required");
  }

  if (!(permissionKey in StaffPermissionKeys)) {
    throw new Error(`Invalid permission key: ${permissionKey}`);
  }

  await db
    .insert(staffPermission)
    .values({ userId: targetUserId, [permissionKey]: value })
    .onConflictDoUpdate({
      target: staffPermission.userId,
      set: { [permissionKey]: value },
    });

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "staffPermission.set",
    entityType: "StaffPermission",
    entityId: targetUserId,
    metadata: { permissionKey, value, targetUserId },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/staff`);
}
