import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import Link from "next/link";
import {
  BookOpen,
  Video,
  FileText,
  BarChart3,
  Calendar,
  ScrollText,
} from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await auth();
  if (!session.userId) return null;

  const role = await getEffectiveRole(session);
  const t = await getTranslations({ locale, namespace: "studentDashboard" });
  const rgt = await getTranslations({ locale, namespace: "roleGate" });

  if (role !== Role.STUDENT) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">{rgt("notYourAccount")}</h1>
          <p className="mt-2 text-muted-foreground">
            {rgt("description", { roles: "Student" })}
          </p>
          <Link
            href="/portal"
            className="mt-4 inline-block text-primary underline"
          >
            {rgt("goToPortal")}
          </Link>
        </div>
      </div>
    );
  }

  const profile = await db.query.candidateProfile.findFirst({
    where: (p, { eq }) => eq(p.userId, session.userId!),
    columns: { courseCompletedIds: true },
  });

  const hasLinkedCourse = (profile?.courseCompletedIds?.length ?? 0) > 0;

  if (!hasLinkedCourse) {
    return <EmptyState t={t} />;
  }

  return <DashboardGrid t={t} />;
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">{t("welcome")}</h1>
        <p className="mt-4 text-muted-foreground">{t("noCourses")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("noCoursesHint")}
        </p>
      </div>
    </div>
  );
}

function DashboardGrid({ t }: { t: (key: string) => string }) {
  const TILES = [
    {
      titleKey: "studyNotes",
      href: "/portal/student/resources/notes",
      icon: BookOpen,
    },
    {
      titleKey: "videoLectures",
      href: "/portal/student/resources/lectures",
      icon: Video,
    },
    {
      titleKey: "assignments",
      href: "/portal/student/resources/assignments",
      icon: FileText,
    },
    {
      titleKey: "myProgress",
      href: "/portal/student/resources/progress",
      icon: BarChart3,
    },
    {
      titleKey: "timetable",
      href: "/portal/student/resources/timetable",
      icon: Calendar,
    },
    {
      titleKey: "pastPapers",
      href: "/portal/student/resources/past-papers",
      icon: ScrollText,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-8 text-3xl font-semibold">{t("heading")}</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className="flex items-center gap-4 rounded-lg border p-6 transition-shadow hover:shadow-md"
            >
              <Icon className="h-8 w-8 text-primary" />
              <span className="text-lg font-medium">{t(tile.titleKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
