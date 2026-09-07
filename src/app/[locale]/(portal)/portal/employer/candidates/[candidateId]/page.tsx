import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import { getSearchableCandidates } from "@/lib/biodata-search";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ candidateId: string; locale: string }>;
}

export default async function CandidateDetailPage({ params }: PageProps) {
  const { candidateId, locale } = await params;
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) redirect("/forbidden");

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!profile || profile.status !== "APPROVED") {
    redirect("/portal/employer/register/status");
  }

  const searchable = await getSearchableCandidates();
  const candidate = searchable.find((c) => c.id === candidateId);
  if (!candidate) {
    redirect("/portal/employer/candidates");
  }

  const ct = await getTranslations({ locale, namespace: "candidateDetail" });
  const qt = await getTranslations({ locale, namespace: "qualification" });
  const jt = await getTranslations({ locale, namespace: "jobType" });

  let courseNames: { id: string; titleEn: string }[] = [];
  if (candidate.courseCompletedIds.length > 0) {
    courseNames = await prisma.course.findMany({
      where: { id: { in: candidate.courseCompletedIds } },
      select: { id: true, titleEn: true },
    });
  }

  let skillLabels: { id: string; label: string }[] = [];
  if (candidate.skillIds.length > 0) {
    skillLabels = await prisma.skill.findMany({
      where: { id: { in: candidate.skillIds } },
      select: { id: true, label: true },
    });
  }

  const courseMap = new Map(courseNames.map((c) => [c.id, c.titleEn]));
  const skillMap = new Map(skillLabels.map((s) => [s.id, s.label]));

  return (
    <div className="mx-auto max-w-4xl p-4 py-10">
      <Link
        href="/portal/employer/candidates"
        className="mb-4 inline-flex items-center text-sm text-primary hover:underline"
      >
        {ct("backToSearch")}
      </Link>

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">
            {candidate.fullName ?? ct("unnamed")}
          </h1>
          {candidate.isVerifiedStudent && (
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
              {ct("verifiedStudent")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Section title={ct("contact")}>
            <Field label={ct("email")} value={candidate.email} />
            <Field label={ct("phone")} value={candidate.phone} />
            <Field label={ct("address")} value={candidate.address} />
          </Section>

          <Section title={ct("education")}>
            <Field
              label={ct("qualification")}
              value={
                candidate.educationalQualification
                  ? qt(candidate.educationalQualification)
                  : null
              }
            />
            <Field
              label={ct("yearOfPassing")}
              value={candidate.yearOfPassing?.toString() ?? null}
            />
            {candidate.isVerifiedStudent && courseNames.length > 0 && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  {ct("coursesCompleted")}
                </span>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {candidate.courseCompletedIds.map((id) => (
                    <li key={id}>{courseMap.get(id) ?? id}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section title={ct("jobPreferences")}>
            <Field
              label={ct("preferredLocation")}
              value={candidate.preferredJobLocation}
            />
            <Field
              label={ct("preferredJobType")}
              value={
                candidate.preferredJobType
                  ? jt(candidate.preferredJobType)
                  : null
              }
            />
            <Field
              label={ct("careerObjective")}
              value={candidate.careerObjective}
            />
          </Section>

          <Section title={ct("skillsLanguages")}>
            {skillLabels.length > 0 && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  {ct("skills")}
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {candidate.skillIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm text-primary"
                    >
                      {skillMap.get(id) ?? id}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {candidate.languagesKnown.length > 0 && (
              <div className="mt-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {ct("languages")}
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {candidate.languagesKnown.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm text-primary"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </div>

        <div className="mt-6 border-t pt-4">
          <Link
            href={`/api/biodata/${candidate.id}/pdf`}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
          >
            {ct("downloadBiodata")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="mb-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <p className="text-sm">{value}</p>
    </div>
  );
}
