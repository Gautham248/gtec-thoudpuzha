import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import Link from "next/link";
import { Briefcase, User, Search } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function JobSeekerDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await auth();
  if (!session.userId) return null;

  const role = await getEffectiveRole(session);
  const t = await getTranslations({ locale, namespace: "jobSeekerDashboard" });
  const rgt = await getTranslations({ locale, namespace: "roleGate" });

  if (role !== Role.JOB_SEEKER) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">{rgt("notYourAccount")}</h1>
          <p className="mt-2 text-muted-foreground">
            {rgt("description", { roles: "Job Seeker" })}
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

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
  });

  const hasBiodata = profile !== null;

  const applicationsCount = hasBiodata
    ? await prisma.application.count({
        where: { candidateProfileId: profile.id },
      })
    : 0;

  const recentApplications = hasBiodata
    ? await prisma.application.findMany({
        where: { candidateProfileId: profile.id },
        orderBy: { appliedAt: "desc" },
        take: 3,
        include: {
          jobPosting: {
            select: {
              id: true,
              title: true,
              employer: { select: { companyName: true } },
            },
          },
        },
      })
    : [];

  const STATUS_STYLES: Record<string, string> = {
    APPLIED: "bg-primary/10 text-primary",
    VIEWED: "bg-purple-100 text-purple-800",
    SHORTLISTED: "bg-accent/10 text-accent",
    REJECTED: "bg-destructive/10 text-destructive",
    HIRED: "bg-primary/10 text-primary",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-2 text-3xl font-semibold">
        {profile?.fullName
          ? t("welcomeBack", { name: profile.fullName })
          : t("heading")}
      </h1>
      <p className="text-muted-foreground">
        {hasBiodata ? t("readyToApply") : t("completeProfileHint")}
      </p>

      {/* Action tiles */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/portal/jobs"
          className="flex items-center gap-4 rounded-lg border p-6 transition-shadow hover:shadow-md"
        >
          <Search className="h-8 w-8 text-primary" />
          <div>
            <span className="text-lg font-medium">{t("browseJobs")}</span>
            <p className="text-sm text-muted-foreground">
              {t("browseJobsDesc")}
            </p>
          </div>
        </Link>

        <Link
          href="/portal/student/applications"
          className="flex items-center gap-4 rounded-lg border p-6 transition-shadow hover:shadow-md"
        >
          <Briefcase className="h-8 w-8 text-primary" />
          <div>
            <span className="text-lg font-medium">{t("myApplications")}</span>
            <p className="text-sm text-muted-foreground">
              {applicationsCount > 0
                ? t("applicationsCount", { count: applicationsCount })
                : t("noApplicationsYet")}
            </p>
          </div>
        </Link>

        <Link
          href="/portal/student/biodata"
          className="flex items-center gap-4 rounded-lg border p-6 transition-shadow hover:shadow-md"
        >
          <User className="h-8 w-8 text-purple-600" />
          <div>
            <span className="text-lg font-medium">
              {hasBiodata ? t("updateProfile") : t("completeProfile")}
            </span>
            <p className="text-sm text-muted-foreground">
              {hasBiodata ? t("profileReady") : t("profileNeeded")}
            </p>
          </div>
        </Link>
      </div>

      {/* Recent applications */}
      {recentApplications.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("recentApplications")}</h2>
            <Link
              href="/portal/student/applications"
              className="text-sm text-primary hover:underline"
            >
              {t("viewAll")}
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentApplications.map((app) => {
              const badgeStyle =
                STATUS_STYLES[app.status] ?? "bg-muted text-foreground";
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <Link
                      href={`/portal/jobs/${app.jobPosting.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {app.jobPosting.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {app.jobPosting.employer.companyName}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${badgeStyle}`}
                  >
                    {app.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
