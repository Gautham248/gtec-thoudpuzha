import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import type { JobPostingStatus as _JobPostingStatus } from "@prisma/client";

interface EmployerDashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function EmployerDashboardPage({ params }: EmployerDashboardPageProps) {
  const { locale } = await params;
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) {
    redirect("/forbidden");
  }

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!profile) {
    redirect("/portal/employer/register");
  }

  if (profile.status === "PENDING" || profile.status === "REJECTED") {
    redirect("/portal/employer/register/status");
  }

  const t = await getTranslations({ locale, namespace: "employerDashboard" });
  const sb = await getTranslations({ locale, namespace: "statusBadge" });

  const postings = await prisma.jobPosting.findMany({
    where: { employerId: profile.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      jobType: true,
      status: true,
      applicationDeadline: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t("heading")}</h1>
          <p className="mt-1 text-muted-foreground">{profile.companyName}</p>
        </div>
        <Link
          href="/portal/employer/post-vacancy"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          {t("postVacancy")}
        </Link>
      </div>

      <h2 className="mb-4 text-xl font-semibold">{t("yourPostings")}</h2>

      {postings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>{t("noPostings")}</p>
          <Link
            href="/portal/employer/post-vacancy"
            className="mt-2 inline-block text-primary underline"
          >
            {t("postFirst")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {postings.map((posting) => {
            return (
              <Link
                key={posting.id}
                href={`/portal/employer/postings/${posting.id}/applicants`}
                className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{posting.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {posting.jobType.replace("_", " ")} · {t("deadline", { date: new Date(posting.applicationDeadline).toLocaleDateString() })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
                      posting.status === "PENDING" ? "bg-accent/10 text-accent" :
                      posting.status === "APPROVED" ? "bg-primary/10 text-primary" :
                      posting.status === "REJECTED" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-foreground"
                    }`}
                  >
                    {sb(posting.status)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{t("posted", { date: new Date(posting.createdAt).toLocaleDateString() })}</span>
                  <span>{t("applicantCount", { count: posting._count.applications })}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
