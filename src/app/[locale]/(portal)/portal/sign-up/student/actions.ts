"use server";

import { api, run } from "@/server/action";

export async function lookupStudentRecord(formData: FormData) {
  return run(() => api().portal.studentSignUp.lookup(formData));
}

export async function finalizeStudentVerification(studentRecordId: string) {
  return run(() => api().portal.studentSignUp.finalize(studentRecordId));
}
