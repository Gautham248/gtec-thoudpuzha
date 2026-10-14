import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { newsEvent, newsEventType } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { stripHtml } from "@/lib/sanitize";
import {
  checkbox,
  flag,
  form,
  locale,
  optionalDate,
  optionalText,
  text,
} from "@/server/form";
import { router, staffProcedure } from "@/server/trpc";

function revalidate(locale: string) {
  revalidatePath(`/${locale}/admin/news-events`);
  revalidatePath(`/${locale}/news`);
  revalidateTag("news-events", "max");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const newsFields = {
  locale: locale(),
  type: z.enum(newsEventType.enumValues),
  titleEn: text(),
  titleMl: optionalText(),
  bodyEn: text(),
  bodyMl: optionalText(),
  coverImageUrl: optionalText(),
  eventDate: optionalDate(),
};

/** Column values shared by create and update; bodies are stripped of HTML. */
function newsValues(input: z.output<z.ZodObject<typeof newsFields>>) {
  return {
    type: input.type,
    titleEn: input.titleEn,
    titleMl: input.titleMl,
    bodyEn: stripHtml(input.bodyEn),
    bodyMl: input.bodyMl ? stripHtml(input.bodyMl) : null,
    coverImageUrl: input.coverImageUrl,
    eventDate: input.eventDate,
  };
}

export const newsEventsRouter = router({
  create: staffProcedure
    .input(form({ ...newsFields, publishNow: checkbox() }))
    .mutation(async ({ ctx, input }) => {
      const values = newsValues(input);
      const slug = slugify(values.titleEn);

      const [item] = await db
        .insert(newsEvent)
        .values({
          ...values,
          slug,
          publishedAt: input.publishNow ? new Date() : null,
        })
        .returning();

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "newsEvent.create",
        entityType: "NewsEvent",
        entityId: item.id,
        metadata: {
          type: values.type,
          titleEn: values.titleEn,
          slug,
          published: input.publishNow,
        },
      });

      revalidate(input.locale);
    }),

  update: staffProcedure
    .input(form({ ...newsFields, id: text() }))
    .mutation(async ({ ctx, input }) => {
      const values = newsValues(input);

      const item = expectRow(
        await db
          .update(newsEvent)
          .set(values)
          .where(eq(newsEvent.id, input.id))
          .returning(),
        "News/event",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "newsEvent.update",
        entityType: "NewsEvent",
        entityId: item.id,
        metadata: { type: values.type, titleEn: values.titleEn },
      });

      revalidate(input.locale);
    }),

  delete: staffProcedure
    .input(form({ locale: locale(), id: text() }))
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .delete(newsEvent)
          .where(eq(newsEvent.id, input.id))
          .returning({ id: newsEvent.id }),
        "News/event",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "newsEvent.delete",
        entityType: "NewsEvent",
        entityId: input.id,
      });

      revalidate(input.locale);
    }),

  setPublished: staffProcedure
    .input(form({ locale: locale(), id: text(), publish: flag() }))
    .mutation(async ({ ctx, input }) => {
      const { id, publish } = input;
      const item = expectRow(
        await db
          .update(newsEvent)
          .set({ publishedAt: publish ? new Date() : null })
          .where(eq(newsEvent.id, id))
          .returning(),
        "News/event",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: publish ? "newsEvent.publish" : "newsEvent.unpublish",
        entityType: "NewsEvent",
        entityId: item.id,
        metadata: { published: publish },
      });

      revalidate(input.locale);
    }),
});
