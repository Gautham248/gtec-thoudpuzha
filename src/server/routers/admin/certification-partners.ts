import { revalidatePath, revalidateTag } from "next/cache";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { certificationPartner } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";
import {
  direction,
  file,
  form,
  locale,
  optionalText,
  text,
} from "@/server/form";
import { router, staffProcedure } from "@/server/trpc";

function revalidate(locale: string) {
  revalidatePath(`/${locale}/admin/certification-partners`);
  revalidateTag("cert-partners", "max");
}

const partnerFields = {
  locale: locale(),
  name: text(),
  nameMl: optionalText(),
  link: optionalText(),
  logo: file(),
};

export const certificationPartnersRouter = router({
  create: staffProcedure
    .input(form(partnerFields))
    .mutation(async ({ ctx, input }) => {
      const { name, nameMl, link, logo: logoFile } = input;

      if (!name) throw new Error("Name is required");
      if (!logoFile || logoFile.size === 0)
        throw new Error("Logo file is required");

      const logoUrl = await uploadFile(logoFile, "cert-partners");

      const [maxOrder] = await db
        .select({ sortOrder: max(certificationPartner.sortOrder) })
        .from(certificationPartner);

      const [partner] = await db
        .insert(certificationPartner)
        .values({
          name,
          nameMl,
          logoUrl,
          link,
          sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
        })
        .returning();

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "certificationPartner.create",
        entityType: "CertificationPartner",
        entityId: partner.id,
        metadata: { name, nameMl, link },
      });

      revalidate(input.locale);
    }),

  update: staffProcedure
    .input(form({ ...partnerFields, id: text() }))
    .mutation(async ({ ctx, input }) => {
      const { id, name, nameMl, link, logo: logoFile } = input;

      if (!name) throw new Error("Name is required");

      let logoUrl: string | undefined;
      if (logoFile && logoFile.size > 0) {
        logoUrl = await uploadFile(logoFile, "cert-partners");
      }

      const partner = expectRow(
        await db
          .update(certificationPartner)
          .set({ name, nameMl, link, ...(logoUrl ? { logoUrl } : {}) })
          .where(eq(certificationPartner.id, id))
          .returning(),
        "Certification partner",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "certificationPartner.update",
        entityType: "CertificationPartner",
        entityId: partner.id,
        metadata: { name, nameMl, link, logoUpdated: !!logoUrl },
      });

      revalidate(input.locale);
    }),

  delete: staffProcedure
    .input(form({ locale: locale(), id: text() }))
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .delete(certificationPartner)
          .where(eq(certificationPartner.id, input.id))
          .returning({ id: certificationPartner.id }),
        "Certification partner",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "certificationPartner.delete",
        entityType: "CertificationPartner",
        entityId: input.id,
      });

      revalidate(input.locale);
    }),

  move: staffProcedure
    .input(form({ locale: locale(), id: text(), direction: direction() }))
    .mutation(async ({ ctx, input }) => {
      const { id, direction } = input;
      const partners = await db.query.certificationPartner.findMany({
        orderBy: (p, { asc }) => asc(p.sortOrder),
      });

      const index = partners.findIndex((p) => p.id === id);
      if (index === -1) return;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= partners.length) return;

      const current = partners[index];
      const swap = partners[swapIndex];

      await db.transaction(async (tx) => {
        await tx
          .update(certificationPartner)
          .set({ sortOrder: swap.sortOrder })
          .where(eq(certificationPartner.id, current.id));
        await tx
          .update(certificationPartner)
          .set({ sortOrder: current.sortOrder })
          .where(eq(certificationPartner.id, swap.id));
      });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "certificationPartner.reorder",
        entityType: "CertificationPartner",
        entityId: current.id,
        metadata: { direction, swappedWith: swap.id },
      });

      revalidate(input.locale);
    }),
});
