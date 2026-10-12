import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentCourseEnrollment } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { form, list, locale, text, trimmed } from "@/server/form";
import { router, staffProcedure } from "@/server/trpc";

const pagePath = (locale: string) =>
  `/${locale}/admin/students/course-enrollment`;

export const courseEnrollmentRouter = router({
  /** Enrolls a student in the selected courses, skipping existing ones. */
  enroll: staffProcedure
    .input(
      form({
        locale: locale(),
        studentProfileId: trimmed(),
        courseIds: list(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { studentProfileId, courseIds, locale } = input;

      if (!studentProfileId || courseIds.length === 0) {
        throw new Error(
          "studentProfileId and at least one courseIds is required",
        );
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
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "studentCourseEnrollment.enroll",
        entityType: "StudentCourseEnrollment",
        entityId: studentProfileId,
        metadata: {
          createdCourseIds: toCreate,
          skippedCourseIds: skipped.map((s) => s.courseId),
        },
      });

      revalidatePath(pagePath(locale));

      const skippedTitles = skipped.map((s) => s.titleEn).join(", ");
      redirect(
        `${pagePath(locale)}?studentProfileId=${encodeURIComponent(studentProfileId)}&created=${toCreate.length}&skipped=${skipped.length}&skippedCourses=${encodeURIComponent(skippedTitles)}`,
      );
    }),

  unenroll: staffProcedure
    .input(
      form({
        locale: locale(),
        enrollmentId: trimmed(),
        studentProfileId: trimmed(),
        courseTitle: text(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { enrollmentId, studentProfileId, courseTitle, locale } = input;

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
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "studentCourseEnrollment.unenroll",
        entityType: "StudentCourseEnrollment",
        entityId: enrollmentId,
        metadata: { studentProfileId, courseTitle },
      });

      revalidatePath(pagePath(locale));
      redirect(
        `${pagePath(locale)}?studentProfileId=${encodeURIComponent(studentProfileId)}&unenrolled=true&unenrolledCourse=${encodeURIComponent(courseTitle)}`,
      );
    }),
});
