import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import Link from "next/link";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  APPLIED: "bg-primary/10 text-primary",
  VIEWED: "bg-purple-100 text-purple-800",
  SHORTLISTED: "bg-accent/10 text-accent",
  REJECTED: "bg-destructive/10 text-destructive",
  HIRED: "bg-primary/10 text-primary",
};

export default async function StudentApplicationsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await auth();
  if (!session.userId) return null;

  const role = await getEffectiveRole(session);
  const sa = await getTranslations({ locale, namespace: "studentApplications" });
  const rgt = await getTranslations({ locale, namespace: "roleGate" });

  if (role !== Role.STUDENT && role !== Role.JOB_SEEKER) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">{rgt("notYourAccount")}</h1>
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
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">{sa("noProfile")}</h1>
          <p className="mt-2 text-muted-foreground">{sa("noProfileDesc")}</p>
          <Link
            href="/portal/student/biodata"
            className="mt-4 inline-block text-primary underline"
          >
            {sa("completeBiodata")}
          </Link>
        </div>
      </div>
    );
  }

  const applications = await prisma.application.findMany({
    where: { candidateProfileId: profile.id },
    orderBy: { appliedAt: "desc" },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          status: true,
          applicationDeadline: true,
          employer: {
            select: {
              companyName: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl p-4 py-10">
      <h1 className="mb-8 text-3xl font-semibold">{sa("heading")}</h1>

      {applications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>{sa("noApplications")}</p>
          <Link
            href="/portal/jobs"
            className="mt-2 inline-block text-primary underline"
          >
            {sa("browseJobs")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const badgeStyle = STATUS_STYLES[app.status] ?? "bg-muted text-foreground";
            return (
              <div
                key={app.id}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/portal/jobs/${app.jobPosting.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {app.jobPosting.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {app.jobPosting.employer.companyName}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${badgeStyle}`}
                  >
                    {app.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {sa("applied", { date: new Date(app.appliedAt).toLocaleDateString() })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
