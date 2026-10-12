"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function createNewsEvent(formData: FormData) {
  await run(() => api().admin.newsEvents.create(formData), forbidden(formData));
}

export async function updateNewsEvent(formData: FormData) {
  await run(() => api().admin.newsEvents.update(formData), forbidden(formData));
}

export async function deleteNewsEvent(formData: FormData) {
  await run(() => api().admin.newsEvents.delete(formData), forbidden(formData));
}

export async function togglePublishNewsEvent(formData: FormData) {
  await run(
    () => api().admin.newsEvents.setPublished(formData),
    forbidden(formData),
  );
}
