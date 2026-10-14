"use server";

import { api, run } from "@/server/action";

export async function submitEmployerRegistration(formData: FormData) {
  return run(() => api().portal.employer.register(formData));
}

export async function updateEmployerProfile(formData: FormData) {
  return run(() => api().portal.employer.updateProfile(formData));
}
