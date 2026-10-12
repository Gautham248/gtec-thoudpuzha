"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { application } from "@/db/schema";
import { Role, getEffectiveRole } from "@/lib/auth";
import type { ApplicationStatus } from "@/db/types";

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session.userId) return { error: "Unauthenticated" };

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) return { error: "Forbidden" };

  const app = await db.query.application.findFirst({
    where: (a, { eq }) => eq(a.id, applicationId),
    with: {
      jobPosting: { columns: { employerId: true } },
    },
  });
  if (!app) return { error: "Application not found" };

  const profile = await db.query.employerProfile.findFirst({
    where: (e, { eq }) => eq(e.userId, session.userId!),
  });
  if (!profile || profile.id !== app.jobPosting.employerId) {
    return { error: "Forbidden" };
  }

  await db
    .update(application)
    .set({ status: newStatus, statusUpdatedAt: new Date() })
    .where(eq(application.id, applicationId));

  revalidatePath("/portal/employer");
  return { success: true };
}
