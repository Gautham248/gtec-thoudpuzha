import type { ApplicationStatus } from "@/db/types";

/**
 * Statuses an employer may move an application to from each status.
 * VIEWED is never a target here: it is set only by `markViewed`, when the
 * employer opens the applicant's profile. REJECTED and HIRED are final.
 */
export const APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  APPLIED: ["SHORTLISTED", "REJECTED"],
  VIEWED: ["SHORTLISTED", "REJECTED", "HIRED"],
  SHORTLISTED: ["REJECTED", "HIRED"],
  REJECTED: [],
  HIRED: [],
};

export const canTransition = (from: ApplicationStatus, to: ApplicationStatus) =>
  APPLICATION_TRANSITIONS[from].includes(to);

export const APPLICATION_STATUS_STYLES: Record<ApplicationStatus, string> = {
  APPLIED: "bg-primary/10 text-primary",
  VIEWED: "bg-purple-100 text-purple-800",
  SHORTLISTED: "bg-accent/10 text-accent",
  REJECTED: "bg-destructive/10 text-destructive",
  HIRED: "bg-primary/10 text-primary",
};

/**
 * Error codes the apply and applicant-status procedures return. The UI
 * translates them through the `applicationErrors` namespace.
 */
export type ApplicationErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "PROFILE_INCOMPLETE"
  | "JOB_CLOSED"
  | "ALREADY_APPLIED"
  | "INVALID_TRANSITION";
