// The database schema. After changing it, run `npm run db:generate` to write
// the matching SQL migration in drizzle/ (src/db/schema.test.ts fails until
// you do). Originally pulled from the database Prisma created, keeping its
// client-side behaviour: cuid ids, updatedAt hooks and Date timestamps. List
// columns stay nullable as they are in existing databases; new rows get []
// by default, and src/db/helpers.ts#withProfileLists reads a missing list as
// empty.
import { pgTable, index, uniqueIndex, foreignKey, text, boolean, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

export const applicationStatus = pgEnum("ApplicationStatus", ['APPLIED', 'VIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED'])
export const courseStatus = pgEnum("CourseStatus", ['DRAFT', 'PUBLISHED', 'ARCHIVED'])
export const educationalQualification = pgEnum("EducationalQualification", ['SSLC', 'PLUS_TWO', 'DIPLOMA', 'GRADUATE', 'POST_GRADUATE', 'OTHER'])
export const employeeCountRange = pgEnum("EmployeeCountRange", ['RANGE_1_10', 'RANGE_11_50', 'RANGE_51_200', 'RANGE_200_PLUS'])
export const employerProfileStatus = pgEnum("EmployerProfileStatus", ['PENDING', 'APPROVED', 'REJECTED'])
export const galleryMediaType = pgEnum("GalleryMediaType", ['IMAGE', 'VIDEO'])
export const industrySector = pgEnum("IndustrySector", ['IT_SOFTWARE', 'EDUCATION_TRAINING', 'HEALTHCARE', 'BANKING_FINANCE', 'MANUFACTURING', 'RETAIL', 'HOSPITALITY', 'CONSTRUCTION', 'TELECOMMUNICATION', 'OTHER'])
export const jobPostingStatus = pgEnum("JobPostingStatus", ['PENDING', 'APPROVED', 'REJECTED', 'CLOSED'])
export const jobType = pgEnum("JobType", ['FULL_TIME', 'PART_TIME', 'CONTRACT'])
export const newsEventType = pgEnum("NewsEventType", ['NEWS', 'EVENT'])
export const preferredJobType = pgEnum("PreferredJobType", ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'WORK_FROM_HOME'])
export const resourceType = pgEnum("ResourceType", ['NOTE', 'ASSIGNMENT', 'PAST_PAPER', 'LECTURE', 'TIMETABLE', 'PROGRESS'])
export const role = pgEnum("Role", ['STUDENT', 'JOB_SEEKER', 'EMPLOYER', 'CENTRE_STAFF', 'SUPER_ADMIN'])
export const salaryVisibility = pgEnum("SalaryVisibility", ['DISCLOSE', 'PRIVATE'])
export const skillStatus = pgEnum("SkillStatus", ['PENDING', 'APPROVED'])
export const whyCardIcon = pgEnum("WhyCardIcon", ['AWARD', 'USERS', 'BOOK_OPEN', 'BRIEFCASE', 'GLOBE', 'HEADPHONES'])


