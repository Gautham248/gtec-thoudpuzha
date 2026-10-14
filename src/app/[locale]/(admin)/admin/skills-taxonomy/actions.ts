"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function approveSkill(formData: FormData) {
  await run(
    () => api().admin.skillsTaxonomy.approve(formData),
    forbidden(formData),
  );
}

export async function mergeSkill(formData: FormData) {
  await run(
    () => api().admin.skillsTaxonomy.merge(formData),
    forbidden(formData),
  );
}

export async function deleteSkill(formData: FormData) {
  await run(
    () => api().admin.skillsTaxonomy.delete(formData),
    forbidden(formData),
  );
}
