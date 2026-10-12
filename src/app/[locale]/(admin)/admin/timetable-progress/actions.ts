"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function addTimetableEntry(formData: FormData) {
  await run(
    () => api().admin.timetableProgress.addTimetableEntry(formData),
    forbidden(formData),
  );
}

export async function deleteTimetableEntry(formData: FormData) {
  await run(
    () => api().admin.timetableProgress.deleteTimetableEntry(formData),
    forbidden(formData),
  );
}

export async function addProgressEntry(formData: FormData) {
  await run(
    () => api().admin.timetableProgress.addProgressEntry(formData),
    forbidden(formData),
  );
}

export async function deleteProgressEntry(formData: FormData) {
  await run(
    () => api().admin.timetableProgress.deleteProgressEntry(formData),
    forbidden(formData),
  );
}