export const employerProfile = pgTable("EmployerProfile", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	userId: text().notNull(),
	companyName: text().notNull(),
	industrySector: industrySector().notNull(),
	contactPersonName: text().notNull(),
	designation: text().notNull(),
	phone: text().notNull(),
	email: text().notNull(),
	companyAddress: text().notNull(),
	hasWebsite: boolean().default(false).notNull(),
	websiteUrl: text(),
	employeeCountRange: employeeCountRange().notNull(),
	aboutCompany: text().notNull(),
	status: employerProfileStatus().default('PENDING').notNull(),
	autoPublishTrusted: boolean().default(false).notNull(),
	rejectionReason: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	index("EmployerProfile_status_idx").using("btree", table.status),
	uniqueIndex("EmployerProfile_userId_key").using("btree", table.userId),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "EmployerProfile_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const user = pgTable("User", {
	id: text().primaryKey().notNull(),
	role: role().notNull(),
	languagePreference: text().default('en').notNull(),
	deactivatedAt: timestamp({ precision: 3, mode: 'date' }),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const candidateProfile = pgTable("CandidateProfile", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	userId: text().notNull(),
	isVerifiedStudent: boolean().default(false).notNull(),
	studentRecordId: text(),
	fullName: text(),
	dateOfBirth: timestamp({ precision: 3, mode: 'date' }),
	phone: text(),
	email: text(),
	courseCompletedIds: text().array().$defaultFn(() => []),
	certificationIds: text().array().$defaultFn(() => []),
	educationalQualification: educationalQualification(),
	yearOfPassing: integer(),
	address: text(),
	languagesKnown: text().array().$defaultFn(() => []),
	skillIds: text().array().default(sql`ARRAY[]::text[]`),
	preferredJobLocation: text(),
	preferredJobType: preferredJobType(),
	careerObjective: text(),
	photoUrl: text(),
	profileVisible: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	uniqueIndex("CandidateProfile_userId_key").using("btree", table.userId),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "CandidateProfile_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const skill = pgTable("Skill", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	label: text().notNull(),
	status: skillStatus().default('PENDING').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("Skill_label_key").using("btree", table.label),
]);

export const jobPosting = pgTable("JobPosting", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	employerId: text().notNull(),
	title: text().notNull(),
	department: text(),
	salaryMin: integer(),
	salaryMax: integer(),
	salaryVisibility: salaryVisibility().default('PRIVATE').notNull(),
	jobType: jobType().notNull(),
	skillIds: text().array().default(sql`ARRAY[]::text[]`),
	applicationDeadline: timestamp({ precision: 3, mode: 'date' }).notNull(),
	description: text().notNull(),
	status: jobPostingStatus().default('PENDING').notNull(),
	rejectionReason: text(),
	autoPublished: boolean().default(false).notNull(),
	deletedAt: timestamp({ precision: 3, mode: 'date' }),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	index("JobPosting_createdAt_idx").using("btree", table.createdAt),
	index("JobPosting_employerId_idx").using("btree", table.employerId),
	index("JobPosting_status_idx").using("btree", table.status),
	foreignKey({
			columns: [table.employerId],
			foreignColumns: [employerProfile.id],
			name: "JobPosting_employerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const application = pgTable("Application", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	jobPostingId: text().notNull(),
	candidateProfileId: text().notNull(),
	status: applicationStatus().default('APPLIED').notNull(),
	appliedAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	statusUpdatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	index("Application_candidateProfileId_idx").using("btree", table.candidateProfileId),
	uniqueIndex("Application_jobPostingId_candidateProfileId_key").using("btree", table.jobPostingId, table.candidateProfileId),
	index("Application_jobPostingId_idx").using("btree", table.jobPostingId),
	index("Application_status_idx").using("btree", table.status),
	foreignKey({
			columns: [table.jobPostingId],
			foreignColumns: [jobPosting.id],
			name: "Application_jobPostingId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.candidateProfileId],
			foreignColumns: [candidateProfile.id],
			name: "Application_candidateProfileId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const enquiry = pgTable("Enquiry", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	name: text().notNull(),
	phone: text().notNull(),
	courseId: text(),
	message: text(),
	source: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("Enquiry_courseId_idx").using("btree", table.courseId),
	index("Enquiry_createdAt_idx").using("btree", table.createdAt),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [course.id],
			name: "Enquiry_courseId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const flashNewsItem = pgTable("FlashNewsItem", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	textEn: text().notNull(),
	textMl: text(),
	link: text(),
	active: boolean().default(true).notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'date' }),
	sortOrder: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	index("FlashNewsItem_active_expiresAt_idx").using("btree", table.active, table.expiresAt),
	index("FlashNewsItem_sortOrder_idx").using("btree", table.sortOrder),
]);

export const courseCategory = pgTable("CourseCategory", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	nameEn: text().notNull(),
	nameMl: text(),
	sortOrder: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	index("CourseCategory_sortOrder_idx").using("btree", table.sortOrder),
]);

