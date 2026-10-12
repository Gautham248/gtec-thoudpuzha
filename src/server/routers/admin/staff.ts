import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staffPermission, user } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { Role, StaffPermissionKeys, type PermissionKey } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { flag, form, locale, text } from "@/server/form";
import { router, superAdminProcedure } from "@/server/trpc";

const revalidate = (locale: string) => revalidatePath(`/${locale}/admin/staff`);

const userInput = form({ locale: locale(), userId: text() });

export const staffRouter = router({
  invite: superAdminProcedure
    .input(form({ locale: locale(), email: text() }))
    .mutation(async ({ ctx, input }) => {
      const { email, locale } = input;

      const clerk = await clerkClient();
      await clerk.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role: Role.CENTRE_STAFF },
        redirectUrl: `/${locale}/complete-signup`,
      });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "staff.invite",
        entityType: "User",
        entityId: email,
        metadata: { email, invitedRole: Role.CENTRE_STAFF },
      });

      revalidate(locale);
    }),

  deactivate: superAdminProcedure
    .input(userInput)
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .update(user)
          .set({ deactivatedAt: new Date() })
          .where(eq(user.id, input.userId))
          .returning({ id: user.id }),
        "User",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "staff.deactivate",
        entityType: "User",
        entityId: input.userId,
      });

      revalidate(input.locale);
    }),

  reactivate: superAdminProcedure
    .input(userInput)
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .update(user)
          .set({ deactivatedAt: null })
          .where(eq(user.id, input.userId))
          .returning({ id: user.id }),
        "User",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "staff.reactivate",
        entityType: "User",
        entityId: input.userId,
      });

      revalidate(input.locale);
    }),

  setPermission: superAdminProcedure
    .input(
      form({
        locale: locale(),
        userId: text(),
        permissionKey: text(),
        value: flag(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId: targetUserId, value } = input;

      if (!targetUserId || !input.permissionKey) {
        throw new Error("userId and permissionKey are required");
      }

      if (!(input.permissionKey in StaffPermissionKeys)) {
        throw new Error(`Invalid permission key: ${input.permissionKey}`);
      }
      const permissionKey = input.permissionKey as PermissionKey;

      await db
        .insert(staffPermission)
        .values({ userId: targetUserId, [permissionKey]: value })
        .onConflictDoUpdate({
          target: staffPermission.userId,
          set: { [permissionKey]: value },
        });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "staffPermission.set",
        entityType: "StaffPermission",
        entityId: targetUserId,
        metadata: { permissionKey, value, targetUserId },
      });

      revalidate(input.locale);
    }),
});
