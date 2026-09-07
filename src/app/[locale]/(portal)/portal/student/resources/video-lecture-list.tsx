import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { deriveEmbedUrl } from "@/lib/video";
import Link from "next/link";

export async function VideoLectureList({ locale }: { locale: string }) {
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
          <h1 className="text-2xl font-semibold">{t("videoLectures")}</h1>
          <p className="mt-4 text-muted-foreground">{t("completeProfile")}</p>
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
          <h1 className="text-2xl font-semibold">{t("videoLectures")}</h1>
          <p className="mt-4 text-muted-foreground">{t("notEnrolled")}</p>
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
      where: { courseId: { in: courseIds }, type: "LECTURE" },
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
        <h1 className="mb-2 text-2xl font-semibold">{t("videoLectures")}</h1>
        <p className="text-muted-foreground">
          {t("noResources", { type: t("videoLectures").toLowerCase() })}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t("videoLectures")}</h1>
      <div className="space-y-8">
        {courses.map((course) => {
          const courseResources = resources.filter(
            (r) => r.courseId === course.id,
          );
          if (courseResources.length === 0) return null;
          return (
            <div key={course.id}>
              <h2 className="mb-4 text-lg font-medium text-foreground">
                {course.titleEn}
              </h2>
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                {courseResources.map((r) => (
                  <div key={r.id} className="space-y-2">
                    <div className="aspect-video w-full overflow-hidden rounded border border-border">
                      {r.embedUrl ? (
                        <iframe
                          src={deriveEmbedUrl(r.embedUrl)}
                          title={r.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
                          {t("noVideoUrl")}
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {r.uploadedAt.toISOString().slice(0, 10)}
                    </p>
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
