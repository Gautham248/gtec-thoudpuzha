"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function createFlashNews(formData: FormData) {
  await run(() => api().admin.flashNews.create(formData), forbidden(formData));
}

export async function updateFlashNews(formData: FormData) {
  await run(() => api().admin.flashNews.update(formData), forbidden(formData));
}

export async function deleteFlashNews(formData: FormData) {
  await run(() => api().admin.flashNews.delete(formData), forbidden(formData));
}

export async function toggleFlashNewsActive(formData: FormData) {
  await run(
    () => api().admin.flashNews.setActive(formData),
    forbidden(formData),
  );
}

export async function moveFlashNews(formData: FormData) {
  await run(() => api().admin.flashNews.move(formData), forbidden(formData));
}
