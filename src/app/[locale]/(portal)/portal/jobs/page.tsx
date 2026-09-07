import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { Role, getEffectiveRole } from "@/lib/auth";
import { getActiveJobPostings } from "@/lib/jobs";
import { getApprovedSkills } from "@/lib/skills";
import type { JobType } from "@prisma/client";
import { JobsFilter } from "./jobs-filter";

interface JobsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    jobType?: JobType;
    skillId?: string;
    location?: string;
  }>;
}

export default async function JobsPage({
  params,
  searchParams,
}: JobsPageProps) {
  const { locale } = await params;
  const { jobType, skillId, location } = await searchParams;

  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const role = await getEffectiveRole(session);
  if (role !== Role.STUDENT && role !== Role.JOB_SEEKER) {
    redirect(`/${locale}/forbidden`);
  }

  const t = await getTranslations({ locale, namespace: "jobs" });
  const jt = await getTranslations({ locale, namespace: "jobType" });

  const activeFilters = {
    ...(jobType && { jobType }),
    ...(skillId && { skillId }),
    ...(location && { location }),
  };

  const [postings, skills] = await Promise.all([
    getActiveJobPostings(
      Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
    ),
    getApprovedSkills(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">{t("heading")}</h1>
        <p className="mt-1 text-muted-foreground">{t("description")}</p>
      </div>

      <JobsFilter skills={skills} />

      {postings.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p>{t("noJobs")}</p>
          <p className="mt-1 text-sm">{t("noJobsHint")}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {postings.map((posting) => {
            const salaryDisplay =
              posting.salaryVisibility === "DISCLOSE" && posting.salaryMin
                ? `₹${posting.salaryMin.toLocaleString("en-IN")}${
                    posting.salaryMax
                      ? ` - ₹${posting.salaryMax.toLocaleString("en-IN")}`
                      : "+"
                  }`
                : t("salaryDisclosed");

            return (
              <div
                key={posting.id}
                className="rounded-lg border p-5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">{posting.title}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {posting.employer.companyName}
                      {posting.department && ` · ${posting.department}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                        {jt(posting.jobType)}
                      </span>
                      {posting.employer.companyAddress && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-foreground">
                          {posting.employer.companyAddress}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {salaryDisplay}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("deadline", { date: new Date(posting.applicationDeadline).toLocaleDateString() })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {postings.length > 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("showing", { count: postings.length })}
        </p>
      )}
    </div>
  );
}
