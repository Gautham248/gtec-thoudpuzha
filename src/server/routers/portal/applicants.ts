import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { application, applicationStatus } from "@/db/schema";
import { Role, getEffectiveRole } from "@/lib/auth";
import { publicProcedure, router } from "@/server/trpc";

export const applicantsRouter = router({
  /** An employer moves an application on one of their own postings. */
  updateStatus: publicProcedure
    .input(
      z.object({
        applicationId: z.string(),
        status: z.enum(applicationStatus.enumValues),
      }),
    )
    .mutation(
      async ({ input }): Promise<{ error?: string; success?: boolean }> => {
        const { applicationId, status } = input;
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
          .set({ status, statusUpdatedAt: new Date() })
          .where(eq(application.id, applicationId));

        revalidatePath("/portal/employer");
        return { success: true };
      },
    ),
});
