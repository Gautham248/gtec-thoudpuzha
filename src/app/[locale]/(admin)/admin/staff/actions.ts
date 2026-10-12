"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function inviteStaff(formData: FormData) {
  await run(() => api().admin.staff.invite(formData), forbidden(formData));
}

export async function deactivateStaff(formData: FormData) {
  await run(() => api().admin.staff.deactivate(formData), forbidden(formData));
}

export async function reactivateStaff(formData: FormData) {
  await run(() => api().admin.staff.reactivate(formData), forbidden(formData));
}

export async function setStaffPermission(formData: FormData) {
  await run(
    () => api().admin.staff.setPermission(formData),
    forbidden(formData),
  );
}
