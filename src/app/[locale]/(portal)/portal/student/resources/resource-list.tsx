import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import type { ResourceType } from "@prisma/client";
import Link from "next/link";

interface ResourceListProps {
  type: ResourceType;
  title: string;
  locale: string;
}

export async function ResourceList({ type, title, locale }: ResourceListProps) {
  const session = await auth();
  if (!session.userId) return null;

  const t = await getTranslations({ locale, namespace: "resources" });

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-4 text-muted-foreground">
            {t("completeProfile")}
          </p>
        </div>
      </div>
    );
  }

  const enrollments = await prisma.studentCourseEnrollment.findMany({
    where: { studentProfileId: profile.id },
    select: { courseId: true },
  });

  if (enrollments.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-4 text-muted-foreground">
            {t("notEnrolled")}
          </p>
          <Link
            href="/portal/student"
            className="mt-4 inline-block text-primary underline"
          >
            {t("backToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  const courseIds = enrollments.map((e) => e.courseId);

  const [resources, courses] = await Promise.all([
    prisma.academicResource.findMany({
      where: { courseId: { in: courseIds }, type },
      orderBy: { uploadedAt: "desc" },
      include: { course: { select: { titleEn: true } } },
    }),
    prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, titleEn: true },
    }),
  ]);

  if (resources.length === 0) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">
          {t("noResources", { type: title.toLowerCase() })}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
      <div className="space-y-4">
        {courses.map((course) => {
          const courseResources = resources.filter(
            (r) => r.courseId === course.id,
          );
          if (courseResources.length === 0) return null;
          return (
            <div key={course.id}>
              <h2 className="mb-3 text-lg font-medium text-foreground">
                {course.titleEn}
              </h2>
              <div className="space-y-2">
                {courseResources.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded border border-border p-3"
                  >
                    <div>
                      {r.fileUrl ? (
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary underline"
                        >
                          {r.title}
                        </a>
                      ) : (
                        <span className="font-medium">{r.title}</span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {r.uploadedAt.toISOString().slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
