import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentProgressEntry, timetableEntry } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { form, locale, text } from "@/server/form";
import { router, staffProcedure } from "@/server/trpc";

const revalidate = (locale: string) =>
  revalidatePath(`/${locale}/admin/timetable-progress`);

const idInput = form({ locale: locale(), id: text() });

export const timetableProgressRouter = router({
  addTimetableEntry: staffProcedure
    .input(form({ locale: locale(), courseId: text(), contentText: text() }))
    .mutation(async ({ ctx, input }) => {
      const { courseId, contentText } = input;

      if (!courseId || !contentText) {
        throw new Error("courseId and contentText are required");
      }

      const [entry] = await db
        .insert(timetableEntry)
        .values({ courseId, contentText })
        .returning({ id: timetableEntry.id });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "timetableEntry.create",
        entityType: "TimetableEntry",
        entityId: entry.id,
        metadata: { courseId },
      });

      revalidate(input.locale);
    }),

  deleteTimetableEntry: staffProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .delete(timetableEntry)
          .where(eq(timetableEntry.id, input.id))
          .returning({ id: timetableEntry.id }),
        "Timetable entry",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "timetableEntry.delete",
        entityType: "TimetableEntry",
        entityId: input.id,
      });

      revalidate(input.locale);
    }),

  addProgressEntry: staffProcedure
    .input(
      form({
        locale: locale(),
        studentProfileId: text(),
        courseId: text(),
        noteEn: text(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { studentProfileId, courseId, noteEn } = input;

      if (!studentProfileId || !courseId || !noteEn) {
        throw new Error("studentProfileId, courseId, and noteEn are required");
      }

      const [entry] = await db
        .insert(studentProgressEntry)
        .values({ studentProfileId, courseId, noteEn })
        .returning({ id: studentProgressEntry.id });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "studentProgressEntry.create",
        entityType: "StudentProgressEntry",
        entityId: entry.id,
        metadata: { studentProfileId, courseId },
      });

      revalidate(input.locale);
    }),

  deleteProgressEntry: staffProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .delete(studentProgressEntry)
          .where(eq(studentProgressEntry.id, input.id))
          .returning({ id: studentProgressEntry.id }),
        "Progress entry",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "studentProgressEntry.delete",
        entityType: "StudentProgressEntry",
        entityId: input.id,
      });

      revalidate(input.locale);
    }),
});
