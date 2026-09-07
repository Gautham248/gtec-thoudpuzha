import { describe, expect, test } from "vitest";
import { renderToString } from "react-dom/server";
import { FeaturedCoursesSection } from "./FeaturedCoursesSection";
import type { PublicCourse } from "@/lib/courses";

describe("FeaturedCoursesSection", () => {
  const mockCourses: PublicCourse[] = [
    {
      id: "course-1",
      slug: "full-stack-web-development",
      titleEn: "Full Stack Web Development",
      titleMl: null,
      descriptionEn: "Comprehensive React and Node.js program.",
      descriptionMl: null,
      durationText: "6 Months",
      certifications: ["G-TEC", "Full Stack"],
      careerOutcomesEn: "Full Stack Developer",
      careerOutcomesMl: null,
      coverImageUrl: null,
      featured: true,
      category: { id: "cat-1", nameEn: "IT & Software", nameMl: "ഐടി" },
      contentBlocks: null,
    },
    {
      id: "course-2",
      slug: "python-programming",
      titleEn: "Python Programming",
      titleMl: null,
      descriptionEn: "Python and Data Science basics.",
      descriptionMl: null,
      durationText: "3 Months",
      certifications: ["G-TEC"],
      careerOutcomesEn: "Python Developer",
      careerOutcomesMl: null,
      coverImageUrl: null,
      featured: true,
      category: { id: "cat-1", nameEn: "IT & Software", nameMl: "ഐടി" },
      contentBlocks: null,
    },
  ];

  test("renders featured course titles, duration, and CTA buttons", () => {
    const html = renderToString(
      <FeaturedCoursesSection courses={mockCourses} locale="en" />
    );

    expect(html).toContain("Featured Courses &amp; Certifications");
    expect(html).toContain("Full Stack Web Development");
    expect(html).toContain("Python Programming");
    expect(html).toContain("6 Months");
    expect(html).toContain("Enroll Now");
    expect(html).toContain("View All Courses");
    expect(html).toContain("href=\"/courses/full-stack-web-development#enquiry\"");
  });

  test("renders nothing when courses array is empty", () => {
    const html = renderToString(
      <FeaturedCoursesSection courses={[]} locale="en" />
    );
    expect(html).toBe("");
  });
});
