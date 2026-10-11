"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { academicResource } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { validateVideoUrl } from "@/lib/video";
import type { ResourceType } from "@/db/types";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

export async function uploadResource(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const courseId = formData.get("courseId") as string;
  const type = formData.get("type") as ResourceType;
  const title = formData.get("title") as string;
  const fileUrl = (formData.get("fileUrl") as string) || null;
  const embedUrl = (formData.get("embedUrl") as string) || null;

  if (!courseId || !type || !title) {
    throw new Error("courseId, type, and title are required");
  }

  if (type === "LECTURE") {
    if (!embedUrl) {
      throw new Error("A video URL is required for lecture resources.");
    }
    const validationError = validateVideoUrl(embedUrl);
    if (validationError) {
      throw new Error(validationError);
    }
  }

  const [resource] = await db
    .insert(academicResource)
    .values({
      courseId,
      type,
      title,
      fileUrl,
      ...(type === "LECTURE" ? { embedUrl } : {}),
    })
    .returning({ id: academicResource.id });

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "academicResource.upload",
    entityType: "AcademicResource",
    entityId: resource.id,
    metadata: { courseId, type, title },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/academic-resources`);
}

export async function updateResource(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const type = formData.get("type") as ResourceType;
  const title = formData.get("title") as string;
  const fileUrl = (formData.get("fileUrl") as string) || null;
  const embedUrl = (formData.get("embedUrl") as string) || null;

  if (!id || !title) {
    throw new Error("Resource ID and title are required.");
  }

  if (type === "LECTURE" && embedUrl) {
    const validationError = validateVideoUrl(embedUrl);
    if (validationError) {
      throw new Error(validationError);
    }
  }

  expectRow(
    await db
      .update(academicResource)
      .set({
        type,
        title,
        fileUrl,
        embedUrl: type === "LECTURE" ? embedUrl : null,
      })
      .where(eq(academicResource.id, id))
      .returning({ id: academicResource.id }),
    "Academic resource",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "academicResource.update",
    entityType: "AcademicResource",
    entityId: id,
    metadata: { title, type },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/academic-resources`);
}

export async function deleteResource(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;

  expectRow(
    await db
      .delete(academicResource)
      .where(eq(academicResource.id, id))
      .returning({ id: academicResource.id }),
    "Academic resource",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "academicResource.delete",
    entityType: "AcademicResource",
    entityId: id,
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/academic-resources`);
}
