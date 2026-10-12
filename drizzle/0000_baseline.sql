CREATE TYPE "public"."ApplicationStatus" AS ENUM('APPLIED', 'VIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED');--> statement-breakpoint
CREATE TYPE "public"."CourseStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."EducationalQualification" AS ENUM('SSLC', 'PLUS_TWO', 'DIPLOMA', 'GRADUATE', 'POST_GRADUATE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."EmployeeCountRange" AS ENUM('RANGE_1_10', 'RANGE_11_50', 'RANGE_51_200', 'RANGE_200_PLUS');--> statement-breakpoint
CREATE TYPE "public"."EmployerProfileStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."GalleryMediaType" AS ENUM('IMAGE', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."IndustrySector" AS ENUM('IT_SOFTWARE', 'EDUCATION_TRAINING', 'HEALTHCARE', 'BANKING_FINANCE', 'MANUFACTURING', 'RETAIL', 'HOSPITALITY', 'CONSTRUCTION', 'TELECOMMUNICATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."JobPostingStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."JobType" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT');--> statement-breakpoint
CREATE TYPE "public"."NewsEventType" AS ENUM('NEWS', 'EVENT');--> statement-breakpoint
CREATE TYPE "public"."PreferredJobType" AS ENUM('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'WORK_FROM_HOME');--> statement-breakpoint
CREATE TYPE "public"."ResourceType" AS ENUM('NOTE', 'ASSIGNMENT', 'PAST_PAPER', 'LECTURE', 'TIMETABLE', 'PROGRESS');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('STUDENT', 'JOB_SEEKER', 'EMPLOYER', 'CENTRE_STAFF', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."SalaryVisibility" AS ENUM('DISCLOSE', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."SkillStatus" AS ENUM('PENDING', 'APPROVED');--> statement-breakpoint
CREATE TYPE "public"."WhyCardIcon" AS ENUM('AWARD', 'USERS', 'BOOK_OPEN', 'BRIEFCASE', 'GLOBE', 'HEADPHONES');--> statement-breakpoint
CREATE TABLE "AcademicResource" (
	"id" text PRIMARY KEY NOT NULL,
	"courseId" text NOT NULL,
	"type" "ResourceType" NOT NULL,
	"title" text NOT NULL,
	"fileUrl" text,
	"embedUrl" text,
	"uploadedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Application" (
	"id" text PRIMARY KEY NOT NULL,
	"jobPostingId" text NOT NULL,
	"candidateProfileId" text NOT NULL,
	"status" "ApplicationStatus" DEFAULT 'APPLIED' NOT NULL,
	"appliedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"statusUpdatedAt" timestamp (3) NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuditLogEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"actorUserId" text,
	"actorRole" "Role",
	"action" text NOT NULL,
	"entityType" text NOT NULL,
	"entityId" text NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CandidateProfile" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"isVerifiedStudent" boolean DEFAULT false NOT NULL,
	"studentRecordId" text,
	"fullName" text,
	"dateOfBirth" timestamp (3),
	"phone" text,
	"email" text,
	"courseCompletedIds" text[],
	"certificationIds" text[],
	"educationalQualification" "EducationalQualification",
	"yearOfPassing" integer,
	"address" text,
	"languagesKnown" text[],
	"skillIds" text[] DEFAULT ARRAY[]::text[],
	"preferredJobLocation" text,
	"preferredJobType" "PreferredJobType",
	"careerObjective" text,
	"photoUrl" text,
	"profileVisible" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CertificationPartner" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"nameMl" text,
	"logoUrl" text NOT NULL,
	"link" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Course" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"titleEn" text NOT NULL,
	"titleMl" text,
	"categoryId" text,
	"descriptionEn" text,
	"descriptionMl" text,
	"durationText" text,
	"syllabus" jsonb,
	"certifications" text[],
	"careerOutcomesEn" text,
	"careerOutcomesMl" text,
	"coverImageUrl" text,
	"contentBlocks" jsonb,
	"featured" boolean DEFAULT false NOT NULL,
	"status" "CourseStatus" DEFAULT 'DRAFT' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CourseCategory" (
	"id" text PRIMARY KEY NOT NULL,
	"nameEn" text NOT NULL,
	"nameMl" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "EmployerProfile" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"companyName" text NOT NULL,
	"industrySector" "IndustrySector" NOT NULL,
	"contactPersonName" text NOT NULL,
	"designation" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"companyAddress" text NOT NULL,
	"hasWebsite" boolean DEFAULT false NOT NULL,
	"websiteUrl" text,
	"employeeCountRange" "EmployeeCountRange" NOT NULL,
	"aboutCompany" text NOT NULL,
	"status" "EmployerProfileStatus" DEFAULT 'PENDING' NOT NULL,
	"autoPublishTrusted" boolean DEFAULT false NOT NULL,
	"rejectionReason" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Enquiry" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"courseId" text,
	"message" text,
	"source" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "FlashNewsItem" (
	"id" text PRIMARY KEY NOT NULL,
	"textEn" text NOT NULL,
	"textMl" text,
	"link" text,
	"active" boolean DEFAULT true NOT NULL,
	"expiresAt" timestamp (3),
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "GalleryCategory" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nameEn" text NOT NULL,
	"nameMl" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "GalleryItem" (
	"id" text PRIMARY KEY NOT NULL,
	"categoryId" text NOT NULL,
	"mediaType" "GalleryMediaType" NOT NULL,
	"url" text NOT NULL,
	"captionEn" text,
	"captionMl" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "JobPosting" (
	"id" text PRIMARY KEY NOT NULL,
	"employerId" text NOT NULL,
	"title" text NOT NULL,
	"department" text,
	"salaryMin" integer,
	"salaryMax" integer,
	"salaryVisibility" "SalaryVisibility" DEFAULT 'PRIVATE' NOT NULL,
	"jobType" "JobType" NOT NULL,
	"skillIds" text[] DEFAULT ARRAY[]::text[],
	"applicationDeadline" timestamp (3) NOT NULL,
	"description" text NOT NULL,
	"status" "JobPostingStatus" DEFAULT 'PENDING' NOT NULL,
	"rejectionReason" text,
	"autoPublished" boolean DEFAULT false NOT NULL,
	"deletedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "NewsEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "NewsEventType" NOT NULL,
	"titleEn" text NOT NULL,
	"titleMl" text,
	"bodyEn" text NOT NULL,
	"bodyMl" text,
	"coverImageUrl" text,
	"eventDate" timestamp (3),
	"publishedAt" timestamp (3),
	"slug" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SiteSettings" (
	"id" text PRIMARY KEY NOT NULL,
	"yearsInOperation" text DEFAULT '25+' NOT NULL,
	"studentsTrained" text DEFAULT '3.2M+' NOT NULL,
	"centresWorldwide" text DEFAULT '800+' NOT NULL,
	"affiliations" text DEFAULT '100+' NOT NULL,
	"countries" text DEFAULT '23' NOT NULL,
	"aboutBodyEn" text DEFAULT '' NOT NULL,
	"aboutBodyMl" text,
	"aboutPhotoUrl" text,
	"address" text,
	"mapEmbedUrl" text,
	"facebookUrl" text,
	"instagramUrl" text,
	"youtubeUrl" text,
	"linkedinUrl" text,
	"googleReviewsUrl" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"mapsUrl" text,
	"whatsappNumber" text
);
--> statement-breakpoint
CREATE TABLE "Skill" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"status" "SkillStatus" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StaffPermission" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"canEditCourses" boolean DEFAULT true NOT NULL,
	"canEditGallery" boolean DEFAULT true NOT NULL,
	"canEditCertificationPartners" boolean DEFAULT true NOT NULL,
	"canEditNewsEvents" boolean DEFAULT true NOT NULL,
	"canEditFlashNews" boolean DEFAULT true NOT NULL,
	"canProvisionStudents" boolean DEFAULT true NOT NULL,
	"canApproveEmployers" boolean DEFAULT false NOT NULL,
	"canApproveJobPostings" boolean DEFAULT false NOT NULL,
	"canModerateSkillsTaxonomy" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StudentCourseEnrollment" (
	"id" text PRIMARY KEY NOT NULL,
	"studentProfileId" text NOT NULL,
	"courseId" text NOT NULL,
	"enrolledAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StudentProgressEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"studentProfileId" text NOT NULL,
	"courseId" text NOT NULL,
	"noteEn" text NOT NULL,
	"recordedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StudentRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"fullName" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"linkedUserId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TimetableEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"courseId" text NOT NULL,
	"contentText" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "Role" NOT NULL,
	"languagePreference" text DEFAULT 'en' NOT NULL,
	"deactivatedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "WhyChooseUsCard" (
	"id" text PRIMARY KEY NOT NULL,
	"siteSettingsId" text NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"icon" "WhyCardIcon" NOT NULL,
	"titleEn" text NOT NULL,
	"titleMl" text,
	"descriptionEn" text NOT NULL,
	"descriptionMl" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AcademicResource" ADD CONSTRAINT "AcademicResource_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "public"."JobPosting"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "public"."CandidateProfile"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AuditLogEntry" ADD CONSTRAINT "AuditLogEntry_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."CourseCategory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."GalleryCategory"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "public"."EmployerProfile"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StaffPermission" ADD CONSTRAINT "StaffPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentCourseEnrollment" ADD CONSTRAINT "StudentCourseEnrollment_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "public"."CandidateProfile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentCourseEnrollment" ADD CONSTRAINT "StudentCourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentProgressEntry" ADD CONSTRAINT "StudentProgressEntry_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "public"."CandidateProfile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentProgressEntry" ADD CONSTRAINT "StudentProgressEntry_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "WhyChooseUsCard" ADD CONSTRAINT "WhyChooseUsCard_siteSettingsId_fkey" FOREIGN KEY ("siteSettingsId") REFERENCES "public"."SiteSettings"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "AcademicResource_courseId_idx" ON "AcademicResource" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "AcademicResource_type_idx" ON "AcademicResource" USING btree ("type");--> statement-breakpoint
CREATE INDEX "Application_candidateProfileId_idx" ON "Application" USING btree ("candidateProfileId");--> statement-breakpoint
CREATE UNIQUE INDEX "Application_jobPostingId_candidateProfileId_key" ON "Application" USING btree ("jobPostingId","candidateProfileId");--> statement-breakpoint
CREATE INDEX "Application_jobPostingId_idx" ON "Application" USING btree ("jobPostingId");--> statement-breakpoint
CREATE INDEX "Application_status_idx" ON "Application" USING btree ("status");--> statement-breakpoint
CREATE INDEX "AuditLogEntry_actorUserId_idx" ON "AuditLogEntry" USING btree ("actorUserId");--> statement-breakpoint
CREATE INDEX "AuditLogEntry_createdAt_idx" ON "AuditLogEntry" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "AuditLogEntry_entityType_entityId_idx" ON "AuditLogEntry" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "CertificationPartner_sortOrder_idx" ON "CertificationPartner" USING btree ("sortOrder");--> statement-breakpoint
CREATE INDEX "Course_categoryId_idx" ON "Course" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "Course_featured_idx" ON "Course" USING btree ("featured");--> statement-breakpoint
CREATE UNIQUE INDEX "Course_slug_key" ON "Course" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "Course_status_idx" ON "Course" USING btree ("status");--> statement-breakpoint
CREATE INDEX "CourseCategory_sortOrder_idx" ON "CourseCategory" USING btree ("sortOrder");--> statement-breakpoint
CREATE INDEX "EmployerProfile_status_idx" ON "EmployerProfile" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "EmployerProfile_userId_key" ON "EmployerProfile" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Enquiry_courseId_idx" ON "Enquiry" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "Enquiry_createdAt_idx" ON "Enquiry" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "FlashNewsItem_active_expiresAt_idx" ON "FlashNewsItem" USING btree ("active","expiresAt");--> statement-breakpoint
CREATE INDEX "FlashNewsItem_sortOrder_idx" ON "FlashNewsItem" USING btree ("sortOrder");--> statement-breakpoint
CREATE UNIQUE INDEX "GalleryCategory_slug_key" ON "GalleryCategory" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "GalleryCategory_sortOrder_idx" ON "GalleryCategory" USING btree ("sortOrder");--> statement-breakpoint
CREATE INDEX "GalleryItem_categoryId_idx" ON "GalleryItem" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "GalleryItem_sortOrder_idx" ON "GalleryItem" USING btree ("sortOrder");--> statement-breakpoint
CREATE INDEX "JobPosting_createdAt_idx" ON "JobPosting" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "JobPosting_employerId_idx" ON "JobPosting" USING btree ("employerId");--> statement-breakpoint
CREATE INDEX "JobPosting_status_idx" ON "JobPosting" USING btree ("status");--> statement-breakpoint
CREATE INDEX "NewsEvent_eventDate_idx" ON "NewsEvent" USING btree ("eventDate");--> statement-breakpoint
CREATE INDEX "NewsEvent_publishedAt_idx" ON "NewsEvent" USING btree ("publishedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "NewsEvent_slug_key" ON "NewsEvent" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "NewsEvent_type_idx" ON "NewsEvent" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "Skill_label_key" ON "Skill" USING btree ("label");--> statement-breakpoint
CREATE UNIQUE INDEX "StaffPermission_userId_key" ON "StaffPermission" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "StudentCourseEnrollment_courseId_idx" ON "StudentCourseEnrollment" USING btree ("courseId");--> statement-breakpoint
CREATE UNIQUE INDEX "StudentCourseEnrollment_studentProfileId_courseId_key" ON "StudentCourseEnrollment" USING btree ("studentProfileId","courseId");--> statement-breakpoint
CREATE INDEX "StudentCourseEnrollment_studentProfileId_idx" ON "StudentCourseEnrollment" USING btree ("studentProfileId");--> statement-breakpoint
CREATE INDEX "StudentProgressEntry_courseId_idx" ON "StudentProgressEntry" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "StudentProgressEntry_studentProfileId_idx" ON "StudentProgressEntry" USING btree ("studentProfileId");--> statement-breakpoint
CREATE UNIQUE INDEX "StudentRecord_studentId_key" ON "StudentRecord" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "TimetableEntry_courseId_idx" ON "TimetableEntry" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "WhyChooseUsCard_siteSettingsId_idx" ON "WhyChooseUsCard" USING btree ("siteSettingsId");--> statement-breakpoint
CREATE INDEX "WhyChooseUsCard_sortOrder_idx" ON "WhyChooseUsCard" USING btree ("sortOrder");