// Row and enum types inferred from the Drizzle schema. Same names and shapes as
// the `@prisma/client` types they replace.
import type * as t from "./schema";

type EnumOf<E extends { enumValues: readonly string[] }> =
  E["enumValues"][number];

export type Course = typeof t.course.$inferSelect;
export type CourseCategory = typeof t.courseCategory.$inferSelect;
export type NewsEvent = typeof t.newsEvent.$inferSelect;
export type GalleryCategory = typeof t.galleryCategory.$inferSelect;
export type GalleryItem = typeof t.galleryItem.$inferSelect;
export type CertificationPartner = typeof t.certificationPartner.$inferSelect;
export type FlashNewsItem = typeof t.flashNewsItem.$inferSelect;
export type SiteSettings = typeof t.siteSettings.$inferSelect;
export type WhyChooseUsCard = typeof t.whyChooseUsCard.$inferSelect;
export type JobPosting = typeof t.jobPosting.$inferSelect;
export type EmployerProfile = typeof t.employerProfile.$inferSelect;
export type CandidateProfile = typeof t.candidateProfile.$inferSelect;

export type ApplicationStatus = EnumOf<typeof t.applicationStatus>;
export type CourseStatus = EnumOf<typeof t.courseStatus>;
export type EducationalQualification = EnumOf<
  typeof t.educationalQualification
>;
export type EmployeeCountRange = EnumOf<typeof t.employeeCountRange>;
export type EmployerProfileStatus = EnumOf<typeof t.employerProfileStatus>;
export type GalleryMediaType = EnumOf<typeof t.galleryMediaType>;
export type IndustrySector = EnumOf<typeof t.industrySector>;
export type JobPostingStatus = EnumOf<typeof t.jobPostingStatus>;
export type JobType = EnumOf<typeof t.jobType>;
export type NewsEventType = EnumOf<typeof t.newsEventType>;
export type PreferredJobType = EnumOf<typeof t.preferredJobType>;
export type ResourceType = EnumOf<typeof t.resourceType>;
export type Role = EnumOf<typeof t.role>;
export type SalaryVisibility = EnumOf<typeof t.salaryVisibility>;
export type SkillStatus = EnumOf<typeof t.skillStatus>;
export type WhyCardIcon = EnumOf<typeof t.whyCardIcon>;
