import { describe, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import { BiodataForm } from "@/components/shared/BiodataForm";
import type { PublicCourse } from "@/lib/courses";
import type { SkillDto } from "@/lib/skills";
import type { CandidateProfileWithCompletion } from "@/lib/biodata";
import axe from "axe-core";

const mockCourses: PublicCourse[] = [
  {
    id: "c1",
    slug: "python-fullstack",
    titleEn: "Python Full Stack Development",
    titleMl: null,
    descriptionEn: null,
    descriptionMl: null,
    durationText: "6 months",
    certifications: [],
    careerOutcomesEn: null,
    careerOutcomesMl: null,
    coverImageUrl: null,
    featured: false,
    category: null,
    contentBlocks: null,
  },
];

const mockSkills: SkillDto[] = [
  { id: "s1", label: "JavaScript", status: "APPROVED", createdAt: new Date() },
  { id: "s2", label: "Python", status: "APPROVED", createdAt: new Date() },
];

function emptyProfile(
  isVerifiedStudent: boolean,
): CandidateProfileWithCompletion {
  return {
    id: "",
    fullName: null,
    dateOfBirth: null,
    phone: null,
    email: null,
    courseCompletedIds: [],
    certificationIds: [],
    educationalQualification: null,
    yearOfPassing: null,
    address: null,
    languagesKnown: [],
    skillIds: [],
    preferredJobLocation: null,
    preferredJobType: null,
    careerObjective: null,
    photoUrl: null,
    profileVisible: true,
    isVerifiedStudent,
    studentRecordId: null,
  };
}

describe("BiodataForm accessibility", () => {
  test("2. BiodataForm page renders with zero critical or serious axe-core violations", async () => {
    const { container } = render(
      <BiodataForm
        profile={emptyProfile(false)}
        isVerifiedStudent={false}
        courses={mockCourses}
        skills={mockSkills}
        onAddNewSkill={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const results = await axe.run(container);
    const criticalSerious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(criticalSerious).toEqual([]);
  });
});
