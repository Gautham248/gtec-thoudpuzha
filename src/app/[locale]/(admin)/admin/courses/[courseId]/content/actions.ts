"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";
import type { CourseContent } from "@/lib/course-content.types";

export async function saveCourseContent(formData: FormData) {
  await run(
    () => api().admin.courseContent.save(formData),
    forbidden(formData),
  );
}

export async function getCourseContent(
  courseId: string,
): Promise<CourseContent | null> {
  return run(() => api().admin.courseContent.get(courseId));
}
