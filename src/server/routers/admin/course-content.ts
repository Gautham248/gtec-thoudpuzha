import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { course as courseTable } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { CourseContentSchema } from "@/lib/course-content.schema";
import type { CourseContent } from "@/lib/course-content.types";
import { form, locale, text } from "@/server/form";
import { publicProcedure, router, staffProcedure } from "@/server/trpc";

export const courseContentRouter = router({
  save: staffProcedure
    .input(form({ locale: locale(), courseId: text(), contentBlocks: text() }))
    .mutation(async ({ ctx, input }) => {
      const { courseId, contentBlocks: raw, locale } = input;
      if (!courseId) throw new Error("Missing courseId");
      if (!raw) throw new Error("Missing content data");

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("Invalid JSON in content data");
      }

      const validated = CourseContentSchema.parse(parsed);

      const course = expectRow(
        await db
          .update(courseTable)
          .set({ contentBlocks: validated })
          .where(eq(courseTable.id, courseId))
          .returning({ slug: courseTable.slug, titleEn: courseTable.titleEn }),
        "Course",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "courseContent.save",
        entityType: "Course",
        entityId: courseId,
        metadata: { titleEn: course?.titleEn },
      });

      revalidatePath(`/${locale}/admin/courses/${courseId}/content`);
      revalidatePath(`/${locale}/courses`);
      if (course?.slug) {
        revalidatePath(`/${locale}/courses/${course.slug}`);
      }
    }),

  /** A course's content blocks, or null when unset or no longer valid. */
  get: publicProcedure
    .input(z.string())
    .query(async ({ input: courseId }): Promise<CourseContent | null> => {
      const course = await db.query.course.findFirst({
        where: (c, { eq }) => eq(c.id, courseId),
        columns: { contentBlocks: true },
      });

      if (!course?.contentBlocks) return null;

      const parsed = CourseContentSchema.safeParse(course.contentBlocks);
      if (!parsed.success) return null;

      return parsed.data;
    }),
});