export const newsEvent = pgTable("NewsEvent", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	type: newsEventType().notNull(),
	titleEn: text().notNull(),
	titleMl: text(),
	bodyEn: text().notNull(),
	bodyMl: text(),
	coverImageUrl: text(),
	eventDate: timestamp({ precision: 3, mode: 'date' }),
	publishedAt: timestamp({ precision: 3, mode: 'date' }),
	slug: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	index("NewsEvent_eventDate_idx").using("btree", table.eventDate),
	index("NewsEvent_publishedAt_idx").using("btree", table.publishedAt),
	uniqueIndex("NewsEvent_slug_key").using("btree", table.slug),
	index("NewsEvent_type_idx").using("btree", table.type),
]);

export const galleryCategory = pgTable("GalleryCategory", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	slug: text().notNull(),
	nameEn: text().notNull(),
	nameMl: text(),
	sortOrder: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	uniqueIndex("GalleryCategory_slug_key").using("btree", table.slug),
	index("GalleryCategory_sortOrder_idx").using("btree", table.sortOrder),
]);

export const siteSettings = pgTable("SiteSettings", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	yearsInOperation: text().default('25+').notNull(),
	studentsTrained: text().default('3.2M+').notNull(),
	centresWorldwide: text().default('800+').notNull(),
	affiliations: text().default('100+').notNull(),
	countries: text().default('23').notNull(),
	aboutBodyEn: text().default('').notNull(),
	aboutBodyMl: text(),
	aboutPhotoUrl: text(),
	address: text(),
	mapEmbedUrl: text(),
	facebookUrl: text(),
	instagramUrl: text(),
	youtubeUrl: text(),
	linkedinUrl: text(),
	googleReviewsUrl: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
	mapsUrl: text(),
	whatsappNumber: text(),
});

export const certificationPartner = pgTable("CertificationPartner", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	name: text().notNull(),
	nameMl: text(),
	logoUrl: text().notNull(),
	link: text(),
	sortOrder: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("CertificationPartner_sortOrder_idx").using("btree", table.sortOrder),
]);

export const studentRecord = pgTable("StudentRecord", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	studentId: text().notNull(),
	fullName: text().notNull(),
	phone: text().notNull(),
	email: text(),
	linkedUserId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	uniqueIndex("StudentRecord_studentId_key").using("btree", table.studentId),
]);

