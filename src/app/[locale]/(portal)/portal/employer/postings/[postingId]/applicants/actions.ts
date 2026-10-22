"use server";

import { api, run } from "@/server/action";
import type { ApplicationErrorCode } from "@/lib/application-status";
import type { ApplicationStatus } from "@/db/types";

type Result = { error?: ApplicationErrorCode; success?: boolean };

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
): Promise<Result> {
  return run(() =>
    api().portal.applicants.updateStatus({
      applicationId,
      status: newStatus,
    }),
  );
}

export async function markApplicationViewed(
  applicationId: string,
): Promise<Result> {
  return run(() => api().portal.applicants.markViewed({ applicationId }));
}
