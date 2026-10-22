import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { application, applicationStatus } from "@/db/schema";
import {
  canTransition,
  type ApplicationErrorCode,
} from "@/lib/application-status";
import { Role, getEffectiveRole } from "@/lib/auth";
import { publicProcedure, router } from "@/server/trpc";

type Result = { error?: ApplicationErrorCode; success?: boolean };

/**
 * Load an application on one of the signed-in employer's own postings, or
 * the error code explaining why it can't be acted on.
 */
async function loadOwnedApplication(applicationId: string) {
  const session = await auth();
  if (!session.userId) return { error: "UNAUTHENTICATED" as const };

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) return { error: "FORBIDDEN" as const };

  const app = await db.query.application.findFirst({
    where: (a, { eq }) => eq(a.id, applicationId),
    with: {
      jobPosting: { columns: { employerId: true } },
    },
  });
  if (!app) return { error: "NOT_FOUND" as const };

  const profile = await db.query.employerProfile.findFirst({
    where: (e, { eq }) => eq(e.userId, session.userId!),
  });
  if (!profile || profile.id !== app.jobPosting.employerId) {
    return { error: "FORBIDDEN" as const };
  }

  return { app };
}

// Every locale's employer pages, including the applicants list.
const revalidateEmployerPortal = () =>
  revalidatePath("/[locale]/portal/employer", "layout");

export const applicantsRouter = router({
  /** An employer moves an application on one of their own postings. */
  updateStatus: publicProcedure
    .input(
      z.object({
        applicationId: z.string(),
        status: z.enum(applicationStatus.enumValues),
      }),
    )
    .mutation(async ({ input }): Promise<Result> => {
      const { applicationId, status } = input;
      const loaded = await loadOwnedApplication(applicationId);
      if (loaded.error) return { error: loaded.error };

      if (!canTransition(loaded.app.status, status)) {
        return { error: "INVALID_TRANSITION" };
      }

      // Guard on the status we checked, so a concurrent change can't be
      // overwritten with a transition that is no longer allowed.
      const updated = await db
        .update(application)
        .set({ status, statusUpdatedAt: new Date() })
        .where(
          and(
            eq(application.id, applicationId),
            eq(application.status, loaded.app.status),
          ),
        )
        .returning({ id: application.id });
      if (updated.length === 0) return { error: "INVALID_TRANSITION" };

      revalidateEmployerPortal();
      return { success: true };
    }),

  /**
   * The employer opened this applicant's profile. Moves APPLIED to VIEWED and
   * leaves any later status alone, so opening it again is a no-op.
   */
  markViewed: publicProcedure
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ input }): Promise<Result> => {
      const loaded = await loadOwnedApplication(input.applicationId);
      if (loaded.error) return { error: loaded.error };
      if (loaded.app.status !== "APPLIED") return { success: true };

      await db
        .update(application)
        .set({ status: "VIEWED", statusUpdatedAt: new Date() })
        .where(
          and(
            eq(application.id, input.applicationId),
            eq(application.status, "APPLIED"),
          ),
        );

      revalidateEmployerPortal();
      return { success: true };
    }),
});
