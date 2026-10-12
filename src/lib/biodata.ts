import type { EducationalQualification, PreferredJobType } from "@/db/types";

export type CandidateProfileWithCompletion = {
  id: string;
  fullName: string | null;
  dateOfBirth: Date | null;
  phone: string | null;
  email: string | null;
  courseCompletedIds: string[];
  certificationIds: string[];
  educationalQualification: EducationalQualification | null;
  yearOfPassing: number | null;
  address: string | null;
  languagesKnown: string[];
  skillIds: string[];
  preferredJobLocation: string | null;
  preferredJobType: PreferredJobType | null;
  careerObjective: string | null;
  photoUrl: string | null;
  profileVisible: boolean;
  isVerifiedStudent: boolean;
  studentRecordId: string | null;
};

export function isProfileComplete(
  profile: CandidateProfileWithCompletion,
): boolean {
  const hasRequired = Boolean(
    profile.fullName &&
    profile.dateOfBirth &&
    profile.phone &&
    profile.email &&
    profile.educationalQualification &&
    profile.address &&
    profile.preferredJobType,
  );

  if (!hasRequired) return false;

  if (profile.isVerifiedStudent && profile.courseCompletedIds.length === 0) {
    return false;
  }

  return true;
}
