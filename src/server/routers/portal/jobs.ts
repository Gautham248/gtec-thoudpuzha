import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { application } from "@/db/schema";
import { withProfileLists } from "@/db/helpers";
import { Role, getEffectiveRole } from "@/lib/auth";
import { isProfileComplete } from "@/lib/biodata";
import { form, locale, text } from "@/server/form";
import { publicProcedure, router } from "@/server/trpc";

export const jobsRouter = router({
  /** A student or job seeker with a complete profile applies to a posting. */
  applyToJob: publicProcedure
    .input(form({ locale: locale(), jobPostingId: text() }))
    .mutation(
      async ({ input }): Promise<{ error?: string; applied?: boolean }> => {
        const session = await auth();
        if (!session.userId) {
          return { error: "Unauthenticated" };
        }

        const role = await getEffectiveRole(session);
        if (!role || (role !== Role.STUDENT && role !== Role.JOB_SEEKER)) {
          return { error: "Forbidden" };
        }

        const { jobPostingId } = input;
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

        // The unique (jobPostingId, candidateProfileId) index settles a
        // concurrent double-submit that got past the check above.
        const inserted = await db
          .insert(application)
          .values({ jobPostingId, candidateProfileId: profile.id })
          .onConflictDoNothing({
            target: [application.jobPostingId, application.candidateProfileId],
          })
          .returning({ id: application.id });
        if (inserted.length === 0) {
          return { error: "Already applied" };
        }

        revalidatePath(`/${input.locale}/portal/jobs/${jobPostingId}`);
        return { applied: true };
      },
    ),
});
