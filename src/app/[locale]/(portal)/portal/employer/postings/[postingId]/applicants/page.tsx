import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import { ApplicantsList } from "./applicants-list";

interface PageProps {
  params: Promise<{ postingId: string; locale: string }>;
}

export default async function ApplicantsPage({ params }: PageProps) {
  const { postingId, locale } = await params;

  const session = await auth();
  if (!session.userId) redirect(`/${locale}/sign-in`);

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) redirect(`/${locale}/forbidden`);

  const profile = await db.query.employerProfile.findFirst({
    where: (e, { eq }) => eq(e.userId, session.userId!),
  });
  if (!profile) redirect(`/${locale}/portal/employer/register`);
  if (profile.status === "PENDING" || profile.status === "REJECTED") {
    redirect(`/${locale}/portal/employer/register/status`);
  }

  const posting = await db.query.jobPosting.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(
        eq(p.id, postingId),
        eq(p.employerId, profile.id),
        isNull(p.deletedAt),
      ),
    columns: { id: true, title: true, employerId: true },
  });
  if (!posting) redirect(`/${locale}/portal/employer`);

  const t = await getTranslations({ locale, namespace: "employerApplicants" });

  // Rendering never changes statuses: an application becomes VIEWED only
  // when the employer opens that applicant's profile (markApplicationViewed).
  const applicants = await db.query.application.findMany({
    where: (a, { eq }) => eq(a.jobPostingId, postingId),
    orderBy: (a, { desc }) => desc(a.appliedAt),
    with: {
      candidateProfile: {
        columns: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          educationalQualification: true,
          skillIds: true,
          preferredJobLocation: true,
          preferredJobType: true,
          careerObjective: true,
          photoUrl: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl p-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold">{t("heading")}</h1>
      <p className="mb-8 text-muted-foreground">{posting.title}</p>

      {applicants.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>{t("noApplicants")}</p>
        </div>
      ) : (
        <ApplicantsList
          applicants={applicants.map((a) => ({
            ...a,
            candidateProfile: {
              ...a.candidateProfile,
              skillIds: a.candidateProfile.skillIds ?? [],
            },
          }))}
          postingId={postingId}
        />
      )}
    </div>
  );
}
