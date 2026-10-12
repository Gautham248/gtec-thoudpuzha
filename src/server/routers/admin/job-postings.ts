import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobPosting } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { sendJobPostingModerationNotification } from "@/lib/email";
import { form, locale, text } from "@/server/form";
import { permissionProcedure, router } from "@/server/trpc";

const moderator = permissionProcedure("canApproveJobPostings");

const revalidate = (locale: string) =>
  revalidatePath(`/${locale}/admin/job-postings`);

/** Update a posting (failing if it doesn't exist) and return it with its employer. */
async function updatePosting(
  postingId: string,
  data: Partial<typeof jobPosting.$inferInsert>,
) {
  expectRow(
    await db
      .update(jobPosting)
      .set(data)
      .where(eq(jobPosting.id, postingId))
      .returning({ id: jobPosting.id }),
    "Job posting",
  );
  const posting = await db.query.jobPosting.findFirst({
    where: (p, { eq }) => eq(p.id, postingId),
    with: { employer: true },
  });
  return posting!;
}

export const jobPostingsRouter = router({
  approve: moderator
    .input(form({ locale: locale(), postingId: text() }))
    .mutation(async ({ ctx, input }) => {
      const { postingId } = input;
      if (!postingId) throw new Error("postingId is required");

      const posting = await updatePosting(postingId, { status: "APPROVED" });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "jobPosting.approve",
        entityType: "JobPosting",
        entityId: posting.id,
        metadata: {
          title: posting.title,
          companyName: posting.employer.companyName,
        },
      });

      await sendJobPostingModerationNotification({
        jobTitle: posting.title,
        companyName: posting.employer.companyName,
        employerEmail: posting.employer.email,
        status: "APPROVED",
      });

      revalidate(input.locale);
    }),

  reject: moderator
    .input(
      form({ locale: locale(), postingId: text(), rejectionReason: text() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postingId, rejectionReason } = input;

      if (!postingId) throw new Error("postingId is required");
      if (!rejectionReason?.trim()) {
        throw new Error("rejectionReason is required");
      }

      const posting = await updatePosting(postingId, {
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
      });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "jobPosting.reject",
        entityType: "JobPosting",
        entityId: posting.id,
        metadata: {
          title: posting.title,
          rejectionReason: rejectionReason.trim(),
        },
      });

      await sendJobPostingModerationNotification({
        jobTitle: posting.title,
        companyName: posting.employer.companyName,
        employerEmail: posting.employer.email,
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
      });

      revalidate(input.locale);
    }),

  editAndApprove: moderator
    .input(
      form({
        locale: locale(),
        postingId: text(),
        title: text(),
        description: text(),
        department: text(),
        salaryMin: text(),
        salaryMax: text(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        postingId,
        title,
        description,
        department,
        salaryMin,
        salaryMax,
      } = input;
      if (!postingId) throw new Error("postingId is required");

      const data: Partial<typeof jobPosting.$inferInsert> = {
        status: "APPROVED",
      };
      if (title?.trim()) data.title = title.trim();
      if (description?.trim()) data.description = description.trim();
      if (department?.trim()) data.department = department.trim();
      if (salaryMin) data.salaryMin = parseInt(salaryMin, 10);
      if (salaryMax) data.salaryMax = parseInt(salaryMax, 10);

      const posting = await updatePosting(postingId, data);

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "jobPosting.editAndApprove",
        entityType: "JobPosting",
        entityId: posting.id,
        metadata: {
          title: posting.title,
          editedFields: Object.keys(data).filter((k) => k !== "status"),
        },
      });

      await sendJobPostingModerationNotification({
        jobTitle: posting.title,
        companyName: posting.employer.companyName,
        employerEmail: posting.employer.email,
        status: "APPROVED",
      });

      revalidate(input.locale);
    }),
});
