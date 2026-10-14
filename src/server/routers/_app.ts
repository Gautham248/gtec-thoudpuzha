import { router } from "@/server/trpc";
import { academicResourcesRouter } from "./admin/academic-resources";
import { certificationPartnersRouter } from "./admin/certification-partners";
import { courseContentRouter } from "./admin/course-content";
import { courseEnrollmentRouter } from "./admin/course-enrollment";
import { coursesRouter } from "./admin/courses";
import { employersRouter } from "./admin/employers";
import { flashNewsRouter } from "./admin/flash-news";
import { galleryRouter } from "./admin/gallery";
import { jobPostingsRouter } from "./admin/job-postings";
import { newsEventsRouter } from "./admin/news-events";
import { settingsRouter } from "./admin/settings";
import { skillsTaxonomyRouter } from "./admin/skills-taxonomy";
import { staffRouter } from "./admin/staff";
import { studentsRouter } from "./admin/students";
import { timetableProgressRouter } from "./admin/timetable-progress";
import { applicantsRouter } from "./portal/applicants";
import { biodataRouter } from "./portal/biodata";
import { candidatesRouter } from "./portal/candidates";
import { employerRouter } from "./portal/employer";
import { jobsRouter } from "./portal/jobs";
import { studentSignUpRouter } from "./portal/student-sign-up";
import { enquiryRouter, skillsRouter } from "./public";

export const appRouter = router({
  admin: router({
    academicResources: academicResourcesRouter,
    certificationPartners: certificationPartnersRouter,
    courseContent: courseContentRouter,
    courseEnrollment: courseEnrollmentRouter,
    courses: coursesRouter,
    employers: employersRouter,
    flashNews: flashNewsRouter,
    gallery: galleryRouter,
    jobPostings: jobPostingsRouter,
    newsEvents: newsEventsRouter,
    settings: settingsRouter,
    skillsTaxonomy: skillsTaxonomyRouter,
    staff: staffRouter,
    students: studentsRouter,
    timetableProgress: timetableProgressRouter,
  }),
  portal: router({
    applicants: applicantsRouter,
    biodata: biodataRouter,
    candidates: candidatesRouter,
    employer: employerRouter,
    jobs: jobsRouter,
    studentSignUp: studentSignUpRouter,
  }),
  public: router({
    enquiry: enquiryRouter,
    skills: skillsRouter,
  }),
});

export type AppRouter = typeof appRouter;
