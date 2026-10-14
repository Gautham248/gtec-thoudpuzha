"use server";

import { api, run } from "@/server/action";
import type * as candidates from "@/server/routers/portal/candidates";

export type CandidateSearchFilters = candidates.CandidateSearchFilters;
export type CandidateSearchResult = candidates.CandidateSearchResult;
export type InviteToApplyResult = candidates.InviteToApplyResult;

export interface EmployerJobPosting {
  id: string;
  title: string;
  status: string;
}

/**
 * Searches searchable candidates with optional filters.
 * Only APPROVED employers can search.
 */
export async function searchCandidates(
  filters: CandidateSearchFilters,
): Promise<CandidateSearchResult[]> {
  return run(() => api().portal.candidates.search(filters));
}

/**
 * Sends an "Invite to Apply" email to a candidate for a specific job posting.
 * Does NOT create an Application record.
 */
export async function inviteToApply(
  candidateProfileId: string,
  jobPostingId: string,
): Promise<InviteToApplyResult> {
  return run(() =>
    api().portal.candidates.inviteToApply({ candidateProfileId, jobPostingId }),
  );
}
