import { describe, test, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import type { CourseWithCategory, RelatedCourse, PublicCourse } from "@/lib/courses";
import type { CourseContent } from "@/lib/course-content.types";
import {
  deriveCourseLevel,
  getCourseHighlights,
  getWhatYoullLearn,
  getCurriculumModules,
  getSkillsGained,
  getCareerOpportunities,
  getWhoCanJoin,
  getWhyChooseGtecFeatures,
} from "@/lib/course-detail-helpers";

import { CourseBreadcrumb } from "@/components/courses/CourseBreadcrumb";
import { CourseHighlights } from "@/components/courses/CourseHighlights";
import { CourseOverview } from "@/components/courses/CourseOverview";
import { WhatYoullLearn } from "@/components/courses/WhatYoullLearn";
import { CourseCurriculum } from "@/components/courses/CourseCurriculum";
import { SkillsGained } from "@/components/courses/SkillsGained";
import { CareerOpportunities } from "@/components/courses/CareerOpportunities";
import { WhoCanJoin } from "@/components/courses/WhoCanJoin";
import { WhyChooseGtec } from "@/components/courses/WhyChooseGtec";
import { RelatedCoursesSection } from "@/components/courses/RelatedCoursesSection";
import { CourseCTA } from "@/components/courses/CourseCTA";

// Mock next-intl & navigation
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/courses/tally-prime-gst",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      heading: "Apply Now",
      description: "Fill in your details",
      fullName: "Full Name",
      phoneNumber: "Phone Number",
      courseInterested: "Course interested in",
      messageQuery: "Message / Query",
      submit: "Submit Enquiry",
      submitting: "Submitting...",
      success: "Thank you! Your enquiry has been received.",
      error: "Failed to submit enquiry.",
      fullNamePlaceholder: "Enter your full name",
      phonePlaceholder: "10-digit mobile number",
      messagePlaceholder: "Ask about course details, fee structure, batch timings...",
    };
    return map[key] || key;
  },
}));

