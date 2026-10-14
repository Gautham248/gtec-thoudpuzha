import { revalidatePath, revalidateTag } from "next/cache";
import { eq, max } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import {
  course as courseTable,
  courseCategory,
  courseStatus,
} from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";
import {
  checkbox,
  choice,
  direction,
  file,
  form,
  locale,
  optionalText,
  text,
} from "@/server/form";
import { router, staffProcedure } from "@/server/trpc";

function revalidate(locale: string) {
  revalidateTag("published-courses", "max");
  revalidateTag("courses", "max");
  revalidatePath(`/${locale}/admin/courses`);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const courseFields = {
  locale: locale(),
  titleEn: text(),
  titleMl: optionalText(),
  slug: text(),
  categoryId: optionalText(),
  descriptionEn: optionalText(),
  descriptionMl: optionalText(),
  durationText: optionalText(),
  careerOutcomesEn: optionalText(),
  careerOutcomesMl: optionalText(),
  featured: checkbox(),
  status: choice(courseStatus.enumValues),
  certifications: text(),
  syllabus: text(),
};

type CourseInput = z.output<z.ZodObject<typeof courseFields>>;

/** Column values shared by create and update. */
function courseValues(input: CourseInput) {
  const certifications = input.certifications
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let syllabus: Record<string, unknown> | null = null;
  try {
    if (input.syllabus) syllabus = JSON.parse(input.syllabus);
  } catch {
    // ignore invalid JSON
  }

  return {
    titleEn: input.titleEn,
    titleMl: input.titleMl,
    categoryId: input.categoryId,
    descriptionEn: input.descriptionEn,
    descriptionMl: input.descriptionMl,
    durationText: input.durationText,
    syllabus,
    certifications,
    careerOutcomesEn: input.careerOutcomesEn,
    careerOutcomesMl: input.careerOutcomesMl,
    featured: input.featured,
    status: input.status ?? "DRAFT",
  };
}

export const coursesRouter = router({
  /* ─── Categories ─── */

  createCategory: staffProcedure
    .input(form({ locale: locale(), nameEn: text(), nameMl: optionalText() }))
    .mutation(async ({ ctx, input }) => {
      const { nameEn, nameMl } = input;
      const [maxOrder] = await db
        .select({ sortOrder: max(courseCategory.sortOrder) })
        .from(courseCategory);

      const [category] = await db
        .insert(courseCategory)
        .values({
          nameEn,
          nameMl,
          sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
        })
        .returning();

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "courseCategory.create",
        entityType: "CourseCategory",
        entityId: category.id,
        metadata: { nameEn, nameMl },
      });

      revalidate(input.locale);
    }),

  updateCategory: staffProcedure
    .input(
      form({
        locale: locale(),
        id: text(),
        nameEn: text(),
        nameMl: optionalText(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nameEn, nameMl } = input;
      expectRow(
        await db
          .update(courseCategory)
          .set({ nameEn, nameMl })
          .where(eq(courseCategory.id, id))
          .returning({ id: courseCategory.id }),
        "Course category",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "courseCategory.update",
        entityType: "CourseCategory",
        entityId: id,
        metadata: { nameEn, nameMl },
      });

      revalidate(input.locale);
    }),

  deleteCategory: staffProcedure
    .input(form({ locale: locale(), id: text() }))
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .delete(courseCategory)
          .where(eq(courseCategory.id, input.id))
          .returning({ id: courseCategory.id }),
        "Course category",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "courseCategory.delete",
        entityType: "CourseCategory",
        entityId: input.id,
      });

      revalidate(input.locale);
    }),

  moveCategory: staffProcedure
    .input(form({ locale: locale(), id: text(), direction: direction() }))
    .mutation(async ({ ctx, input }) => {
      const { id, direction } = input;
      const categories = await db.query.courseCategory.findMany({
        orderBy: (c, { asc }) => asc(c.sortOrder),
      });

      const index = categories.findIndex((c) => c.id === id);
      if (index === -1) return;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= categories.length) return;

      const current = categories[index];
      const swap = categories[swapIndex];

      await db.transaction(async (tx) => {
        await tx
          .update(courseCategory)
          .set({ sortOrder: swap.sortOrder })
          .where(eq(courseCategory.id, current.id));
        await tx
          .update(courseCategory)
          .set({ sortOrder: current.sortOrder })
          .where(eq(courseCategory.id, swap.id));
      });

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "courseCategory.reorder",
        entityType: "CourseCategory",
        entityId: current.id,
        metadata: { direction, swappedWith: swap.id },
      });

      revalidate(input.locale);
    }),

  /* ─── Courses ─── */

  create: staffProcedure
    .input(form(courseFields))
    .mutation(async ({ ctx, input }) => {
      const values = courseValues(input);
      const slug = input.slug || slugify(input.titleEn);

      const [course] = await db
        .insert(courseTable)
        .values({ ...values, slug })
        .returning();

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "course.create",
        entityType: "Course",
        entityId: course.id,
        metadata: {
          titleEn: values.titleEn,
          slug,
          categoryId: values.categoryId,
          status: values.status,
        },
      });

      revalidate(input.locale);
    }),

  update: staffProcedure
    .input(form({ ...courseFields, id: text() }))
    .mutation(async ({ ctx, input }) => {
      const values = courseValues(input);
      const slug = input.slug;

      expectRow(
        await db
          .update(courseTable)
          .set({ ...values, slug })
          .where(eq(courseTable.id, input.id))
          .returning({ id: courseTable.id }),
        "Course",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "course.update",
        entityType: "Course",
        entityId: input.id,
        metadata: {
          titleEn: values.titleEn,
          slug,
          categoryId: values.categoryId,
          status: values.status,
        },
      });

      revalidate(input.locale);
    }),

  delete: staffProcedure
    .input(form({ locale: locale(), id: text() }))
    .mutation(async ({ ctx, input }) => {
      expectRow(
        await db
          .delete(courseTable)
          .where(eq(courseTable.id, input.id))
          .returning({ id: courseTable.id }),
        "Course",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "course.delete",
        entityType: "Course",
        entityId: input.id,
      });

      revalidate(input.locale);
    }),

  uploadImage: staffProcedure
    .input(form({ locale: locale(), courseId: text(), coverImage: file() }))
    .mutation(async ({ ctx, input }) => {
      const { courseId, coverImage } = input;

      if (!coverImage || coverImage.size === 0) {
        revalidatePath(`/${input.locale}/admin/courses`);
        return;
      }

      const key = await uploadFile(coverImage, "course-covers");

      expectRow(
        await db
          .update(courseTable)
          .set({ coverImageUrl: key })
          .where(eq(courseTable.id, courseId))
          .returning({ id: courseTable.id }),
        "Course",
      );

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "course.uploadCoverImage",
        entityType: "Course",
        entityId: courseId,
        metadata: { storageKey: key },
      });

      revalidate(input.locale);
    }),
});
