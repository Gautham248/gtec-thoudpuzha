import { describe, expect, test } from "vitest";
import { renderToString } from "react-dom/server";
import {
  CourseFilterSystem,
  getCourseDepartment,
  getCourseLevel,
  extractDurationInMonths,
  matchesDuration,
} from "./CourseFilterSystem";
import type { PublicCourse } from "@/lib/courses";

describe("CourseFilterSystem helpers", () => {
  const mockCourse1: PublicCourse = {
    id: "c-1",
    slug: "full-stack-web-development",
    titleEn: "Full Stack Web Development",
    titleMl: null,
    descriptionEn: "Master React, Node.js and modern web apps.",
    descriptionMl: null,
    durationText: "6 Months",
    certifications: ["G-TEC", "Full Stack"],
    careerOutcomesEn: "Full Stack Developer, Frontend Developer",
    careerOutcomesMl: null,
    coverImageUrl: null,
    featured: true,
    category: { id: "cat-1", nameEn: "IT & Software", nameMl: "ഐടി", sortOrder: 0 },
    contentBlocks: null,
  };

  const mockCourse2: PublicCourse = {
    id: "c-2",
    slug: "diploma-in-computer-application",
    titleEn: "Diploma in Computer Application (DCA)",
    titleMl: null,
    descriptionEn: "Basic computer fundamentals and MS Office.",
    descriptionMl: null,
    durationText: "6 Months",
    certifications: ["G-TEC", "DCA"],
    careerOutcomesEn: "Office Assistant, Computer Operator",
    careerOutcomesMl: null,
    coverImageUrl: null,
    featured: true,
    category: { id: "cat-1", nameEn: "IT & Software", nameMl: "ഐടി", sortOrder: 0 },
    contentBlocks: null,
  };

  const mockCourse3: PublicCourse = {
    id: "c-3",
    slug: "tallyprime-with-gst",
    titleEn: "TallyPrime with GST & E-Filing",
    titleMl: null,
    descriptionEn: "Accounting, inventory, and GST compliance.",
    descriptionMl: null,
    durationText: "3 Months",
    certifications: ["G-TEC", "Tally"],
    careerOutcomesEn: "Accountant, GST Practitioner",
    careerOutcomesMl: null,
    coverImageUrl: null,
    featured: false,
    category: { id: "cat-2", nameEn: "Accounting & Finance", nameMl: "അക്കൗണ്ടിംഗ്", sortOrder: 0 },
    contentBlocks: null,
  };

  const mockCourse4: PublicCourse = {
    id: "c-4",
    slug: "spoken-english-and-communication-skills",
    titleEn: "Spoken English & Communication Skills",
    titleMl: null,
    descriptionEn: "Practical English language training for fluency.",
    descriptionMl: null,
    durationText: "3 Months",
    certifications: ["G-TEC"],
    careerOutcomesEn: "Customer Service Executive, Front Office Executive",
    careerOutcomesMl: null,
    coverImageUrl: null,
    featured: false,
    category: {
      id: "cat-4",
      nameEn: "Language & Communications",
      nameMl: "ഭാഷ & കമ്മ്യൂണിക്കേഷൻ",
      sortOrder: 0,
    },
    contentBlocks: null,
  };

  const mockCourseADSE: PublicCourse = {
    id: "c-5",
    slug: "adse",
    titleEn: "Advanced Diploma in Software Engineering (ADSE)",
    titleMl: null,
    descriptionEn: "Intensive 12-month program in software engineering.",
    descriptionMl: null,
    durationText: "12 Months",
    certifications: ["G-TEC", "ADSE"],
    careerOutcomesEn: "Software Engineer",
    careerOutcomesMl: null,
    coverImageUrl: null,
    featured: true,
    category: { id: "cat-1", nameEn: "IT & Software", nameMl: "ഐടി", sortOrder: 0 },
    contentBlocks: null,
  };

  const mockCourseIELTS: PublicCourse = {
    id: "c-6",
    slug: "ielts-preparation",
    titleEn: "IELTS / TOEFL Preparation",
    titleMl: null,
    descriptionEn: "2-month English proficiency prep course.",
    descriptionMl: null,
    durationText: "2 Months",
    certifications: ["G-TEC"],
    careerOutcomesEn: "Study Abroad Candidate",
    careerOutcomesMl: null,
    coverImageUrl: null,
    featured: false,
    category: {
      id: "cat-4",
      nameEn: "Language & Communications",
      nameMl: "ഭാഷ & കമ്മ്യൂണിക്കേഷൻ",
      sortOrder: 0,
    },
    contentBlocks: null,
  };

  test("getCourseDepartment maps courses accurately", () => {
    expect(getCourseDepartment(mockCourse1)).toBe("Web Development");
    expect(getCourseDepartment(mockCourse2)).toBe("Office & Productivity");
    expect(getCourseDepartment(mockCourse3)).toBe("Accounting & Finance");
    // Regression: a Language course must not fall through to Programming.
    expect(getCourseDepartment(mockCourse4)).toBe("Language & Communications");
  });

  test("getCourseLevel maps basic vs advanced levels accurately", () => {
    expect(getCourseLevel(mockCourse1)).toBe("ADVANCED");
    expect(getCourseLevel(mockCourse2)).toBe("BASIC");
    expect(getCourseLevel(mockCourse3)).toBe("BASIC");
    expect(getCourseLevel(mockCourseADSE)).toBe("ADVANCED");
    expect(getCourseLevel(mockCourseIELTS)).toBe("BASIC");
  });

  describe("Duration normalization and exact matching (Regression Bug Fix)", () => {
    test("extractDurationInMonths accurately parses month and year formats", () => {
      expect(extractDurationInMonths("1 Month")).toBe(1);
      expect(extractDurationInMonths("2 Months")).toBe(2);
      expect(extractDurationInMonths("2 months")).toBe(2);
      expect(extractDurationInMonths("3 Months")).toBe(3);
      expect(extractDurationInMonths("4 Months")).toBe(4);
      expect(extractDurationInMonths("6 Months")).toBe(6);
      expect(extractDurationInMonths("12 Months")).toBe(12);
      expect(extractDurationInMonths("1 Year")).toBe(12);
      expect(extractDurationInMonths("1 yr")).toBe(12);
      expect(extractDurationInMonths("2 Years")).toBe(24);
      expect(extractDurationInMonths(null)).toBeNull();
      expect(extractDurationInMonths("")).toBeNull();
    });

    test("matchesDuration prevents '2 Months' filter from matching '12 Months' courses", () => {
      // The core bug report: selecting "2 Months" must NOT match "12 Months"
      expect(matchesDuration("12 Months", "2 Months")).toBe(false);
      expect(matchesDuration("12 months", "2 Months")).toBe(false);

      // Selecting "2 Months" matches 2-month courses
      expect(matchesDuration("2 Months", "2 Months")).toBe(true);
      expect(matchesDuration("2 months", "2 Months")).toBe(true);

      // Selecting "1 Month" must NOT match "12 Months"
      expect(matchesDuration("12 Months", "1 Month")).toBe(false);
      expect(matchesDuration("1 Month", "1 Month")).toBe(true);

      // Selecting "12 Months" matches 12-month and 1-year courses, but not 2-month
      expect(matchesDuration("12 Months", "12 Months")).toBe(true);
      expect(matchesDuration("1 Year", "12 Months")).toBe(true);
      expect(matchesDuration("2 Months", "12 Months")).toBe(false);

      // Selecting "ALL" matches any course
      expect(matchesDuration("2 Months", "ALL")).toBe(true);
      expect(matchesDuration("12 Months", "ALL")).toBe(true);
      expect(matchesDuration("6 Months", "ALL")).toBe(true);
      expect(matchesDuration(null, "ALL")).toBe(true);
    });

    test("matchesDuration returns false when course duration is null and filter is not ALL", () => {
      expect(matchesDuration(null, "2 Months")).toBe(false);
      expect(matchesDuration(undefined, "6 Months")).toBe(false);
    });
  });

  test("renders course cards, dropdown filters, and action buttons in SSR", () => {
    const html = renderToString(
      <CourseFilterSystem
        courses={[mockCourse1, mockCourse2, mockCourse3, mockCourseADSE, mockCourseIELTS]}
        locale="en"
      />
    );

    expect(html).toContain("Full Stack Web Development");
    expect(html).toContain("Diploma in Computer Application (DCA)");
    expect(html).toContain("TallyPrime with GST &amp; E-Filing");
    expect(html).toContain("Advanced Diploma in Software Engineering (ADSE)");
    expect(html).toContain("IELTS / TOEFL Preparation");
    expect(html).toContain("Web Development");
    expect(html).toContain("Accounting &amp; Finance");
    expect(html).toContain("Advanced");
    expect(html).toContain("Basic");
    expect(html).toContain("Enroll Now");
    expect(html).toContain("View Details");
    expect(html).toContain("Showing 5 of 5 courses");
  });
});
