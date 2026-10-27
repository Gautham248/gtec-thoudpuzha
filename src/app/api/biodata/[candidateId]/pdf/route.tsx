import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { BiodataPdfDocument } from "@/components/shared/BiodataPdfDocument";
import type { BiodataPdfData } from "@/components/shared/BiodataPdfDocument";
import { withProfileLists } from "@/db/helpers";
import type { CandidateProfile } from "@/db/types";
import { isProfileComplete } from "@/lib/biodata";

const QUALIFICATION_LABELS: Record<string, string> = {
  SSLC: "SSLC",
  PLUS_TWO: "Plus Two",
  DIPLOMA: "Diploma",
  GRADUATE: "Graduate",
  POST_GRADUATE: "Post Graduate",
  OTHER: "Other",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  INTERNSHIP: "Internship",
  WORK_FROM_HOME: "Work from Home",
};

async function isApprovedEmployer(userId: string) {
  const employer = await db.query.employerProfile.findFirst({
    where: (e, { eq }) => eq(e.userId, userId),
    columns: { status: true },
  });
  return employer?.status === "APPROVED";
}

/** Mirrors getSearchableCandidates: visible and complete. */
function isSearchable(
  profile: ReturnType<typeof withProfileLists<CandidateProfile>>,
) {
  return (
    profile.profileVisible &&
    isProfileComplete({
      ...profile,
      isVerifiedStudent: profile.isVerifiedStudent,
      studentRecordId: profile.studentRecordId,
    })
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  const { candidateId } = await params;
  const session = await auth();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const role = await getEffectiveRole(session);
  if (!role) {
    return NextResponse.json({ error: "No role assigned" }, { status: 403 });
  }

  // Fetch the candidate profile by its id (candidateId is the profile id)
  const found = await db.query.candidateProfile.findFirst({
    where: (p, { eq }) => eq(p.id, candidateId),
  });
  const profile = found ? withProfileLists(found) : undefined;

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Access control: the candidate themselves, or an APPROVED employer for a
  // candidate they could find in search (visible and complete) — the same
  // rule as the employer candidate page that links here. A Clerk role of
  // EMPLOYER alone is not enough: anyone can give themselves that role.
  const isSelf = profile.userId === session.userId;
  const canEmployerView =
    !isSelf &&
    role === Role.EMPLOYER &&
    (await isApprovedEmployer(session.userId)) &&
    isSearchable(profile);

  if (!isSelf && !canEmployerView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve course names for completed courses, in the profile's order.
  // Ids whose course no longer exists are left out.
  let courseCompletedNames: string[] = [];
  if (profile.courseCompletedIds.length > 0) {
    const courses = await db.query.course.findMany({
      where: (c, { inArray }) => inArray(c.id, profile.courseCompletedIds),
      columns: { id: true, titleEn: true },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c.titleEn]));
    courseCompletedNames = profile.courseCompletedIds.flatMap((id) => {
      const name = courseMap.get(id);
      return name ? [name] : [];
    });
  }

  // Resolve skill labels, in the profile's order; unknown ids are left out.
  let skillLabels: string[] = [];
  if (profile.skillIds.length > 0) {
    const skills = await db.query.skill.findMany({
      where: (s, { inArray }) => inArray(s.id, profile.skillIds),
      columns: { id: true, label: true },
    });
    const skillMap = new Map(skills.map((s) => [s.id, s.label]));
    skillLabels = profile.skillIds.flatMap((id) => {
      const label = skillMap.get(id);
      return label ? [label] : [];
    });
  }

  const pdfData: BiodataPdfData = {
    fullName: profile.fullName,
    dateOfBirth: profile.dateOfBirth
      ? profile.dateOfBirth.toISOString().split("T")[0]
      : null,
    phone: profile.phone,
    email: profile.email,
    courseCompletedNames,
    certificationCodes: profile.certificationIds,
    educationalQualification: profile.educationalQualification
      ? (QUALIFICATION_LABELS[profile.educationalQualification] ??
        profile.educationalQualification)
      : null,
    yearOfPassing: profile.yearOfPassing,
    address: profile.address,
    languagesKnown: profile.languagesKnown ?? [],
    skillLabels,
    preferredJobLocation: profile.preferredJobLocation,
    preferredJobType: profile.preferredJobType
      ? (JOB_TYPE_LABELS[profile.preferredJobType] ?? profile.preferredJobType)
      : null,
    careerObjective: profile.careerObjective,
  };

  const pdfBuffer = await renderToBuffer(<BiodataPdfDocument data={pdfData} />);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="biodata-${candidateId}.pdf"`,
    },
  });
}
