import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { application } from "@/db/schema";
import { withProfileLists } from "@/db/helpers";
import type { ApplicationErrorCode } from "@/lib/application-status";
import { Role, getEffectiveRole } from "@/lib/auth";
import { isProfileComplete } from "@/lib/biodata";
import { acceptingApplications } from "@/lib/jobs";
import { form, locale, text } from "@/server/form";
import { publicProcedure, router } from "@/server/trpc";

export const jobsRouter = router({
  /** A student or job seeker with a complete profile applies to a posting. */
  applyToJob: publicProcedure
    .input(form({ locale: locale(), jobPostingId: text() }))
    .mutation(
      async ({
        input,
      }): Promise<{ error?: ApplicationErrorCode; applied?: boolean }> => {
        const session = await auth();
        if (!session.userId) {
          return { error: "UNAUTHENTICATED" };
        }

        const role = await getEffectiveRole(session);
        if (!role || (role !== Role.STUDENT && role !== Role.JOB_SEEKER)) {
          return { error: "FORBIDDEN" };
        }

        const { jobPostingId } = input;
        if (!jobPostingId) return { error: "NOT_FOUND" };

        // The form only offers Apply on open postings, but the id comes from
        // the client: refuse pending, rejected, closed, expired or deleted ones.
        const posting = await db.query.jobPosting.findFirst({
          where: (p, ops) =>
            ops.and(ops.eq(p.id, jobPostingId), acceptingApplications(p, ops)),
          columns: { id: true },
        });
        if (!posting) return { error: "JOB_CLOSED" };

        const profile = await db.query.candidateProfile.findFirst({
          where: (p, { eq }) => eq(p.userId, session.userId!),
        });
        if (!profile) return { error: "PROFILE_INCOMPLETE" };
        if (
          !isProfileComplete({
            ...withProfileLists(profile),
            isVerifiedStudent: profile.isVerifiedStudent,
            studentRecordId: profile.studentRecordId,
          })
        ) {
          return { error: "PROFILE_INCOMPLETE" };
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
          return { error: "ALREADY_APPLIED" };
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
          return { error: "ALREADY_APPLIED" };
        }

        revalidatePath(`/${input.locale}/portal/jobs/${jobPostingId}`);
        return { applied: true };
      },
    ),
});
