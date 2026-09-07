"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type {
  CandidateSearchResult,
  EmployerJobPosting,
  CandidateSearchFilters,
} from "./actions";

interface CandidateSearchFormProps {
  candidates: CandidateSearchResult[];
  jobPostings: EmployerJobPosting[];
}

type FilterField = keyof CandidateSearchFilters;

export function CandidateSearchForm({
  candidates: initialCandidates,
  jobPostings,
}: CandidateSearchFormProps) {
  const _router = useRouter();
  const t = useTranslations("candidateSearch");
  const jt = useTranslations("jobType");
  const qt = useTranslations("qualification");
  const [filters, setFilters] = useState<CandidateSearchFilters>({});
  const [inviteStatus, setInviteStatus] = useState<Record<string, string>>({});

  const filtered = applyFilters(initialCandidates, filters);

  const handleFilterChange = useCallback(
    (field: FilterField, value: unknown) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleInvite = async (candidateId: string, jobPostingId: string) => {
    setInviteStatus((prev) => ({ ...prev, [candidateId]: "sending..." }));

    try {
      const { inviteToApply } = await import("./actions");
      const result = await inviteToApply(candidateId, jobPostingId);

      if (result.success) {
        setInviteStatus((prev) => ({
          ...prev,
          [candidateId]: "sent",
        }));
      } else {
        setInviteStatus((prev) => ({
          ...prev,
          [candidateId]: result.error ?? "Failed",
        }));
      }
    } catch {
      setInviteStatus((prev) => ({
        ...prev,
        [candidateId]: t("errorSending"),
      }));
    }

    setTimeout(() => {
      setInviteStatus((prev) => {
        const next = { ...prev };
        delete next[candidateId];
        return next;
      });
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-lg font-medium">{t("filters")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-foreground">
              {t("preferredLocation")}
            </label>
            <input
              type="text"
              placeholder={t("locationPlaceholder")}
              value={filters.preferredJobLocation ?? ""}
              onChange={(e) =>
                handleFilterChange("preferredJobLocation", e.target.value)
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              {t("preferredJobType")}
            </label>
            <select
              value={filters.preferredJobType ?? ""}
              onChange={(e) =>
                handleFilterChange(
                  "preferredJobType",
                  e.target.value || undefined,
                )
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">{t("any")}</option>
              <option value="FULL_TIME">{jt("FULL_TIME")}</option>
              <option value="PART_TIME">{jt("PART_TIME")}</option>
              <option value="INTERNSHIP">{jt("INTERNSHIP")}</option>
              <option value="WORK_FROM_HOME">{jt("WORK_FROM_HOME")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              {t("educationalQualification")}
            </label>
            <select
              value={filters.educationalQualification ?? ""}
              onChange={(e) =>
                handleFilterChange(
                  "educationalQualification",
                  e.target.value || undefined,
                )
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">{t("any")}</option>
              <option value="SSLC">{qt("SSLC")}</option>
              <option value="PLUS_TWO">{qt("PLUS_TWO")}</option>
              <option value="DIPLOMA">{qt("DIPLOMA")}</option>
              <option value="GRADUATE">{qt("GRADUATE")}</option>
              <option value="POST_GRADUATE">{qt("POST_GRADUATE")}</option>
              <option value="OTHER">{qt("OTHER")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              {t("languages")}
            </label>
            <input
              type="text"
              placeholder={t("languagesPlaceholder")}
              value={(filters.languagesKnown ?? []).join(", ")}
              onChange={(e) =>
                handleFilterChange(
                  "languagesKnown",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            {t("clearFilters")}
          </button>
          <span className="text-sm text-muted-foreground">
            {t("candidateCount", { count: filtered.length })}
          </span>
        </div>
      </div>

      {/* Results */}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>{t("noCandidates")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              jobPostings={jobPostings}
              inviteStatus={inviteStatus[candidate.id]}
              onInvite={handleInvite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CandidateCardProps {
  candidate: CandidateSearchResult;
  jobPostings: EmployerJobPosting[];
  inviteStatus: string | undefined;
  onInvite: (candidateId: string, jobPostingId: string) => void;
}

function CandidateCard({
  candidate,
  jobPostings: employerPostings,
  inviteStatus,
  onInvite,
}: CandidateCardProps) {
  const t = useTranslations("candidateSearch");
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  const handleInviteClick = () => {
    if (selectedJobId) {
      onInvite(candidate.id, selectedJobId);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link
            href={`/portal/employer/candidates/${candidate.id}`}
            className="text-lg font-medium text-primary hover:underline"
          >
            {candidate.fullName ?? t("unnamed")}
          </Link>

          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {candidate.preferredJobLocation && (
              <span>📍 {candidate.preferredJobLocation}</span>
            )}
            {candidate.preferredJobType && (
              <span>💼 {candidate.preferredJobType.replace(/_/g, " ")}</span>
            )}
            {candidate.educationalQualification && (
              <span>
                🎓 {candidate.educationalQualification.replace(/_/g, " ")}
              </span>
            )}
          </div>

          {candidate.careerObjective && (
            <p className="mt-2 text-sm text-muted-foreground italic">
              &ldquo;{candidate.careerObjective}&rdquo;
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {candidate.languagesKnown.slice(0, 4).map((lang) => (
              <span
                key={lang}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm text-primary"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        <Link
          href={`/portal/employer/candidates/${candidate.id}`}
          className="ml-4 shrink-0 rounded-md bg-muted px-3 py-1.5 text-sm text-foreground hover:bg-muted"
        >
          {t("viewProfile")}
        </Link>
      </div>

      {/* Invite to Apply */}
      {employerPostings.length > 0 && (
        <div className="mt-4 flex items-center gap-3 border-t pt-3">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="max-w-xs rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="">{t("selectJobPosting")}</option>
            {employerPostings.map((jp) => (
              <option key={jp.id} value={jp.id}>
                {jp.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleInviteClick}
            disabled={!selectedJobId || inviteStatus === "sending..."}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {inviteStatus === "sending..." ? t("sending") : t("inviteToApply")}
          </button>

          {inviteStatus && inviteStatus !== "sending..." && (
            <span
              className={`text-sm ${
                inviteStatus === "sent" ? "text-primary" : "text-destructive"
              }`}
            >
              {inviteStatus === "sent"
                ? t("invitationSent")
                : inviteStatus}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Applies all active filters in-memory over the candidate list.
 */
function applyFilters(
  candidates: CandidateSearchResult[],
  filters: CandidateSearchFilters,
): CandidateSearchResult[] {
  let results = candidates;

  if (filters.preferredJobLocation) {
    const loc = filters.preferredJobLocation.toLowerCase();
    results = results.filter(
      (c) => c.preferredJobLocation?.toLowerCase().includes(loc),
    );
  }

  if (filters.preferredJobType) {
    results = results.filter(
      (c) => c.preferredJobType === filters.preferredJobType,
    );
  }

  if (filters.educationalQualification) {
    results = results.filter(
      (c) => c.educationalQualification === filters.educationalQualification,
    );
  }

  if (filters.languagesKnown && filters.languagesKnown.length > 0) {
    results = results.filter((c) =>
      filters.languagesKnown!.some((lang) =>
        c.languagesKnown.some(
          (cl) => cl.toLowerCase() === lang.toLowerCase(),
        ),
      ),
    );
  }

  return results;
}
