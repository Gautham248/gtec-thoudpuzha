"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

/* ─── Category actions ─── */

export async function createCategory(formData: FormData) {
  await run(
    () => api().admin.courses.createCategory(formData),
    forbidden(formData),
  );
}

export async function updateCategory(formData: FormData) {
  await run(
    () => api().admin.courses.updateCategory(formData),
    forbidden(formData),
  );
}

export async function deleteCategory(formData: FormData) {
  await run(
    () => api().admin.courses.deleteCategory(formData),
    forbidden(formData),
  );
}

export async function moveCategory(formData: FormData) {
  await run(
    () => api().admin.courses.moveCategory(formData),
    forbidden(formData),
  );
}

/* ─── Course actions ─── */

export async function createCourse(formData: FormData) {
  await run(() => api().admin.courses.create(formData), forbidden(formData));
}

export async function updateCourse(formData: FormData) {
  await run(() => api().admin.courses.update(formData), forbidden(formData));
}

export async function deleteCourse(formData: FormData) {
  await run(() => api().admin.courses.delete(formData), forbidden(formData));
}

export async function uploadCourseImage(formData: FormData) {
  await run(
    () => api().admin.courses.uploadImage(formData),
    forbidden(formData),
  );
}
