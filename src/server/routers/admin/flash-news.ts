import { revalidatePath, revalidateTag } from "next/cache";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { flashNewsItem } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import {
  checkbox,
  direction,
  flag,
  form,
  locale,
  optionalDate,
  optionalText,
  text,
} from "@/server/form";
import { router, staffProcedure } from "@/server/trpc";

function revalidate(locale: string) {
  revalidateTag("flash-news", "max");
  revalidatePath(`/${locale}/admin/flash-news`);
}

export const flashNewsRouter = router({
  create: staffProcedure
    .input(
      form({
        locale: locale(),
        textEn: text(),
        textMl: optionalText(),
        link: optionalText(),
        expiresAt: optionalDate(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { textEn, textMl, link, expiresAt } = input;
      const [maxOrder] = await db
        .select({ sortOrder: max(flashNewsItem.sortOrder) })
        .from(flashNewsItem);

      const [item] = await db
        .insert(flashNewsItem)
        .values({
          textEn,
          textMl,
          link,
          expiresAt,
          sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
        })
        .returning();

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "flashNews.create",
        entityType: "FlashNewsItem",
        entityId: item.id,
        metadata: { textEn, textMl, link, expiresAt: expiresAt?.toISOString() },
      });

      revalidate(input.locale);
    }),

  update: staffProcedure
    .input(
      form({
        locale: locale(),
        id: text(),
        textEn: text(),
        textMl: optionalText(),
        link: optionalText(),
        active: checkbox(),
        expiresAt: optionalDate(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, textEn, textMl, link, active, expiresAt } = input;
      const item = expectRow(
        await db
          .update(flashNewsItem)
          .set({ textEn, textMl, link, active, expiresAt })
          .where(eq(flashNewsItem.id, id))
          .returning(),
        "Flash news item",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "flashNews.update",
        entityType: "FlashNewsItem",
        entityId: item.id,
        metadata: {
          textEn,
          textMl,
          link,
          active,
          expiresAt: expiresAt?.toISOString(),
        },
      });

      revalidate(input.locale);
    }),

  delete: staffProcedure
    .input(form({ locale: locale(), id: text() }))
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .delete(flashNewsItem)
          .where(eq(flashNewsItem.id, input.id))
          .returning({ id: flashNewsItem.id }),
        "Flash news item",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "flashNews.delete",
        entityType: "FlashNewsItem",
        entityId: input.id,
      });

      revalidate(input.locale);
    }),

  setActive: staffProcedure
    .input(form({ locale: locale(), id: text(), active: flag() }))
    .mutation(async ({ ctx, input }) => {
      const { id, active } = input;
      const item = expectRow(
        await db
          .update(flashNewsItem)
          .set({ active })
          .where(eq(flashNewsItem.id, id))
          .returning(),
        "Flash news item",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: active ? "flashNews.activate" : "flashNews.deactivate",
        entityType: "FlashNewsItem",
        entityId: item.id,
        metadata: { active },
      });

      revalidate(input.locale);
    }),

  move: staffProcedure
    .input(form({ locale: locale(), id: text(), direction: direction() }))
    .mutation(async ({ ctx, input }) => {
      const { id, direction } = input;
      const items = await db.query.flashNewsItem.findMany({
        orderBy: (f, { asc }) => asc(f.sortOrder),
      });

      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= items.length) return;

      const current = items[index];
      const swap = items[swapIndex];

      await db.transaction(async (tx) => {
        await tx
          .update(flashNewsItem)
          .set({ sortOrder: swap.sortOrder })
          .where(eq(flashNewsItem.id, current.id));
        await tx
          .update(flashNewsItem)
          .set({ sortOrder: current.sortOrder })
          .where(eq(flashNewsItem.id, swap.id));
      });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "flashNews.reorder",
        entityType: "FlashNewsItem",
        entityId: current.id,
        metadata: { direction, swappedWith: swap.id },
      });

      revalidate(input.locale);
    }),
});