const mockCourse: CourseWithCategory = {
  id: "course_1",
  slug: "tally-prime-gst",
  titleEn: "Tally ERP 9 / Prime with GST",
  titleMl: "ടാലി പ്രൈം ജിഎസ്ടി",
  categoryId: "cat_acc",
  descriptionEn: "Master professional accounting, GST compliance and payroll.",
  descriptionMl: "അക്കൗണ്ടിംഗ്, ജിഎസ്ടി കംപ്ലയൻസ് എന്നിവ പഠിക്കൂ.",
  durationText: "3 Months",
  syllabus: null,
  certifications: ["G-TEC Certified", "Tally Authorised"],
  careerOutcomesEn: "Accounts Executive, Junior Accountant, GST Practitioner",
  careerOutcomesMl: "അക്കൗണ്ട്സ് എക്സിക്യൂട്ടീവ്, ജൂനിയർ അക്കൗണ്ടന്റ്",
  coverImageUrl: null,
  contentBlocks: null,
  featured: true,
  status: "PUBLISHED",
  createdAt: new Date(),
  updatedAt: new Date(),
  category: {
    id: "cat_acc",
    nameEn: "Accounting & Finance",
    nameMl: "അക്കൗണ്ടിംഗ് & ഫിനാൻസ്",
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe("Course Detail Redesign Helpers", () => {
  test("deriveCourseLevel returns correct level based on duration and title", () => {
    const level = deriveCourseLevel(mockCourse);
    expect(level).toBe("All Levels (Beginner Friendly)");

    const advancedCourse = {
      ...mockCourse,
      titleEn: "Advanced Diploma in Software Engineering",
      durationText: "12 Months",
    };
    expect(deriveCourseLevel(advancedCourse)).toBe("Intermediate to Advanced");
  });

  test("getCourseHighlights returns 4 distinct highlight items", () => {
    const highlights = getCourseHighlights(mockCourse, "en");
    expect(highlights).toHaveLength(4);
    expect(highlights.map((h) => h.id)).toEqual([
      "duration",
      "level",
      "mode",
      "certificate",
    ]);
    expect(highlights[0].value).toBe("3 Months");
  });

  test("getWhatYoullLearn extracts domain-relevant outcomes for accounting", () => {
    const outcomes = getWhatYoullLearn(mockCourse, null, "en");
    expect(outcomes.length).toBeGreaterThan(0);
    expect(outcomes.some((o) => o.toLowerCase().includes("accounting") || o.toLowerCase().includes("tally"))).toBe(true);
  });

  test("getCurriculumModules returns structured modules (01, 02, etc.)", () => {
    const modules = getCurriculumModules(mockCourse, null, "en");
    expect(modules.length).toBeGreaterThan(0);
    expect(modules[0].index).toBe("01");
    expect(modules[0].title).toBeDefined();
  });

  test("getSkillsGained extracts relevant practical skill chips", () => {
    const skills = getSkillsGained(mockCourse);
    expect(skills).toContain("Financial Accounting");
    expect(skills).toContain("Tally Prime");
    expect(skills).toContain("GST & Taxation");
  });

  test("getCareerOpportunities splits outcomes text correctly", () => {
    const roles = getCareerOpportunities(mockCourse, "en");
    expect(roles.length).toBe(3);
    expect(roles[0].title).toBe("Accounts Executive");
  });

  test("getWhoCanJoin returns structured audience items", () => {
    const audience = getWhoCanJoin("en");
    expect(audience.length).toBe(4);
    expect(audience[0].title).toContain("Students");
  });

  test("getWhyChooseGtecFeatures returns 6 feature cards", () => {
    const features = getWhyChooseGtecFeatures("en");
    expect(features).toHaveLength(6);
    expect(features[0].title).toBe("Industry-Aligned Curriculum");
  });
});

describe("Course Detail UI Components", () => {
  test("CourseBreadcrumb renders breadcrumb links and active title", () => {
    render(<CourseBreadcrumb courseTitle="Tally Prime with GST" locale="en" />);
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Courses")).toBeDefined();
    expect(screen.getByText("Tally Prime with GST")).toBeDefined();
  });

  test("CourseHighlights renders all 4 highlight values", () => {
    const highlights = getCourseHighlights(mockCourse, "en");
    render(<CourseHighlights highlights={highlights} />);
    expect(screen.getByText("Course Duration")).toBeDefined();
    expect(screen.getByText("3 Months")).toBeDefined();
    expect(screen.getByText("Training Mode")).toBeDefined();
  });

  test("CourseOverview renders about heading and description", () => {
    render(
      <CourseOverview
        overview="Comprehensive professional accounting program."
        locale="en"
      />
    );
    expect(screen.getByText("About This Course")).toBeDefined();
    expect(screen.getByText("Comprehensive professional accounting program.")).toBeDefined();
  });

  test("WhatYoullLearn renders key outcomes", () => {
    const outcomes = ["Double-entry bookkeeping", "Tally Prime company setup", "GST filing"];
    render(<WhatYoullLearn outcomes={outcomes} locale="en" />);
    expect(screen.getByText("What You'll Learn")).toBeDefined();
    expect(screen.getByText("Double-entry bookkeeping")).toBeDefined();
  });

  test("CourseCurriculum renders modules and topics", () => {
    const modules = getCurriculumModules(mockCourse, null, "en");
    render(<CourseCurriculum modules={modules} locale="en" />);
    expect(screen.getByText("Course Curriculum & Syllabus")).toBeDefined();
    expect(screen.getByText("01")).toBeDefined();
  });

  test("SkillsGained renders skill badges", () => {
    const skills = ["Tally Prime", "GST", "Payroll"];
    render(<SkillsGained skills={skills} locale="en" />);
    expect(screen.getByText("Skills You'll Gain")).toBeDefined();
    expect(screen.getByText("Tally Prime")).toBeDefined();
  });

  test("CareerOpportunities renders career roles", () => {
    const roles = [{ title: "Accounts Executive", description: "Manage company ledgers." }];
    render(<CareerOpportunities roles={roles} locale="en" />);
    expect(screen.getByText("Career Opportunities")).toBeDefined();
    expect(screen.getByText("Accounts Executive")).toBeDefined();
  });

  test("WhoCanJoin renders target audience", () => {
    const audience = getWhoCanJoin("en");
    render(<WhoCanJoin audience={audience} locale="en" />);
    expect(screen.getByText("Who Can Join This Course?")).toBeDefined();
  });

  test("WhyChooseGtec renders 6 value cards", () => {
    const features = getWhyChooseGtecFeatures("en");
    render(<WhyChooseGtec features={features} locale="en" />);
    expect(screen.getByText("Why Choose G-TEC EDUCATION?")).toBeDefined();
    expect(screen.getByText("Industry-Aligned Curriculum")).toBeDefined();
  });

  test("RelatedCoursesSection renders related courses with View Course link", () => {
    const related: RelatedCourse[] = [
      {
        slug: "python-programming",
        titleEn: "Python Programming",
        titleMl: null,
        coverImageUrl: null,
        durationText: "3 Months",
        descriptionEn: "Learn Python from basics to advanced.",
        descriptionMl: null,
        category: { id: "cat_it", nameEn: "IT & Software", nameMl: null },
      },
    ];
    render(<RelatedCoursesSection courses={related} locale="en" />);
    expect(screen.getByText("Explore Related Courses")).toBeDefined();
    expect(screen.getByText("Python Programming")).toBeDefined();
    expect(screen.getByText("View Course")).toBeDefined();
  });

  test("CourseCTA renders conversion banner with Apply button and WhatsApp link", () => {
    render(<CourseCTA courseTitle="Tally Prime with GST" locale="en" whatsappNumber="919744221113" />);
    expect(screen.getByText("Ready to Transform Your Career with G-TEC?")).toBeDefined();
    expect(screen.getByText("Apply For Admission")).toBeDefined();
    expect(screen.getByText("WhatsApp Enquiry")).toBeDefined();
  });
});
