"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateApplicationStatus } from "./actions";
import type { ApplicationStatus } from "@prisma/client";

interface Applicant {
  id: string;
  status: ApplicationStatus;
  appliedAt: Date;
  candidateProfile: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    educationalQualification: string | null;
    skillIds: string[];
    preferredJobLocation: string | null;
    preferredJobType: string | null;
    careerObjective: string | null;
    photoUrl: string | null;
  };
}

const STATUS_BADGE: Record<string, string> = {
  APPLIED: "bg-primary/10 text-primary",
  VIEWED: "bg-purple-100 text-purple-800",
  SHORTLISTED: "bg-accent/10 text-accent",
  REJECTED: "bg-destructive/10 text-destructive",
  HIRED: "bg-primary/10 text-primary",
};

const NEXT_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  APPLIED: ["SHORTLISTED", "REJECTED"],
  VIEWED: ["SHORTLISTED", "REJECTED", "HIRED"],
  SHORTLISTED: ["REJECTED", "HIRED"],
  REJECTED: [],
  HIRED: [],
};

function ApplicantRow({
  applicant,
}: {
  applicant: Applicant;
}) {
  const t = useTranslations("employerApplicants");
  const [_state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const newStatus = formData.get("status") as ApplicationStatus;
      await updateApplicationStatus(applicant.id, newStatus);
      return {};
    },
    {},
  );

  const badgeStyle = STATUS_BADGE[applicant.status] ?? "bg-muted text-foreground";
  const transitions = NEXT_TRANSITIONS[applicant.status] ?? [];

  return (
    <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {applicant.candidateProfile.photoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={applicant.candidateProfile.photoUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-medium">
                {applicant.candidateProfile.fullName ?? t("unknown")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {applicant.candidateProfile.preferredJobType?.replace(/_/g, " ") ?? "—"}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {applicant.candidateProfile.email && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t("email")}</span>
                <p>{applicant.candidateProfile.email}</p>
              </div>
            )}
            {applicant.candidateProfile.phone && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t("phone")}</span>
                <p>{applicant.candidateProfile.phone}</p>
              </div>
            )}
            {applicant.candidateProfile.educationalQualification && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t("qualification")}</span>
                <p>{applicant.candidateProfile.educationalQualification.replace(/_/g, " ")}</p>
              </div>
            )}
            {applicant.candidateProfile.preferredJobLocation && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t("location")}</span>
                <p>{applicant.candidateProfile.preferredJobLocation}</p>
              </div>
            )}
          </div>

          {applicant.candidateProfile.careerObjective && (
            <p className="mt-2 text-sm italic text-muted-foreground">
              &ldquo;{applicant.candidateProfile.careerObjective}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${badgeStyle}`}
          >
            {applicant.status}
          </span>

          {transitions.length > 0 && (
            <form action={action}>
              <input type="hidden" name="applicationId" value={applicant.id} />
              <div className="flex flex-wrap gap-1.5">
                {transitions.map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="submit"
                    name="status"
                    value={nextStatus}
                    disabled={pending}
                    className="rounded bg-muted px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {nextStatus}
                  </button>
                ))}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function ApplicantsList({
  applicants,
  postingId: _postingId,
}: {
  applicants: Applicant[];
  postingId: string;
}) {
  const t = useTranslations("employerApplicants");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("applicantCount", { count: applicants.length })}
      </p>
      {applicants.map((applicant) => (
        <ApplicantRow key={applicant.id} applicant={applicant} />
      ))}
    </div>
  );
}
