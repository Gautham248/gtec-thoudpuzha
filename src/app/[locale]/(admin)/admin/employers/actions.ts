"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function approveEmployer(formData: FormData) {
  await run(() => api().admin.employers.approve(formData), forbidden(formData));
}

export async function rejectEmployer(formData: FormData) {
  await run(() => api().admin.employers.reject(formData), forbidden(formData));
}

export async function approveAndTrustEmployer(formData: FormData) {
  await run(
    () => api().admin.employers.approveAndTrust(formData),
    forbidden(formData),
  );
}

export async function toggleAutoPublishTrusted(formData: FormData) {
  await run(
    () => api().admin.employers.toggleAutoPublishTrusted(formData),
    forbidden(formData),
  );
}
