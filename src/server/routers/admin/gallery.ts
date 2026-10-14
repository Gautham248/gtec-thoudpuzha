import { revalidatePath, revalidateTag } from "next/cache";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { galleryCategory, galleryItem } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";
import { slugFromName } from "@/lib/gallery";
import { stripHtml } from "@/lib/sanitize";
import {
  anyFile,
  direction,
  form,
  list,
  locale,
  optionalText,
  text,
} from "@/server/form";
import { router, staffProcedure } from "@/server/trpc";

function revalidateGallery(locale: string) {
  revalidatePath(`/${locale}/admin/gallery`);
  revalidatePath(`/${locale}/gallery`);
  revalidatePath("/gallery");
  // Homepage gallery sections are served from unstable_cache (src/lib/data-cache.ts).
  revalidateTag("gallery", "max");
}

const caption = (raw: string | null) => (raw ? stripHtml(raw) : null);

async function nextItemSortOrder(categoryId: string) {
  const [maxOrder] = await db
    .select({ sortOrder: max(galleryItem.sortOrder) })
    .from(galleryItem)
    .where(eq(galleryItem.categoryId, categoryId));
  return (maxOrder?.sortOrder ?? -1) + 1;
}

export const galleryRouter = router({
  /* ─── Categories ─── */

  createCategory: staffProcedure
    .input(form({ locale: locale(), nameEn: text(), nameMl: optionalText() }))
    .mutation(async ({ ctx, input }) => {
      const { nameEn, nameMl } = input;

      const [maxOrder] = await db
        .select({ sortOrder: max(galleryCategory.sortOrder) })
        .from(galleryCategory);
      const sortOrder = (maxOrder?.sortOrder ?? 0) + 1;

      // The unique slug index decides: a slug already taken (even by a
      // concurrent request) gets a timestamp suffix, then a random one.
      const base = slugFromName(nameEn);
      const candidates = [
        base,
        `${base}-${Date.now()}`,
        `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ];
      let category: typeof galleryCategory.$inferSelect | undefined;
      for (const slug of candidates) {
        [category] = await db
          .insert(galleryCategory)
          .values({ slug, nameEn, nameMl, sortOrder })
          .onConflictDoNothing({ target: galleryCategory.slug })
          .returning();
        if (category) break;
      }
      if (!category) {
        throw new Error(`Could not find a free slug for "${nameEn}"`);
      }

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "galleryCategory.create",
        entityType: "GalleryCategory",
        entityId: category.id,
        metadata: { nameEn, nameMl },
      });

      revalidateGallery(input.locale);
    }),

  updateCategory: staffProcedure
    .input(
      form({
        locale: locale(),
        id: text(),
        nameEn: text(),
        nameMl: optionalText(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nameEn, nameMl } = input;
      expectRow(
        await db
          .update(galleryCategory)
          .set({ nameEn, nameMl })
          .where(eq(galleryCategory.id, id))
          .returning({ id: galleryCategory.id }),
        "Gallery category",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "galleryCategory.update",
        entityType: "GalleryCategory",
        entityId: id,
        metadata: { nameEn, nameMl },
      });

      revalidateGallery(input.locale);
    }),

  deleteCategory: staffProcedure
    .input(form({ locale: locale(), id: text(), nameEn: text() }))
    .mutation(async ({ ctx, input }) => {
      const { id, nameEn } = input;

      // Cascade-delete: the GalleryItem foreign key is ON DELETE CASCADE, so the
      // database removes the items. A confirmation is shown client-side first.
      expectRow(
        await db
          .delete(galleryCategory)
          .where(eq(galleryCategory.id, id))
          .returning({ id: galleryCategory.id }),
        "Gallery category",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "galleryCategory.delete",
        entityType: "GalleryCategory",
        entityId: id,
        metadata: { nameEn },
      });

      revalidateGallery(input.locale);
    }),

  moveCategory: staffProcedure
    .input(form({ locale: locale(), id: text(), direction: direction() }))
    .mutation(async ({ ctx, input }) => {
      const { id, direction } = input;
      const categories = await db.query.galleryCategory.findMany({
        orderBy: (c, { asc }) => asc(c.sortOrder),
      });

      const index = categories.findIndex((c) => c.id === id);
      if (index === -1) return;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= categories.length) return;

      const current = categories[index];
      const swap = categories[swapIndex];

      await db.transaction(async (tx) => {
        await tx
          .update(galleryCategory)
          .set({ sortOrder: swap.sortOrder })
          .where(eq(galleryCategory.id, current.id));
        await tx
          .update(galleryCategory)
          .set({ sortOrder: current.sortOrder })
          .where(eq(galleryCategory.id, swap.id));
      });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "galleryCategory.reorder",
        entityType: "GalleryCategory",
        entityId: current.id,
        metadata: { direction, swappedWith: swap.id },
      });

      revalidateGallery(input.locale);
    }),

  /* ─── Media ─── */

  uploadImages: staffProcedure
    .input(
      form({
        locale: locale(),
        categoryId: text(),
        files: list(anyFile()),
        captionEn: optionalText(),
        captionMl: optionalText(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { categoryId, files } = input;
      const captionEn = caption(input.captionEn);
      const captionMl = caption(input.captionMl);

      if (!files.length) {
        throw new Error("No files provided");
      }

      let sortOrder = await nextItemSortOrder(categoryId);
      const itemIds: string[] = [];

      for (const file of files) {
        const url = await uploadFile(file, "gallery");
        const [item] = await db
          .insert(galleryItem)
          .values({
            categoryId,
            mediaType: "IMAGE",
            url,
            captionEn,
            captionMl,
            sortOrder,
          })
          .returning({ id: galleryItem.id });
        itemIds.push(item.id);
        sortOrder++;
      }

      // Log ONE audit entry summarizing the batch, not one per file.
      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "gallery.bulkUpload",
        entityType: "GalleryItem",
        entityId: categoryId,
        metadata: {
          categoryId,
          count: files.length,
          itemIds,
          captionEn,
        },
      });

      revalidateGallery(input.locale);
    }),

  addVideo: staffProcedure
    .input(
      form({
        locale: locale(),
        categoryId: text(),
        url: text(),
        captionEn: optionalText(),
        captionMl: optionalText(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { categoryId, url } = input;
      const captionEn = caption(input.captionEn);
      const captionMl = caption(input.captionMl);

      if (!url) {
        throw new Error("Video URL is required");
      }

      const [item] = await db
        .insert(galleryItem)
        .values({
          categoryId,
          mediaType: "VIDEO",
          url,
          captionEn,
          captionMl,
          sortOrder: await nextItemSortOrder(categoryId),
        })
        .returning({ id: galleryItem.id });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "gallery.addVideo",
        entityType: "GalleryItem",
        entityId: item.id,
        metadata: { categoryId, url, captionEn },
      });

      revalidateGallery(input.locale);
    }),

  deleteItem: staffProcedure
    .input(form({ locale: locale(), id: text() }))
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .delete(galleryItem)
          .where(eq(galleryItem.id, input.id))
          .returning({ id: galleryItem.id }),
        "Gallery item",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "galleryItem.delete",
        entityType: "GalleryItem",
        entityId: input.id,
      });

      revalidateGallery(input.locale);
    }),
});
