"use server";

import { api, run } from "@/server/action";

export async function submitVacancy(formData: FormData) {
  return run(() => api().portal.employer.submitVacancy(formData));
}
