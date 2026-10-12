"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { application } from "@/db/schema";
import { Role, getEffectiveRole } from "@/lib/auth";
import { isProfileComplete } from "@/lib/biodata";
import { withProfileLists } from "@/db/helpers";

export async function applyToJob(
  formData: FormData,
): Promise<{ error?: string; applied?: boolean }> {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthenticated" };
  }

  const role = await getEffectiveRole(session);
  if (!role || (role !== Role.STUDENT && role !== Role.JOB_SEEKER)) {
    return { error: "Forbidden" };
  }

  const jobPostingId = formData.get("jobPostingId") as string;
  if (!jobPostingId) return { error: "jobPostingId is required" };

  const profile = await db.query.candidateProfile.findFirst({
    where: (p, { eq }) => eq(p.userId, session.userId!),
  });
  if (!profile) return { error: "Complete your profile to apply" };
  if (
    !isProfileComplete({
      ...withProfileLists(profile),
      isVerifiedStudent: profile.isVerifiedStudent,
      studentRecordId: profile.studentRecordId,
    })
  ) {
    return { error: "Complete your profile to apply" };
  }

  const existing = await db.query.application.findFirst({
    where: (a, { and, eq }) =>
      and(
        eq(a.jobPostingId, jobPostingId),
        eq(a.candidateProfileId, profile.id),
      ),
    columns: { id: true },
  });
  if (existing) {
    return { error: "Already applied" };
  }

  await db.insert(application).values({
    jobPostingId,
    candidateProfileId: profile.id,
  });

  revalidatePath(
    `/${(formData.get("locale") as string) || "en"}/portal/jobs/${jobPostingId}`,
  );
  return { applied: true };
}
