import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import { getJobDetail } from "@/lib/jobs";
import { isProfileComplete } from "@/lib/biodata";
import { getSkillsByIds } from "@/lib/skills";
import type { JobType as _JobType } from "@/db/types";
import { ApplyButton } from "./apply-button";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { locale, id } = await params;

  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const role = await getEffectiveRole(session);
  if (role !== Role.STUDENT && role !== Role.JOB_SEEKER) {
    redirect(`/${locale}/forbidden`);
  }

  const t = await getTranslations({ locale, namespace: "jobDetail" });
  const jt = await getTranslations({ locale, namespace: "jobType" });
  const eit = await getTranslations({ locale, namespace: "industry" });
  const ect = await getTranslations({
    locale,
    namespace: "employeeCountLabel",
  });

  const job = await getJobDetail(id);
  if (!job) notFound();

  const [skills, profile] = await Promise.all([
    getSkillsByIds(job.skillIds),
    db.query.candidateProfile.findFirst({
      where: (p, { eq }) => eq(p.userId, session.userId!),
    }),
  ]);

  let alreadyApplied = false;
  let profileComplete = false;

  if (profile) {
    const completionInfo = isProfileComplete({
      ...profile,
      isVerifiedStudent: profile.isVerifiedStudent,
      studentRecordId: profile.studentRecordId,
    });
    profileComplete = completionInfo;

    if (profileComplete) {
      const existing = await db.query.application.findFirst({
        where: (a, { and, eq }) =>
          and(eq(a.jobPostingId, id), eq(a.candidateProfileId, profile.id)),
        columns: { id: true },
      });
      alreadyApplied = !!existing;
    }
  }

  const salaryDisplay =
    job.salaryVisibility === "DISCLOSE" && job.salaryMin
      ? `₹${job.salaryMin.toLocaleString("en-IN")}${
          job.salaryMax ? ` - ₹${job.salaryMax.toLocaleString("en-IN")}` : "+"
        }`
      : t("salaryDisclosed");

  return (
    <div className="mx-auto max-w-4xl p-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">{job.title}</h1>
        <p className="mt-1 text-lg text-muted-foreground">
          {job.employer.companyName}
          {job.department && ` · ${job.department}`}
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {jt(job.jobType)}
        </span>
        {job.employer.companyAddress && (
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
            {job.employer.companyAddress}
          </span>
        )}
        {job.employer.industrySector && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {eit(job.employer.industrySector)}
          </span>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t("salary")}</p>
          <p className="mt-1 font-medium">{salaryDisplay}</p>
        </div>
        {job.employer.employeeCountRange && (
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t("companySize")}</p>
            <p className="mt-1 font-medium">
              {ect(job.employer.employeeCountRange)}
            </p>
          </div>
        )}
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t("deadline")}</p>
          <p className="mt-1 font-medium">
            {new Date(job.applicationDeadline).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-2 text-xl font-semibold">{t("aboutRole")}</h2>
        <div className="whitespace-pre-wrap text-foreground">
          {job.description}
        </div>
      </div>

      {job.employer.aboutCompany && (
        <div className="mb-8">
          <h2 className="mb-2 text-xl font-semibold">
            {t("aboutCompany", { name: job.employer.companyName })}
          </h2>
          <p className="text-foreground">{job.employer.aboutCompany}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 text-xl font-semibold">{t("skills")}</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800"
              >
                {skill.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-6">
        <ApplyButton
          jobPostingId={id}
          locale={locale}
          hasProfile={!!profile}
          profileComplete={profileComplete}
          alreadyApplied={alreadyApplied}
        />
      </div>
    </div>
  );
}
