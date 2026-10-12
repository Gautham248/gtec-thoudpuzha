"use server";

import { api, run } from "@/server/action";
import type { ApplicationStatus } from "@/db/types";

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
): Promise<{ error?: string; success?: boolean }> {
  return run(() =>
    api().portal.applicants.updateStatus({
      applicationId,
      status: newStatus,
    }),
  );
}