export const studentCourseEnrollment = pgTable("StudentCourseEnrollment", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	studentProfileId: text().notNull(),
	courseId: text().notNull(),
	enrolledAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("StudentCourseEnrollment_courseId_idx").using("btree", table.courseId),
	uniqueIndex("StudentCourseEnrollment_studentProfileId_courseId_key").using("btree", table.studentProfileId, table.courseId),
	index("StudentCourseEnrollment_studentProfileId_idx").using("btree", table.studentProfileId),
	foreignKey({
			columns: [table.studentProfileId],
			foreignColumns: [candidateProfile.id],
			name: "StudentCourseEnrollment_studentProfileId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [course.id],
			name: "StudentCourseEnrollment_courseId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const academicResource = pgTable("AcademicResource", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	courseId: text().notNull(),
	type: resourceType().notNull(),
	title: text().notNull(),
	fileUrl: text(),
	embedUrl: text(),
	uploadedAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("AcademicResource_courseId_idx").using("btree", table.courseId),
	index("AcademicResource_type_idx").using("btree", table.type),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [course.id],
			name: "AcademicResource_courseId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const studentProgressEntry = pgTable("StudentProgressEntry", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	studentProfileId: text().notNull(),
	courseId: text().notNull(),
	noteEn: text().notNull(),
	recordedAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("StudentProgressEntry_courseId_idx").using("btree", table.courseId),
	index("StudentProgressEntry_studentProfileId_idx").using("btree", table.studentProfileId),
	foreignKey({
			columns: [table.studentProfileId],
			foreignColumns: [candidateProfile.id],
			name: "StudentProgressEntry_studentProfileId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [course.id],
			name: "StudentProgressEntry_courseId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const timetableEntry = pgTable("TimetableEntry", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	courseId: text().notNull(),
	contentText: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("TimetableEntry_courseId_idx").using("btree", table.courseId),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [course.id],
			name: "TimetableEntry_courseId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const staffPermission = pgTable("StaffPermission", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	userId: text().notNull(),
	canEditCourses: boolean().default(true).notNull(),
	canEditGallery: boolean().default(true).notNull(),
	canEditCertificationPartners: boolean().default(true).notNull(),
	canEditNewsEvents: boolean().default(true).notNull(),
	canEditFlashNews: boolean().default(true).notNull(),
	canProvisionStudents: boolean().default(true).notNull(),
	canApproveEmployers: boolean().default(false).notNull(),
	canApproveJobPostings: boolean().default(false).notNull(),
	canModerateSkillsTaxonomy: boolean().default(true).notNull(),
}, (table) => [
	uniqueIndex("StaffPermission_userId_key").using("btree", table.userId),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "StaffPermission_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const auditLogEntry = pgTable("AuditLogEntry", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	actorUserId: text(),
	actorRole: role(),
	action: text().notNull(),
	entityType: text().notNull(),
	entityId: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	index("AuditLogEntry_actorUserId_idx").using("btree", table.actorUserId),
	index("AuditLogEntry_createdAt_idx").using("btree", table.createdAt),
	index("AuditLogEntry_entityType_entityId_idx").using("btree", table.entityType, table.entityId),
	foreignKey({
			columns: [table.actorUserId],
			foreignColumns: [user.id],
			name: "AuditLogEntry_actorUserId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const course = pgTable("Course", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	slug: text().notNull(),
	titleEn: text().notNull(),
	titleMl: text(),
	categoryId: text(),
	descriptionEn: text(),
	descriptionMl: text(),
	durationText: text(),
	syllabus: jsonb(),
	certifications: text().array().$defaultFn(() => []),
	careerOutcomesEn: text(),
	careerOutcomesMl: text(),
	coverImageUrl: text(),
	contentBlocks: jsonb(),
	featured: boolean().default(false).notNull(),
	status: courseStatus().default('DRAFT').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	index("Course_categoryId_idx").using("btree", table.categoryId),
	index("Course_featured_idx").using("btree", table.featured),
	uniqueIndex("Course_slug_key").using("btree", table.slug),
	index("Course_status_idx").using("btree", table.status),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [courseCategory.id],
			name: "Course_categoryId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const galleryItem = pgTable("GalleryItem", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	categoryId: text().notNull(),
	mediaType: galleryMediaType().notNull(),
	url: text().notNull(),
	captionEn: text(),
	captionMl: text(),
	sortOrder: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("GalleryItem_categoryId_idx").using("btree", table.categoryId),
	index("GalleryItem_sortOrder_idx").using("btree", table.sortOrder),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [galleryCategory.id],
			name: "GalleryItem_categoryId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const whyChooseUsCard = pgTable("WhyChooseUsCard", {
	id: text().primaryKey().notNull().$defaultFn(() => createId()),
	siteSettingsId: text().notNull(),
	sortOrder: integer().default(0).notNull(),
	icon: whyCardIcon().notNull(),
	titleEn: text().notNull(),
	titleMl: text(),
	descriptionEn: text().notNull(),
	descriptionMl: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => [
	index("WhyChooseUsCard_siteSettingsId_idx").using("btree", table.siteSettingsId),
	index("WhyChooseUsCard_sortOrder_idx").using("btree", table.sortOrder),
	foreignKey({
			columns: [table.siteSettingsId],
			foreignColumns: [siteSettings.id],
			name: "WhyChooseUsCard_siteSettingsId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);
