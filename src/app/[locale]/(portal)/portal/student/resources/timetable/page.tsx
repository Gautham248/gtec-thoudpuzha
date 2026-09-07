import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import Link from "next/link";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function TimetablePage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();
  if (!session.userId) return null;

  const rt = await getTranslations({ locale, namespace: "resources" });
  const t = await getTranslations({ locale, namespace: "timetable" });

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">{t("heading")}</h1>
          <p className="mt-4 text-muted-foreground">{rt("completeProfile")}</p>
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
          <h1 className="text-2xl font-semibold">{t("heading")}</h1>
          <p className="mt-4 text-muted-foreground">{rt("notEnrolled")}</p>
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

  const [entries, courses] = await Promise.all([
    prisma.timetableEntry.findMany({
      where: { courseId: { in: courseIds } },
      orderBy: { createdAt: "desc" },
      include: { course: { select: { titleEn: true } } },
    }),
    prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, titleEn: true },
    }),
  ]);

  if (entries.length === 0) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">{t("heading")}</h1>
        <p className="text-muted-foreground">{t("noEntries")}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t("heading")}</h1>
      <div className="space-y-6">
        {courses.map((course) => {
          const courseEntries = entries.filter(
            (e) => e.courseId === course.id,
          );
          if (courseEntries.length === 0) return null;
          return (
            <div key={course.id}>
              <h2 className="mb-3 text-lg font-medium text-foreground">
                {course.titleEn}
              </h2>
              <div className="space-y-3">
                {courseEntries.map((e) => (
                  <div
                    key={e.id}
                    className="rounded border border-border p-4"
                  >
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {e.contentText}
                    </p>
                    {e.createdAt && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t("updated", { date: e.createdAt.toISOString().slice(0, 10) })}
                      </p>
                    )}
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
