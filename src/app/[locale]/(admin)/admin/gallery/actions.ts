"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { galleryCategory, galleryItem } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";
import { slugFromName } from "@/lib/gallery";
import { stripHtml } from "@/lib/sanitize";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

function revalidateGallery(locale: string) {
  revalidatePath(`/${locale}/admin/gallery`);
  revalidatePath(`/${locale}/gallery`);
  revalidatePath("/gallery");
  // Homepage gallery sections are served from unstable_cache (src/lib/data-cache.ts).
  revalidateTag("gallery", "max");
}

/* ─── Category actions ─── */

export async function createCategory(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const nameEn = formData.get("nameEn") as string;
  const nameMl = (formData.get("nameMl") as string) || null;

  // Generate a unique slug
  let slug = slugFromName(nameEn);
  const existing = await db.query.galleryCategory.findFirst({
    where: (c, { eq }) => eq(c.slug, slug),
    columns: { id: true },
  });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const [maxOrder] = await db
    .select({ sortOrder: max(galleryCategory.sortOrder) })
    .from(galleryCategory);

  const [category] = await db
    .insert(galleryCategory)
    .values({
      slug,
      nameEn,
      nameMl,
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
    })
    .returning();

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "galleryCategory.create",
    entityType: "GalleryCategory",
    entityId: category.id,
    metadata: { nameEn, nameMl },
  });

  revalidateGallery(localeFromFormData(formData));
}

export async function updateCategory(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const nameEn = formData.get("nameEn") as string;
  const nameMl = (formData.get("nameMl") as string) || null;

  expectRow(
    await db
      .update(galleryCategory)
      .set({ nameEn, nameMl })
      .where(eq(galleryCategory.id, id))
      .returning({ id: galleryCategory.id }),
    "Gallery category",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "galleryCategory.update",
    entityType: "GalleryCategory",
    entityId: id,
    metadata: { nameEn, nameMl },
  });

  revalidateGallery(localeFromFormData(formData));
}

export async function deleteCategory(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const nameEn = formData.get("nameEn") as string;

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
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "galleryCategory.delete",
    entityType: "GalleryCategory",
    entityId: id,
    metadata: { nameEn },
  });

  revalidateGallery(localeFromFormData(formData));
}

export async function moveCategory(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const direction = formData.get("direction") as "up" | "down";

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
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "galleryCategory.reorder",
    entityType: "GalleryCategory",
    entityId: current.id,
    metadata: { direction, swappedWith: swap.id },
  });

  revalidateGallery(localeFromFormData(formData));
}

/* ─── Media actions ─── */

export async function uploadGalleryImages(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const categoryId = formData.get("categoryId") as string;
  const files = formData.getAll("files") as File[];
  const rawCaptionEn = (formData.get("captionEn") as string) || null;
  const rawCaptionMl = (formData.get("captionMl") as string) || null;
  const captionEn = rawCaptionEn ? stripHtml(rawCaptionEn) : null;
  const captionMl = rawCaptionMl ? stripHtml(rawCaptionMl) : null;

  if (!files.length) {
    throw new Error("No files provided");
  }

  const [maxOrder] = await db
    .select({ sortOrder: max(galleryItem.sortOrder) })
    .from(galleryItem)
    .where(eq(galleryItem.categoryId, categoryId));
  let sortOrder = (maxOrder?.sortOrder ?? -1) + 1;

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
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
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

  revalidateGallery(localeFromFormData(formData));
}

export async function addVideoItem(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const categoryId = formData.get("categoryId") as string;
  const url = formData.get("url") as string;
  const rawCaptionEn = (formData.get("captionEn") as string) || null;
  const rawCaptionMl = (formData.get("captionMl") as string) || null;
  const captionEn = rawCaptionEn ? stripHtml(rawCaptionEn) : null;
  const captionMl = rawCaptionMl ? stripHtml(rawCaptionMl) : null;

  if (!url) {
    throw new Error("Video URL is required");
  }

  const [maxOrder] = await db
    .select({ sortOrder: max(galleryItem.sortOrder) })
    .from(galleryItem)
    .where(eq(galleryItem.categoryId, categoryId));

  const [item] = await db
    .insert(galleryItem)
    .values({
      categoryId,
      mediaType: "VIDEO",
      url,
      captionEn,
      captionMl,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    })
    .returning({ id: galleryItem.id });

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "gallery.addVideo",
    entityType: "GalleryItem",
    entityId: item.id,
    metadata: { categoryId, url, captionEn },
  });

  revalidateGallery(localeFromFormData(formData));
}

export async function deleteGalleryItem(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;

  expectRow(
    await db
      .delete(galleryItem)
      .where(eq(galleryItem.id, id))
      .returning({ id: galleryItem.id }),
    "Gallery item",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "galleryItem.delete",
    entityType: "GalleryItem",
    entityId: id,
  });

  revalidateGallery(localeFromFormData(formData));
}
