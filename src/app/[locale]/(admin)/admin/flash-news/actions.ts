"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { flashNewsItem } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

export async function createFlashNews(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const textEn = formData.get("textEn") as string;
  const textMl = (formData.get("textMl") as string) || null;
  const link = (formData.get("link") as string) || null;
  const expiresAtValue = formData.get("expiresAt") as string;
  const expiresAt = expiresAtValue ? new Date(expiresAtValue) : null;

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
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "flashNews.create",
    entityType: "FlashNewsItem",
    entityId: item.id,
    metadata: { textEn, textMl, link, expiresAt: expiresAt?.toISOString() },
  });

  revalidateTag("flash-news", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/flash-news`);
}

export async function updateFlashNews(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const textEn = formData.get("textEn") as string;
  const textMl = (formData.get("textMl") as string) || null;
  const link = (formData.get("link") as string) || null;
  const active = formData.get("active") === "on";
  const expiresAtValue = formData.get("expiresAt") as string;
  const expiresAt = expiresAtValue ? new Date(expiresAtValue) : null;

  const item = expectRow(
    await db
      .update(flashNewsItem)
      .set({ textEn, textMl, link, active, expiresAt })
      .where(eq(flashNewsItem.id, id))
      .returning(),
    "Flash news item",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
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

  revalidateTag("flash-news", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/flash-news`);
}

export async function deleteFlashNews(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;

  expectRow(
    await db
      .delete(flashNewsItem)
      .where(eq(flashNewsItem.id, id))
      .returning({ id: flashNewsItem.id }),
    "Flash news item",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "flashNews.delete",
    entityType: "FlashNewsItem",
    entityId: id,
  });

  revalidateTag("flash-news", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/flash-news`);
}

export async function toggleFlashNewsActive(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const active = formData.get("active") === "true";

  const item = expectRow(
    await db
      .update(flashNewsItem)
      .set({ active })
      .where(eq(flashNewsItem.id, id))
      .returning(),
    "Flash news item",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: active ? "flashNews.activate" : "flashNews.deactivate",
    entityType: "FlashNewsItem",
    entityId: item.id,
    metadata: { active },
  });

  revalidateTag("flash-news", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/flash-news`);
}

export async function moveFlashNews(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const direction = formData.get("direction") as "up" | "down";

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
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "flashNews.reorder",
    entityType: "FlashNewsItem",
    entityId: current.id,
    metadata: { direction, swappedWith: swap.id },
  });

  revalidateTag("flash-news", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/flash-news`);
}
