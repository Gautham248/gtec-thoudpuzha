"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getSearchableCandidates } from "@/lib/biodata-search";
import { isProfileComplete as _isProfileComplete } from "@/lib/biodata";
import { Role, getEffectiveRole } from "@/lib/auth";
import type { CandidateProfileWithCompletion } from "@/lib/biodata";

export interface CandidateSearchFilters {
  courseCompletedIds?: string[];
  certificationIds?: string[];
  skillIds?: string[];
  preferredJobLocation?: string;
  preferredJobType?: string;
  educationalQualification?: string;
  languagesKnown?: string[];
}

export interface CandidateSearchResult {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  preferredJobLocation: string | null;
  preferredJobType: string | null;
  educationalQualification: string | null;
  skillIds: string[];
  courseCompletedIds: string[];
  languagesKnown: string[];
  careerObjective: string | null;
  isVerifiedStudent: boolean;
}

/**
 * Searches searchable candidates with optional filters.
 * Only APPROVED employers can search.
 */
export async function searchCandidates(
  filters: CandidateSearchFilters,
): Promise<CandidateSearchResult[]> {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) {
    redirect("/forbidden");
  }

  const profile = await db.query.employerProfile.findFirst({
    where: (e, { eq }) => eq(e.userId, session.userId!),
  });

  if (!profile || profile.status !== "APPROVED") {
    redirect("/portal/employer/register/status");
  }

  const all = await getSearchableCandidates();

  let results = all;

  if (filters.courseCompletedIds && filters.courseCompletedIds.length > 0) {
    results = results.filter((c) =>
      filters.courseCompletedIds!.some((id) =>
        c.courseCompletedIds.includes(id),
      ),
    );
  }

  if (filters.certificationIds && filters.certificationIds.length > 0) {
    results = results.filter((c) =>
      filters.certificationIds!.some((id) => c.certificationIds.includes(id)),
    );
  }

  if (filters.skillIds && filters.skillIds.length > 0) {
    results = results.filter((c) =>
      filters.skillIds!.some((id) => c.skillIds.includes(id)),
    );
  }

  if (filters.preferredJobLocation) {
    const loc = filters.preferredJobLocation.toLowerCase();
    results = results.filter((c) =>
      c.preferredJobLocation?.toLowerCase().includes(loc),
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
        c.languagesKnown.some((cl) => cl.toLowerCase() === lang.toLowerCase()),
      ),
    );
  }

  return results.map(mapResult);
}

function mapResult(
  profile: CandidateProfileWithCompletion,
): CandidateSearchResult {
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    preferredJobLocation: profile.preferredJobLocation,
    preferredJobType: profile.preferredJobType ?? null,
    educationalQualification: profile.educationalQualification ?? null,
    skillIds: profile.skillIds,
    courseCompletedIds: profile.courseCompletedIds,
    languagesKnown: profile.languagesKnown,
    careerObjective: profile.careerObjective,
    isVerifiedStudent: profile.isVerifiedStudent,
  };
}

export interface EmployerJobPosting {
  id: string;
  title: string;
  status: string;
}

export interface InviteToApplyResult {
  success: boolean;
  error?: string;
}

/**
 * Sends an "Invite to Apply" email to a candidate for a specific job posting.
 * Does NOT create an Application record. Only allows the employer to select
 * from their own APPROVED postings.
 */
export async function inviteToApply(
  candidateProfileId: string,
  jobPostingId: string,
): Promise<InviteToApplyResult> {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) {
    redirect("/forbidden");
  }

  const profile = await db.query.employerProfile.findFirst({
    where: (e, { eq }) => eq(e.userId, session.userId!),
  });

  if (!profile || profile.status !== "APPROVED") {
    return { success: false, error: "Employer not approved." };
  }

  // Verify the job posting belongs to this employer and is APPROVED
  const posting = await db.query.jobPosting.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(
        eq(p.id, jobPostingId),
        eq(p.employerId, profile.id),
        eq(p.status, "APPROVED"),
        isNull(p.deletedAt),
      ),
  });

  if (!posting) {
    return {
      success: false,
      error: "Job posting not found or not available for invites.",
    };
  }

  // Verify candidate exists and is searchable
  const candidate = await db.query.candidateProfile.findFirst({
    where: (c, { eq }) => eq(c.id, candidateProfileId),
  });

  if (!candidate || !candidate.profileVisible) {
    return { success: false, error: "Candidate not found or not searchable." };
  }

  const { isProfileComplete } = await import("@/lib/biodata");
  const wrapped: CandidateProfileWithCompletion = {
    ...candidate,
    isVerifiedStudent: candidate.isVerifiedStudent,
    studentRecordId: candidate.studentRecordId,
  };
  if (!isProfileComplete(wrapped)) {
    return { success: false, error: "Candidate profile is incomplete." };
  }

  // Send notification email (lazy import to avoid module-scope side effects)
  const { InviteToApplyEmail } = await import("@/emails/InviteToApplyEmail");
  const { resend, getFromEmail } = await import("@/lib/email");

  const candidateEmail = candidate.email;
  if (!candidateEmail) {
    return { success: false, error: "Candidate has no email address." };
  }

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: candidateEmail,
      subject: `You've been invited to apply for ${posting.title} at ${profile.companyName}`,
      react: InviteToApplyEmail({
        candidateName: candidate.fullName,
        jobTitle: posting.title,
        companyName: profile.companyName,
        jobUrl: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/portal/jobs/${posting.id}`,
        employerName: profile.contactPersonName,
      }),
    });
  } catch (error) {
    console.error("[inviteToApply] failed to send email:", error);
    return { success: false, error: "Failed to send invitation email." };
  }

  return { success: true };
}
