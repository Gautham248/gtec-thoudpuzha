"use server";

import { api, run } from "@/server/action";
import type { ApplicationErrorCode } from "@/lib/application-status";

export async function applyToJob(
  formData: FormData,
): Promise<{ error?: ApplicationErrorCode; applied?: boolean }> {
  return run(() => api().portal.jobs.applyToJob(formData));
}
