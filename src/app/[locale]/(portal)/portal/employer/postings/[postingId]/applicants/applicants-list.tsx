"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { markApplicationViewed, updateApplicationStatus } from "./actions";
import {
  APPLICATION_STATUS_STYLES,
  APPLICATION_TRANSITIONS,
  type ApplicationErrorCode,
} from "@/lib/application-status";
import type { ApplicationStatus } from "@/db/types";

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

function ApplicantRow({ applicant }: { applicant: Applicant }) {
  const t = useTranslations("employerApplicants");
  const st = useTranslations("applicationStatus");
  const te = useTranslations("applicationErrors");
  const [expanded, setExpanded] = useState(false);
  const [viewError, setViewError] = useState<ApplicationErrorCode>();
  const [, startViewing] = useTransition();
  const [state, action, pending] = useActionState(
    async (_prev: { error?: ApplicationErrorCode }, formData: FormData) => {
      const newStatus = formData.get("status") as ApplicationStatus;
      return updateApplicationStatus(applicant.id, newStatus);
    },
    {},
  );

  const profile = applicant.candidateProfile;
  const transitions = APPLICATION_TRANSITIONS[applicant.status];
  const error = state?.error ?? viewError;

  function toggleProfile() {
    const opening = !expanded;
    setExpanded(opening);
    if (opening && applicant.status === "APPLIED") {
      startViewing(async () => {
        setViewError((await markApplicationViewed(applicant.id)).error);
      });
    }
  }

  return (
    <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {profile.photoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.photoUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-medium">
                {profile.fullName ?? t("unknown")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {profile.preferredJobType?.replace(/_/g, " ") ?? "—"}
                {profile.educationalQualification &&
                  ` · ${profile.educationalQualification.replace(/_/g, " ")}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleProfile}
            aria-expanded={expanded}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            {expanded ? t("hideProfile") : t("viewProfile")}
          </button>

          {expanded && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {profile.email && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {t("email")}
                    </span>
                    <p>{profile.email}</p>
                  </div>
                )}
                {profile.phone && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {t("phone")}
                    </span>
                    <p>{profile.phone}</p>
                  </div>
                )}
                {profile.preferredJobLocation && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {t("location")}
                    </span>
                    <p>{profile.preferredJobLocation}</p>
                  </div>
                )}
              </div>

              {profile.careerObjective && (
                <div className="mt-2 text-sm">
                  <span className="font-medium text-muted-foreground">
                    {t("careerObjective")}
                  </span>
                  <p className="italic text-muted-foreground">
                    &ldquo;{profile.careerObjective}&rdquo;
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${APPLICATION_STATUS_STYLES[applicant.status]}`}
          >
            {st(applicant.status)}
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
                    {st(nextStatus)}
                  </button>
                ))}
              </div>
            </form>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {te(error)}
            </p>
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
