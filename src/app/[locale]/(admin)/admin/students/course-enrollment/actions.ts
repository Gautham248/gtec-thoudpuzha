"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentCourseEnrollment } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

export async function enrollStudentInCourses(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const studentProfileId = (formData.get("studentProfileId") as string)?.trim();
  const courseIds = formData.getAll("courseIds") as string[];

  if (!studentProfileId || courseIds.length === 0) {
    throw new Error("studentProfileId and at least one courseIds is required");
  }

  const existing = await db.query.studentCourseEnrollment.findMany({
    where: (e, { and, eq, inArray }) =>
      and(
        eq(e.studentProfileId, studentProfileId),
        inArray(e.courseId, courseIds),
      ),
    columns: { courseId: true },
    with: { course: { columns: { titleEn: true } } },
  });

  const existingSet = new Set(existing.map((e) => e.courseId));
  const toCreate = courseIds.filter((id) => !existingSet.has(id));
  const skipped = existing.map((e) => ({
    courseId: e.courseId,
    titleEn: e.course.titleEn,
  }));

  if (toCreate.length > 0) {
    await db
      .insert(studentCourseEnrollment)
      .values(toCreate.map((courseId) => ({ studentProfileId, courseId })));
  }

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "studentCourseEnrollment.enroll",
    entityType: "StudentCourseEnrollment",
    entityId: studentProfileId,
    metadata: {
      createdCourseIds: toCreate,
      skippedCourseIds: skipped.map((s) => s.courseId),
    },
  });

  const locale = localeFromFormData(formData);
  revalidatePath(`/${locale}/admin/students/course-enrollment`);

  const skippedTitles = skipped.map((s) => s.titleEn).join(", ");
  redirect(
    `/${locale}/admin/students/course-enrollment?studentProfileId=${encodeURIComponent(studentProfileId)}&created=${toCreate.length}&skipped=${skipped.length}&skippedCourses=${encodeURIComponent(skippedTitles)}`,
  );
}

export async function unenrollStudentFromCourse(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const enrollmentId = (formData.get("enrollmentId") as string)?.trim();
  const studentProfileId = (formData.get("studentProfileId") as string)?.trim();
  const courseTitle = (formData.get("courseTitle") as string) || "";

  if (!enrollmentId || !studentProfileId) {
    throw new Error("enrollmentId and studentProfileId are required");
  }

  expectRow(
    await db
      .delete(studentCourseEnrollment)
      .where(eq(studentCourseEnrollment.id, enrollmentId))
      .returning({ id: studentCourseEnrollment.id }),
    "Enrollment",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "studentCourseEnrollment.unenroll",
    entityType: "StudentCourseEnrollment",
    entityId: enrollmentId,
    metadata: { studentProfileId, courseTitle },
  });

  const locale = localeFromFormData(formData);
  revalidatePath(`/${locale}/admin/students/course-enrollment`);
  redirect(
    `/${locale}/admin/students/course-enrollment?studentProfileId=${encodeURIComponent(studentProfileId)}&unenrolled=true&unenrolledCourse=${encodeURIComponent(courseTitle)}`,
  );
}
