import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { employerProfile } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { sendEmployerModerationNotification } from "@/lib/email";
import { form, locale, text } from "@/server/form";
import { permissionProcedure, router } from "@/server/trpc";

const moderator = permissionProcedure("canApproveEmployers");

const revalidate = (locale: string) =>
  revalidatePath(`/${locale}/admin/employers`);

const profileInput = form({ locale: locale(), profileId: text() });

export const employersRouter = router({
  approve: moderator.input(profileInput).mutation(async ({ ctx, input }) => {
    const { profileId } = input;
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
      actorUserId: ctx.userId,
      actorRole: ctx.role,
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

    revalidate(input.locale);
  }),

  reject: moderator
    .input(
      form({ locale: locale(), profileId: text(), rejectionReason: text() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { profileId, rejectionReason } = input;

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
        actorUserId: ctx.userId,
        actorRole: ctx.role,
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

      revalidate(input.locale);
    }),

  approveAndTrust: moderator
    .input(profileInput)
    .mutation(async ({ ctx, input }) => {
      const { profileId } = input;
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
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "employerProfile.approveAndTrust",
        entityType: "EmployerProfile",
        entityId: profile.id,
        metadata: {
          companyName: profile.companyName,
          autoPublishTrusted: true,
        },
      });

      await sendEmployerModerationNotification({
        companyName: profile.companyName,
        contactPersonName: profile.contactPersonName,
        employerEmail: profile.email,
        status: "APPROVED",
      });

      revalidate(input.locale);
    }),

  toggleAutoPublishTrusted: moderator
    .input(profileInput)
    .mutation(async ({ ctx, input }) => {
      const { profileId } = input;
      if (!profileId) throw new Error("profileId is required");

      const current = await db.query.employerProfile.findFirst({
        where: (e, { eq }) => eq(e.id, profileId),
      });
      if (!current) throw new Error("EmployerProfile not found");
      if (current.status !== "APPROVED") {
        throw new Error(
          "Can only toggle autoPublishTrusted on APPROVED employers",
        );
      }

      const nextValue = !current.autoPublishTrusted;

      await db
        .update(employerProfile)
        .set({ autoPublishTrusted: nextValue })
        .where(eq(employerProfile.id, profileId));

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: nextValue ? "employerProfile.trust" : "employerProfile.untrust",
        entityType: "EmployerProfile",
        entityId: profileId,
        metadata: { autoPublishTrusted: nextValue },
      });

      revalidate(input.locale);
    }),
});
