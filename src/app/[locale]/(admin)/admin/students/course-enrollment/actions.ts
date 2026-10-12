"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function enrollStudentInCourses(formData: FormData) {
  await run(
    () => api().admin.courseEnrollment.enroll(formData),
    forbidden(formData),
  );
}

export async function unenrollStudentFromCourse(formData: FormData) {
  await run(
    () => api().admin.courseEnrollment.unenroll(formData),
    forbidden(formData),
  );
}
