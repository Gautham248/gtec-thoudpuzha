"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function createPartner(formData: FormData) {
  await run(
    () => api().admin.certificationPartners.create(formData),
    forbidden(formData),
  );
}

export async function updatePartner(formData: FormData) {
  await run(
    () => api().admin.certificationPartners.update(formData),
    forbidden(formData),
  );
}

export async function deletePartner(formData: FormData) {
  await run(
    () => api().admin.certificationPartners.delete(formData),
    forbidden(formData),
  );
}

export async function movePartner(formData: FormData) {
  await run(
    () => api().admin.certificationPartners.move(formData),
    forbidden(formData),
  );
}
