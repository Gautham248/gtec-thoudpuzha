"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  const existing = await prisma.galleryCategory.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const maxOrder = await prisma.galleryCategory.aggregate({
    _max: { sortOrder: true },
  });

  const category = await prisma.galleryCategory.create({
    data: {
      slug,
      nameEn,
      nameMl,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

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

  await prisma.galleryCategory.update({
    where: { id },
    data: { nameEn, nameMl },
  });

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

  // Cascade-delete: items are removed automatically by Prisma (onDelete: Cascade).
  // A confirmation is shown client-side before the form submits.
  await prisma.galleryCategory.delete({ where: { id } });

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

  const categories = await prisma.galleryCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= categories.length) return;

  const current = categories[index];
  const swap = categories[swapIndex];

  await prisma.galleryCategory.update({
    where: { id: current.id },
    data: { sortOrder: swap.sortOrder },
  });

  await prisma.galleryCategory.update({
    where: { id: swap.id },
    data: { sortOrder: current.sortOrder },
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

  const maxOrder = await prisma.galleryItem.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  let sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const itemIds: string[] = [];

  for (const file of files) {
    const url = await uploadFile(file, "gallery");
    const item = await prisma.galleryItem.create({
      data: {
        categoryId,
        mediaType: "IMAGE",
        url,
        captionEn,
        captionMl,
        sortOrder,
      },
    });
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

  const maxOrder = await prisma.galleryItem.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });

  const item = await prisma.galleryItem.create({
    data: {
      categoryId,
      mediaType: "VIDEO",
      url,
      captionEn,
      captionMl,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

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

  await prisma.galleryItem.delete({ where: { id } });

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "galleryItem.delete",
    entityType: "GalleryItem",
    entityId: id,
  });

  revalidateGallery(localeFromFormData(formData));
}
