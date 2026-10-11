"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsEvent } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { stripHtml } from "@/lib/sanitize";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createNewsEvent(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const type = formData.get("type") as string;
  const titleEn = formData.get("titleEn") as string;
  const titleMl = (formData.get("titleMl") as string) || null;
  const bodyEn = stripHtml(formData.get("bodyEn") as string);
  const bodyMl = formData.get("bodyMl")
    ? stripHtml(formData.get("bodyMl") as string)
    : null;
  const coverImageUrl = (formData.get("coverImageUrl") as string) || null;
  const eventDateValue = formData.get("eventDate") as string;
  const eventDate = eventDateValue ? new Date(eventDateValue) : null;
  const publishNow = formData.get("publishNow") === "on";

  const slug = slugify(titleEn);

  const [item] = await db
    .insert(newsEvent)
    .values({
      type: type as "NEWS" | "EVENT",
      titleEn,
      titleMl,
      bodyEn,
      bodyMl,
      coverImageUrl,
      eventDate,
      slug,
      publishedAt: publishNow ? new Date() : null,
    })
    .returning();

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "newsEvent.create",
    entityType: "NewsEvent",
    entityId: item.id,
    metadata: { type, titleEn, slug, published: publishNow },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/news-events`);
  revalidatePath(`/${localeFromFormData(formData)}/news`);
  revalidateTag("news-events", "max");
}

export async function updateNewsEvent(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const type = formData.get("type") as string;
  const titleEn = formData.get("titleEn") as string;
  const titleMl = (formData.get("titleMl") as string) || null;
  const bodyEn = stripHtml(formData.get("bodyEn") as string);
  const bodyMl = formData.get("bodyMl")
    ? stripHtml(formData.get("bodyMl") as string)
    : null;
  const coverImageUrl = (formData.get("coverImageUrl") as string) || null;
  const eventDateValue = formData.get("eventDate") as string;
  const eventDate = eventDateValue ? new Date(eventDateValue) : null;

  const item = expectRow(
    await db
      .update(newsEvent)
      .set({
        type: type as "NEWS" | "EVENT",
        titleEn,
        titleMl,
        bodyEn,
        bodyMl,
        coverImageUrl,
        eventDate,
      })
      .where(eq(newsEvent.id, id))
      .returning(),
    "News/event",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "newsEvent.update",
    entityType: "NewsEvent",
    entityId: item.id,
    metadata: { type, titleEn },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/news-events`);
  revalidatePath(`/${localeFromFormData(formData)}/news`);
  revalidateTag("news-events", "max");
}

export async function deleteNewsEvent(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;

  expectRow(
    await db
      .delete(newsEvent)
      .where(eq(newsEvent.id, id))
      .returning({ id: newsEvent.id }),
    "News/event",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "newsEvent.delete",
    entityType: "NewsEvent",
    entityId: id,
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/news-events`);
  revalidatePath(`/${localeFromFormData(formData)}/news`);
  revalidateTag("news-events", "max");
}

export async function togglePublishNewsEvent(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const publish = formData.get("publish") === "true";

  const item = expectRow(
    await db
      .update(newsEvent)
      .set({ publishedAt: publish ? new Date() : null })
      .where(eq(newsEvent.id, id))
      .returning(),
    "News/event",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: publish ? "newsEvent.publish" : "newsEvent.unpublish",
    entityType: "NewsEvent",
    entityId: item.id,
    metadata: { published: publish },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/news-events`);
  revalidatePath(`/${localeFromFormData(formData)}/news`);
  revalidateTag("news-events", "max");
}
