"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentProgressEntry, timetableEntry } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

export async function addTimetableEntry(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const courseId = formData.get("courseId") as string;
  const contentText = formData.get("contentText") as string;

  if (!courseId || !contentText) {
    throw new Error("courseId and contentText are required");
  }

  const [entry] = await db
    .insert(timetableEntry)
    .values({ courseId, contentText })
    .returning({ id: timetableEntry.id });

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "timetableEntry.create",
    entityType: "TimetableEntry",
    entityId: entry.id,
    metadata: { courseId },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/timetable-progress`);
}

export async function deleteTimetableEntry(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  expectRow(
    await db
      .delete(timetableEntry)
      .where(eq(timetableEntry.id, id))
      .returning({ id: timetableEntry.id }),
    "Timetable entry",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "timetableEntry.delete",
    entityType: "TimetableEntry",
    entityId: id,
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/timetable-progress`);
}

export async function addProgressEntry(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const studentProfileId = formData.get("studentProfileId") as string;
  const courseId = formData.get("courseId") as string;
  const noteEn = formData.get("noteEn") as string;

  if (!studentProfileId || !courseId || !noteEn) {
    throw new Error("studentProfileId, courseId, and noteEn are required");
  }

  const [entry] = await db
    .insert(studentProgressEntry)
    .values({ studentProfileId, courseId, noteEn })
    .returning({ id: studentProgressEntry.id });

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "studentProgressEntry.create",
    entityType: "StudentProgressEntry",
    entityId: entry.id,
    metadata: { studentProfileId, courseId },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/timetable-progress`);
}

export async function deleteProgressEntry(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  expectRow(
    await db
      .delete(studentProgressEntry)
      .where(eq(studentProgressEntry.id, id))
      .returning({ id: studentProgressEntry.id }),
    "Progress entry",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "studentProgressEntry.delete",
    entityType: "StudentProgressEntry",
    entityId: id,
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/timetable-progress`);
}
