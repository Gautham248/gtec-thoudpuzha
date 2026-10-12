"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { arrayContains, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { candidateProfile, jobPosting, skill as skillTable } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

export async function approveSkill(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;

  const skill = expectRow(
    await db
      .update(skillTable)
      .set({ status: "APPROVED" })
      .where(eq(skillTable.id, id))
      .returning(),
    "Skill",
  );

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "skill.approve",
    entityType: "Skill",
    entityId: skill.id,
    metadata: { label: skill.label },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/skills-taxonomy`);
}

export async function mergeSkill(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const sourceId = formData.get("sourceId") as string;
  const targetId = formData.get("targetId") as string;
  const locale = localeFromFormData(formData);

  if (sourceId === targetId) return;

  const [sourceSkill, targetSkill] = await Promise.all([
    db.query.skill.findFirst({ where: (s, { eq }) => eq(s.id, sourceId) }),
    db.query.skill.findFirst({ where: (s, { eq }) => eq(s.id, targetId) }),
  ]);

  if (!sourceSkill || !targetSkill) {
    redirect(`/${locale}/admin/skills-taxonomy`);
  }

  const repoint = (skillIds: string[]) => {
    const next = skillIds.filter((s) => s !== sourceId);
    if (!next.includes(targetId)) next.push(targetId);
    return next;
  };

  // Re-point every reference and delete the source skill atomically, so a
  // failure part-way can't leave references to a deleted skill.
  const { candidateProfiles, jobPostings } = await db.transaction(
    async (tx) => {
      const candidateProfiles = await tx
        .select({
          id: candidateProfile.id,
          skillIds: candidateProfile.skillIds,
        })
        .from(candidateProfile)
        .where(arrayContains(candidateProfile.skillIds, [sourceId]));
      for (const profile of candidateProfiles) {
        await tx
          .update(candidateProfile)
          .set({ skillIds: repoint(profile.skillIds ?? []) })
          .where(eq(candidateProfile.id, profile.id));
      }

      const jobPostings = await tx
        .select({ id: jobPosting.id, skillIds: jobPosting.skillIds })
        .from(jobPosting)
        .where(arrayContains(jobPosting.skillIds, [sourceId]));
      for (const posting of jobPostings) {
        await tx
          .update(jobPosting)
          .set({ skillIds: repoint(posting.skillIds ?? []) })
          .where(eq(jobPosting.id, posting.id));
      }

      await tx.delete(skillTable).where(eq(skillTable.id, sourceId));
      return { candidateProfiles, jobPostings };
    },
  );

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "skill.merge",
    entityType: "Skill",
    entityId: sourceId,
    metadata: {
      mergedIntoId: targetId,
      sourceLabel: sourceSkill.label,
      targetLabel: targetSkill.label,
      repointedCandidateProfiles: candidateProfiles.length,
      repointedJobPostings: jobPostings.length,
    },
  });

  revalidatePath(`/${locale}/admin/skills-taxonomy`);
}

export async function deleteSkill(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const locale = localeFromFormData(formData);

  const skill = await db.query.skill.findFirst({
    where: (s, { eq }) => eq(s.id, id),
  });
  if (!skill) return;

  // Block deletion if skill has active references
  const [[candidates], [postings]] = await Promise.all([
    db
      .select({ n: count() })
      .from(candidateProfile)
      .where(arrayContains(candidateProfile.skillIds, [id])),
    db
      .select({ n: count() })
      .from(jobPosting)
      .where(arrayContains(jobPosting.skillIds, [id])),
  ]);
  const candidateCount = candidates.n;
  const jobPostingCount = postings.n;

  if (candidateCount > 0 || jobPostingCount > 0) {
    // Blocked — redirect back without deleting
    redirect(`/${locale}/admin/skills-taxonomy`);
  }

  await db.delete(skillTable).where(eq(skillTable.id, id));

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "skill.delete",
    entityType: "Skill",
    entityId: id,
    metadata: { label: skill.label },
  });

  revalidatePath(`/${locale}/admin/skills-taxonomy`);
}
