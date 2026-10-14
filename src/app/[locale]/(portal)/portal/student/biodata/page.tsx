import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import { BiodataForm } from "@/components/shared/BiodataForm";
import { getPublishedCourses } from "@/lib/courses";
import { getApprovedSkills, createPENDINGSkill } from "@/lib/skills";
import { submitBiodataForm } from "./actions";
import { withProfileLists } from "@/db/helpers";

export default async function BiodataPage() {
  const session = await auth();
  if (!session.userId) {
    return null;
  }

  const role = await getEffectiveRole(session);
  const _isStudent = role === Role.STUDENT;
  const isVerifiedStudent = role === Role.STUDENT;

  const [profile, courses, skills] = await Promise.all([
    db.query.candidateProfile
      .findFirst({ where: (p, { eq }) => eq(p.userId, session.userId!) })
      .then((p) => p ?? null),
    getPublishedCourses(),
    getApprovedSkills(),
  ]);

  const profileWithCompletion = profile
    ? {
        ...withProfileLists(profile),
        isVerifiedStudent,
        studentRecordId: profile.studentRecordId,
      }
    : null;

  return (
    <div className="min-h-screen p-6">
      <BiodataForm
        profile={profileWithCompletion}
        isVerifiedStudent={isVerifiedStudent}
        courses={courses}
        skills={skills}
        onAddNewSkill={createPENDINGSkill}
        onSubmit={submitBiodataForm}
      />
    </div>
  );
}
