import { db } from "@/db";
import type { ResourceType } from "@/db/types";

export async function getStudentResourcePages(
  studentProfileId: string,
  type: ResourceType,
) {
  const enrollments = await db.query.studentCourseEnrollment.findMany({
    where: (e, { eq }) => eq(e.studentProfileId, studentProfileId),
    columns: { courseId: true },
  });

  if (enrollments.length === 0) return { resources: [], enrolledCourses: [] };

  const courseIds = enrollments.map((e) => e.courseId);

  const [resources, courses] = await Promise.all([
    db.query.academicResource.findMany({
      where: (r, { and, eq, inArray }) =>
        and(inArray(r.courseId, courseIds), eq(r.type, type)),
      orderBy: (r, { desc }) => desc(r.uploadedAt),
    }),
    db.query.course.findMany({
      where: (c, { inArray }) => inArray(c.id, courseIds),
      columns: { id: true, titleEn: true },
    }),
  ]);

  return { resources, enrolledCourses: courses };
}
