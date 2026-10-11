"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, StaffPermissionKeys } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { employerProfile } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { sendEmployerModerationNotification } from "@/lib/email";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

export async function approveEmployer(formData: FormData) {
  const authResult = await requirePermission(
    StaffPermissionKeys.canApproveEmployers,
  );
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const profileId = formData.get("profileId") as string;
  if (!profileId) throw new Error("profileId is required");

  const profile = expectRow(
    await db
      .update(employerProfile)
      .set({ status: "APPROVED", rejectionReason: null })
      .where(eq(employerProfile.id, profileId))
      .returning(),
    "Employer profile",
  );

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "employerProfile.approve",
    entityType: "EmployerProfile",
    entityId: profile.id,
    metadata: { companyName: profile.companyName },
  });

  await sendEmployerModerationNotification({
    companyName: profile.companyName,
    contactPersonName: profile.contactPersonName,
    employerEmail: profile.email,
    status: "APPROVED",
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/employers`);
}

export async function rejectEmployer(formData: FormData) {
  const authResult = await requirePermission(
    StaffPermissionKeys.canApproveEmployers,
  );
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const profileId = formData.get("profileId") as string;
  const rejectionReason = formData.get("rejectionReason") as string;

  if (!profileId) throw new Error("profileId is required");
  if (!rejectionReason?.trim()) {
    throw new Error("rejectionReason is required");
  }

  const profile = expectRow(
    await db
      .update(employerProfile)
      .set({ status: "REJECTED", rejectionReason: rejectionReason.trim() })
      .where(eq(employerProfile.id, profileId))
      .returning(),
    "Employer profile",
  );

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "employerProfile.reject",
    entityType: "EmployerProfile",
    entityId: profile.id,
    metadata: { companyName: profile.companyName, rejectionReason },
  });

  await sendEmployerModerationNotification({
    companyName: profile.companyName,
    contactPersonName: profile.contactPersonName,
    employerEmail: profile.email,
    status: "REJECTED",
    rejectionReason: rejectionReason.trim(),
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/employers`);
}

export async function approveAndTrustEmployer(formData: FormData) {
  const authResult = await requirePermission(
    StaffPermissionKeys.canApproveEmployers,
  );
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const profileId = formData.get("profileId") as string;
  if (!profileId) throw new Error("profileId is required");

  const profile = expectRow(
    await db
      .update(employerProfile)
      .set({
        status: "APPROVED",
        autoPublishTrusted: true,
        rejectionReason: null,
      })
      .where(eq(employerProfile.id, profileId))
      .returning(),
    "Employer profile",
  );

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "employerProfile.approveAndTrust",
    entityType: "EmployerProfile",
    entityId: profile.id,
    metadata: { companyName: profile.companyName, autoPublishTrusted: true },
  });

  await sendEmployerModerationNotification({
    companyName: profile.companyName,
    contactPersonName: profile.contactPersonName,
    employerEmail: profile.email,
    status: "APPROVED",
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/employers`);
}

export async function toggleAutoPublishTrusted(formData: FormData) {
  const authResult = await requirePermission(
    StaffPermissionKeys.canApproveEmployers,
  );
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const profileId = formData.get("profileId") as string;
  if (!profileId) throw new Error("profileId is required");

  const current = await db.query.employerProfile.findFirst({
    where: (e, { eq }) => eq(e.id, profileId),
  });
  if (!current) throw new Error("EmployerProfile not found");
  if (current.status !== "APPROVED") {
    throw new Error("Can only toggle autoPublishTrusted on APPROVED employers");
  }

  const nextValue = !current.autoPublishTrusted;

  await db
    .update(employerProfile)
    .set({ autoPublishTrusted: nextValue })
    .where(eq(employerProfile.id, profileId));

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: nextValue ? "employerProfile.trust" : "employerProfile.untrust",
    entityType: "EmployerProfile",
    entityId: profileId,
    metadata: { autoPublishTrusted: nextValue },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/employers`);
}
