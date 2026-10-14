import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { academicResource, resourceType } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { validateVideoUrl } from "@/lib/video";
import { choice, form, locale, optionalText, text } from "@/server/form";
import { router, staffProcedure } from "@/server/trpc";

const revalidate = (locale: string) =>
  revalidatePath(`/${locale}/admin/academic-resources`);

export const academicResourcesRouter = router({
  upload: staffProcedure
    .input(
      form({
        locale: locale(),
        courseId: text(),
        type: choice(resourceType.enumValues),
        title: text(),
        fileUrl: optionalText(),
        embedUrl: optionalText(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { courseId, type, title, fileUrl, embedUrl } = input;

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
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "academicResource.upload",
        entityType: "AcademicResource",
        entityId: resource.id,
        metadata: { courseId, type, title },
      });

      revalidate(input.locale);
    }),

  update: staffProcedure
    .input(
      form({
        locale: locale(),
        id: text(),
        type: choice(resourceType.enumValues),
        title: text(),
        fileUrl: optionalText(),
        embedUrl: optionalText(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, type, title, fileUrl, embedUrl } = input;

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
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "academicResource.update",
        entityType: "AcademicResource",
        entityId: id,
        metadata: { title, type },
      });

      revalidate(input.locale);
    }),

  delete: staffProcedure
    .input(form({ locale: locale(), id: text() }))
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .delete(academicResource)
          .where(eq(academicResource.id, input.id))
          .returning({ id: academicResource.id }),
        "Academic resource",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "academicResource.delete",
        entityType: "AcademicResource",
        entityId: input.id,
      });

      revalidate(input.locale);
    }),
});
