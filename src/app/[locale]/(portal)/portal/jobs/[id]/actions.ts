"use server";

import { api, run } from "@/server/action";

export async function applyToJob(
  formData: FormData,
): Promise<{ error?: string; applied?: boolean }> {
  return run(() => api().portal.jobs.applyToJob(formData));
}
