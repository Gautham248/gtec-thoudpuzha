"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

/* ─── Category actions ─── */

export async function createCategory(formData: FormData) {
  await run(
    () => api().admin.gallery.createCategory(formData),
    forbidden(formData),
  );
}

export async function updateCategory(formData: FormData) {
  await run(
    () => api().admin.gallery.updateCategory(formData),
    forbidden(formData),
  );
}

export async function deleteCategory(formData: FormData) {
  await run(
    () => api().admin.gallery.deleteCategory(formData),
    forbidden(formData),
  );
}

export async function moveCategory(formData: FormData) {
  await run(
    () => api().admin.gallery.moveCategory(formData),
    forbidden(formData),
  );
}

/* ─── Media actions ─── */

export async function uploadGalleryImages(formData: FormData) {
  await run(
    () => api().admin.gallery.uploadImages(formData),
    forbidden(formData),
  );
}

export async function addVideoItem(formData: FormData) {
  await run(() => api().admin.gallery.addVideo(formData), forbidden(formData));
}

export async function deleteGalleryItem(formData: FormData) {
  await run(
    () => api().admin.gallery.deleteItem(formData),
    forbidden(formData),
  );
}
