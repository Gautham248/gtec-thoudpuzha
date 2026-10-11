"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { course as courseTable, courseCategory } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

/* ─── Category actions ─── */

export async function createCategory(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const nameEn = formData.get("nameEn") as string;
  const nameMl = (formData.get("nameMl") as string) || null;

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
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "courseCategory.create",
    entityType: "CourseCategory",
    entityId: category.id,
    metadata: { nameEn, nameMl },
  });

  revalidateTag("published-courses", "max");
  revalidateTag("courses", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/courses`);
}

export async function updateCategory(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const nameEn = formData.get("nameEn") as string;
  const nameMl = (formData.get("nameMl") as string) || null;

  expectRow(
    await db
      .update(courseCategory)
      .set({ nameEn, nameMl })
      .where(eq(courseCategory.id, id))
      .returning({ id: courseCategory.id }),
    "Course category",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "courseCategory.update",
    entityType: "CourseCategory",
    entityId: id,
    metadata: { nameEn, nameMl },
  });

  revalidateTag("published-courses", "max");
  revalidateTag("courses", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/courses`);
}

export async function deleteCategory(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;

  expectRow(
    await db
      .delete(courseCategory)
      .where(eq(courseCategory.id, id))
      .returning({ id: courseCategory.id }),
    "Course category",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "courseCategory.delete",
    entityType: "CourseCategory",
    entityId: id,
  });

  revalidateTag("published-courses", "max");
  revalidateTag("courses", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/courses`);
}

export async function moveCategory(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const direction = formData.get("direction") as "up" | "down";

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
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "courseCategory.reorder",
    entityType: "CourseCategory",
    entityId: current.id,
    metadata: { direction, swappedWith: swap.id },
  });

  revalidateTag("published-courses", "max");
  revalidateTag("courses", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/courses`);
}

/* ─── Course actions ─── */

export async function createCourse(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const titleEn = formData.get("titleEn") as string;
  const titleMl = (formData.get("titleMl") as string) || null;
  const slug = (formData.get("slug") as string) || slugify(titleEn);
  const categoryId = (formData.get("categoryId") as string) || null;
  const descriptionEn = (formData.get("descriptionEn") as string) || null;
  const descriptionMl = (formData.get("descriptionMl") as string) || null;
  const durationText = (formData.get("durationText") as string) || null;
  const careerOutcomesEn = (formData.get("careerOutcomesEn") as string) || null;
  const careerOutcomesMl = (formData.get("careerOutcomesMl") as string) || null;
  const featured = formData.get("featured") === "on";
  const status =
    (formData.get("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT";
  const certificationsRaw = (formData.get("certifications") as string) || "";
  const certifications = certificationsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let syllabus: Record<string, unknown> | null = null;
  try {
    const syllabusRaw = formData.get("syllabus") as string;
    if (syllabusRaw) {
      syllabus = JSON.parse(syllabusRaw);
    }
  } catch {
    // ignore invalid JSON
  }

  const [course] = await db
    .insert(courseTable)
    .values({
      titleEn,
      titleMl,
      slug,
      categoryId,
      descriptionEn,
      descriptionMl,
      durationText,
      syllabus,
      certifications,
      careerOutcomesEn,
      careerOutcomesMl,
      featured,
      status,
    })
    .returning();

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "course.create",
    entityType: "Course",
    entityId: course.id,
    metadata: { titleEn, slug, categoryId, status },
  });

  revalidateTag("published-courses", "max");
  revalidateTag("courses", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/courses`);
}

export async function updateCourse(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const titleEn = formData.get("titleEn") as string;
  const titleMl = (formData.get("titleMl") as string) || null;
  const slug = (formData.get("slug") as string) || "";
  const categoryId = (formData.get("categoryId") as string) || null;
  const descriptionEn = (formData.get("descriptionEn") as string) || null;
  const descriptionMl = (formData.get("descriptionMl") as string) || null;
  const durationText = (formData.get("durationText") as string) || null;
  const careerOutcomesEn = (formData.get("careerOutcomesEn") as string) || null;
  const careerOutcomesMl = (formData.get("careerOutcomesMl") as string) || null;
  const featured = formData.get("featured") === "on";
  const status =
    (formData.get("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT";
  const certificationsRaw = (formData.get("certifications") as string) || "";
  const certifications = certificationsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let syllabus: Record<string, unknown> | null = null;
  try {
    const syllabusRaw = formData.get("syllabus") as string;
    if (syllabusRaw) {
      syllabus = JSON.parse(syllabusRaw);
    }
  } catch {
    // ignore invalid JSON
  }

  expectRow(
    await db
      .update(courseTable)
      .set({
        titleEn,
        titleMl,
        slug,
        categoryId,
        descriptionEn,
        descriptionMl,
        durationText,
        syllabus,
        certifications,
        careerOutcomesEn,
        careerOutcomesMl,
        featured,
        status,
      })
      .where(eq(courseTable.id, id))
      .returning({ id: courseTable.id }),
    "Course",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "course.update",
    entityType: "Course",
    entityId: id,
    metadata: { titleEn, slug, categoryId, status },
  });

  revalidateTag("published-courses", "max");
  revalidateTag("courses", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/courses`);
}

export async function deleteCourse(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;

  expectRow(
    await db
      .delete(courseTable)
      .where(eq(courseTable.id, id))
      .returning({ id: courseTable.id }),
    "Course",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "course.delete",
    entityType: "Course",
    entityId: id,
  });

  revalidateTag("published-courses", "max");
  revalidateTag("courses", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/courses`);
}

export async function uploadCourseImage(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const courseId = formData.get("courseId") as string;
  const file = formData.get("coverImage") as File | null;

  if (!file || file.size === 0) {
    revalidatePath(`/${localeFromFormData(formData)}/admin/courses`);
    return;
  }

  const key = await uploadFile(file, "course-covers");

  expectRow(
    await db
      .update(courseTable)
      .set({ coverImageUrl: key })
      .where(eq(courseTable.id, courseId))
      .returning({ id: courseTable.id }),
    "Course",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "course.uploadCoverImage",
    entityType: "Course",
    entityId: courseId,
    metadata: { storageKey: key },
  });

  revalidateTag("published-courses", "max");
  revalidateTag("courses", "max");
  revalidatePath(`/${localeFromFormData(formData)}/admin/courses`);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
