import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { arrayContains, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { candidateProfile, jobPosting, skill as skillTable } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { form, locale, text } from "@/server/form";
import { router, staffProcedure } from "@/server/trpc";

const revalidate = (locale: string) =>
  revalidatePath(`/${locale}/admin/skills-taxonomy`);

export const skillsTaxonomyRouter = router({
  approve: staffProcedure
    .input(form({ locale: locale(), id: text() }))
    .mutation(async ({ ctx, input }) => {
      const skill = expectRow(
        await db
          .update(skillTable)
          .set({ status: "APPROVED" })
          .where(eq(skillTable.id, input.id))
          .returning(),
        "Skill",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "skill.approve",
        entityType: "Skill",
        entityId: skill.id,
        metadata: { label: skill.label },
      });

      revalidate(input.locale);
    }),

  merge: staffProcedure
    .input(form({ locale: locale(), sourceId: text(), targetId: text() }))
    .mutation(async ({ ctx, input }) => {
      const { sourceId, targetId, locale } = input;

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
        actorUserId: ctx.userId,
        actorRole: ctx.role,
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

      revalidate(locale);
    }),

  delete: staffProcedure
    .input(form({ locale: locale(), id: text() }))
    .mutation(async ({ ctx, input }) => {
      const { id, locale } = input;

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

      if (candidates.n > 0 || postings.n > 0) {
        // Blocked — redirect back without deleting
        redirect(`/${locale}/admin/skills-taxonomy`);
      }

      await db.delete(skillTable).where(eq(skillTable.id, id));

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "skill.delete",
        entityType: "Skill",
        entityId: id,
        metadata: { label: skill.label },
      });

      revalidate(locale);
    }),
});
