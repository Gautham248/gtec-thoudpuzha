// Relation names mirror the Prisma schema's relation fields one-to-one, so
// `include: { category: true }` becomes `with: { category: true }`.
import { relations } from "drizzle-orm/relations";
import {
  user,
  employerProfile,
  candidateProfile,
  jobPosting,
  application,
  course,
  courseCategory,
  enquiry,
  studentCourseEnrollment,
  academicResource,
  studentProgressEntry,
  timetableEntry,
  staffPermission,
  auditLogEntry,
  galleryCategory,
  galleryItem,
  siteSettings,
  whyChooseUsCard,
} from "./schema";

export const userRelations = relations(user, ({ one, many }) => ({
  candidateProfile: one(candidateProfile),
  employerProfile: one(employerProfile),
  staffPermission: one(staffPermission),
  auditLogEntries: many(auditLogEntry),
}));

export const courseCategoryRelations = relations(courseCategory, ({ many }) => ({
  courses: many(course),
}));

export const courseRelations = relations(course, ({ one, many }) => ({
  category: one(courseCategory, {
    fields: [course.categoryId],
    references: [courseCategory.id],
  }),
  enquiries: many(enquiry),
  enrollments: many(studentCourseEnrollment),
  academicResources: many(academicResource),
  progressEntries: many(studentProgressEntry),
  timetableEntries: many(timetableEntry),
}));

export const candidateProfileRelations = relations(
  candidateProfile,
  ({ one, many }) => ({
    user: one(user, {
      fields: [candidateProfile.userId],
      references: [user.id],
    }),
    enrollments: many(studentCourseEnrollment),
    progressEntries: many(studentProgressEntry),
    applications: many(application),
  }),
);

export const employerProfileRelations = relations(
  employerProfile,
  ({ one, many }) => ({
    user: one(user, {
      fields: [employerProfile.userId],
      references: [user.id],
    }),
    jobPostings: many(jobPosting),
  }),
);

export const applicationRelations = relations(application, ({ one }) => ({
  jobPosting: one(jobPosting, {
    fields: [application.jobPostingId],
    references: [jobPosting.id],
  }),
  candidateProfile: one(candidateProfile, {
    fields: [application.candidateProfileId],
    references: [candidateProfile.id],
  }),
}));

export const jobPostingRelations = relations(jobPosting, ({ one, many }) => ({
  employer: one(employerProfile, {
    fields: [jobPosting.employerId],
    references: [employerProfile.id],
  }),
  applications: many(application),
}));

export const enquiryRelations = relations(enquiry, ({ one }) => ({
  course: one(course, {
    fields: [enquiry.courseId],
    references: [course.id],
  }),
}));

export const siteSettingsRelations = relations(siteSettings, ({ many }) => ({
  whyChooseUsCards: many(whyChooseUsCard),
}));

export const galleryCategoryRelations = relations(
  galleryCategory,
  ({ many }) => ({
    items: many(galleryItem),
  }),
);

export const galleryItemRelations = relations(galleryItem, ({ one }) => ({
  category: one(galleryCategory, {
    fields: [galleryItem.categoryId],
    references: [galleryCategory.id],
  }),
}));

export const whyChooseUsCardRelations = relations(
  whyChooseUsCard,
  ({ one }) => ({
    siteSettings: one(siteSettings, {
      fields: [whyChooseUsCard.siteSettingsId],
      references: [siteSettings.id],
    }),
  }),
);

export const studentCourseEnrollmentRelations = relations(
  studentCourseEnrollment,
  ({ one }) => ({
    candidateProfile: one(candidateProfile, {
      fields: [studentCourseEnrollment.studentProfileId],
      references: [candidateProfile.id],
    }),
    course: one(course, {
      fields: [studentCourseEnrollment.courseId],
      references: [course.id],
    }),
  }),
);

export const academicResourceRelations = relations(
  academicResource,
  ({ one }) => ({
    course: one(course, {
      fields: [academicResource.courseId],
      references: [course.id],
    }),
  }),
);

export const studentProgressEntryRelations = relations(
  studentProgressEntry,
  ({ one }) => ({
    studentProfile: one(candidateProfile, {
      fields: [studentProgressEntry.studentProfileId],
      references: [candidateProfile.id],
    }),
    course: one(course, {
      fields: [studentProgressEntry.courseId],
      references: [course.id],
    }),
  }),
);

export const timetableEntryRelations = relations(timetableEntry, ({ one }) => ({
  course: one(course, {
    fields: [timetableEntry.courseId],
    references: [course.id],
  }),
}));

export const staffPermissionRelations = relations(staffPermission, ({ one }) => ({
  user: one(user, {
    fields: [staffPermission.userId],
    references: [user.id],
  }),
}));

export const auditLogEntryRelations = relations(auditLogEntry, ({ one }) => ({
  actor: one(user, {
    fields: [auditLogEntry.actorUserId],
    references: [user.id],
  }),
}));
