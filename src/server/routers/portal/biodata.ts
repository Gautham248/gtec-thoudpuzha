import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  candidateProfile,
  educationalQualification,
  preferredJobType,
} from "@/db/schema";
import { withProfileLists } from "@/db/helpers";
import { Role, getEffectiveRole } from "@/lib/auth";
import type { CandidateProfileWithCompletion } from "@/lib/biodata";
import { publicProcedure, router } from "@/server/trpc";

const optional = z.string().optional();

export const biodataInput = z.object({
  fullName: optional,
  dateOfBirth: optional,
  phone: optional,
  email: optional,
  courseCompletedIds: z.array(z.string()),
  certificationIds: z.array(z.string()),
  educationalQualification: z
    .enum(educationalQualification.enumValues)
    .optional(),
  yearOfPassing: z.number().optional(),
  address: optional,
  languagesKnown: z.array(z.string()),
  skillIds: z.array(z.string()),
  preferredJobLocation: optional,
  preferredJobType: z.enum(preferredJobType.enumValues).optional(),
  careerObjective: optional,
  photoUrl: optional,
  profileVisible: z.boolean().optional(),
});

export type BiodataFormData = z.input<typeof biodataInput>;

/** The signed-in student or job seeker; anyone else is rejected. */
async function requireCandidate() {
  const session = await auth();
  if (!session.userId) {
    throw new Error("Unauthenticated");
  }

  const role = await getEffectiveRole(session);
  if (!role || (role !== Role.STUDENT && role !== Role.JOB_SEEKER)) {
    throw new Error("Forbidden");
  }
  return { userId: session.userId, role };
}

async function saveProfile(
  userId: string,
  data: z.output<typeof biodataInput>,
) {
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
    .values({ userId, ...fields })
    .onConflictDoUpdate({ target: candidateProfile.userId, set: fields })
    .returning();

  return profile;
}

export const biodataRouter = router({
  /** Creates or replaces the signed-in candidate's profile. */
  save: publicProcedure.input(biodataInput).mutation(async ({ input }) => {
    const { userId } = await requireCandidate();
    return saveProfile(userId, input);
  }),

  /** Saves, then sends the candidate to their dashboard. */
  submit: publicProcedure
    .input(biodataInput)
    .mutation(async ({ input }): Promise<void> => {
      const { userId, role } = await requireCandidate();
      await saveProfile(userId, input);

      revalidatePath("/portal/student/biodata");
      revalidatePath("/portal/job-seeker");

      if (role === Role.JOB_SEEKER) {
        redirect("/portal/job-seeker");
      }
      redirect("/portal/student");
    }),

  current: publicProcedure.query(
    async (): Promise<CandidateProfileWithCompletion | null> => {
      const session = await auth();
      if (!session.userId) return null;

      const profile = await db.query.candidateProfile.findFirst({
        where: (p, { eq }) => eq(p.userId, session.userId!),
      });

      if (!profile) return null;

      return {
        ...withProfileLists(profile),
        isVerifiedStudent: profile.isVerifiedStudent,
        studentRecordId: profile.studentRecordId,
      };
    },
  ),
});
