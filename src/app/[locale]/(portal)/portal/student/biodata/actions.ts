"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { candidateProfile } from "@/db/schema";
import { Role, getEffectiveRole } from "@/lib/auth";
import type { EducationalQualification, PreferredJobType } from "@/db/types";
import type { CandidateProfileWithCompletion } from "@/lib/biodata";

export type BiodataFormData = {
  fullName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  courseCompletedIds: string[];
  certificationIds: string[];
  educationalQualification?: EducationalQualification;
  yearOfPassing?: number;
  address?: string;
  languagesKnown: string[];
  skillIds: string[];
  preferredJobLocation?: string;
  preferredJobType?: PreferredJobType;
  careerObjective?: string;
  photoUrl?: string;
  profileVisible?: boolean;
};

export async function saveBiodata(data: BiodataFormData) {
  const session = await auth();
  if (!session.userId) {
    throw new Error("Unauthenticated");
  }

  const role = await getEffectiveRole(session);

  if (!role || (role !== Role.STUDENT && role !== Role.JOB_SEEKER)) {
    throw new Error("Forbidden");
  }

  const fields = {
    fullName: data.fullName ?? null,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    courseCompletedIds: data.courseCompletedIds,
    certificationIds: data.certificationIds,
    educationalQualification: data.educationalQualification ?? null,
    yearOfPassing: data.yearOfPassing ?? null,
    address: data.address ?? null,
    languagesKnown: data.languagesKnown,
    skillIds: data.skillIds,
    preferredJobLocation: data.preferredJobLocation ?? null,
    preferredJobType: data.preferredJobType ?? null,
    careerObjective: data.careerObjective ?? null,
    photoUrl: data.photoUrl ?? null,
    profileVisible: data.profileVisible ?? true,
  };

  const [profile] = await db
    .insert(candidateProfile)
    .values({ userId: session.userId, ...fields })
    .onConflictDoUpdate({ target: candidateProfile.userId, set: fields })
    .returning();

  return profile;
}

/**
 * Thin void-returning wrapper around saveBiodata for use as a Client
 * Component's onSubmit prop. Server Components can't pass inline arrow
 * functions to Client Components (they aren't serializable — only real
 * Server Actions can cross that boundary), and BiodataForm's onSubmit
 * expects `Promise<void>` while saveBiodata returns profile data (see
 * AGENTS.md rule 15: form-action functions must return void|Promise<void>,
 * wrap data-returning functions rather than passing them directly).
 */
export async function submitBiodataForm(data: BiodataFormData): Promise<void> {
  await saveBiodata(data);

  const session = await auth();
  if (!session.userId) return;

  const role = await getEffectiveRole(session);
  revalidatePath("/portal/student/biodata");
  revalidatePath("/portal/job-seeker");

  if (role === Role.JOB_SEEKER) {
    redirect("/portal/job-seeker");
  }
  redirect("/portal/student");
}

export type BiodataActionResult = {
  success: boolean;
  isComplete: boolean;
};

export async function getCurrentProfile(): Promise<CandidateProfileWithCompletion | null> {
  const session = await auth();
  if (!session.userId) return null;

  const profile = await db.query.candidateProfile.findFirst({
    where: (p, { eq }) => eq(p.userId, session.userId!),
  });

  if (!profile) return null;

  return {
    ...profile,
    isVerifiedStudent: profile.isVerifiedStudent,
    studentRecordId: profile.studentRecordId,
  };
}
