"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function approveJobPosting(formData: FormData) {
  await run(
    () => api().admin.jobPostings.approve(formData),
    forbidden(formData),
  );
}

export async function rejectJobPosting(formData: FormData) {
  await run(
    () => api().admin.jobPostings.reject(formData),
    forbidden(formData),
  );
}

export async function editAndApproveJobPosting(formData: FormData) {
  await run(
    () => api().admin.jobPostings.editAndApprove(formData),
    forbidden(formData),
  );
}
