"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function uploadResource(formData: FormData) {
  await run(
    () => api().admin.academicResources.upload(formData),
    forbidden(formData),
  );
}

export async function updateResource(formData: FormData) {
  await run(
    () => api().admin.academicResources.update(formData),
    forbidden(formData),
  );
}

export async function deleteResource(formData: FormData) {
  await run(
    () => api().admin.academicResources.delete(formData),
    forbidden(formData),
  );
}
