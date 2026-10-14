import { arrayContains } from "drizzle-orm";
import { db } from "@/db";
import { logger } from "@/lib/logger";
import type { JobPosting, JobType, EmployerProfile } from "@/db/types";

export type ActiveJobPosting = Pick<
  JobPosting,
  | "id"
  | "title"
  | "department"
  | "salaryMin"
  | "salaryMax"
  | "salaryVisibility"
  | "jobType"
  | "skillIds"
  | "applicationDeadline"
  | "description"
  | "createdAt"
> & {
  employer: {
    companyName: string;
    companyAddress: string;
  };
};

export type JobDetail = Pick<
  JobPosting,
  | "id"
  | "title"
  | "department"
  | "salaryMin"
  | "salaryMax"
  | "salaryVisibility"
  | "jobType"
  | "skillIds"
  | "applicationDeadline"
  | "description"
  | "createdAt"
> & {
  employer: Pick<
    EmployerProfile,
    | "companyName"
    | "companyAddress"
    | "industrySector"
    | "employeeCountRange"
    | "aboutCompany"
  >;
};

/** Fetch a single active (approved, non-expired, non-deleted) job posting. */
export async function getJobDetail(id: string): Promise<JobDetail | null> {
  try {
    const posting = await db.query.jobPosting.findFirst({
      where: (p, { and, eq, gt, isNull }) =>
        and(
          eq(p.id, id),
          eq(p.status, "APPROVED"),
          isNull(p.deletedAt),
          gt(p.applicationDeadline, new Date()),
        ),
      columns: {
        id: true,
        title: true,
        department: true,
        salaryMin: true,
        salaryMax: true,
        salaryVisibility: true,
        jobType: true,
        skillIds: true,
        applicationDeadline: true,
        description: true,
        createdAt: true,
      },
      with: {
        employer: {
          columns: {
            companyName: true,
            companyAddress: true,
            industrySector: true,
            employeeCountRange: true,
            aboutCompany: true,
          },
        },
      },
    });
    return posting ?? null;
  } catch (err) {
    logger.exception("jobs", "Failed to fetch job detail", err);
    return null;
  }
}

export async function getActiveJobPostings(filters?: {
  jobType?: JobType;
  skillId?: string;
  location?: string;
}): Promise<ActiveJobPosting[]> {
  const postings = await db.query.jobPosting
    .findMany({
      where: (p, { and, eq, gt, isNull }) =>
        and(
          eq(p.status, "APPROVED"),
          isNull(p.deletedAt),
          gt(p.applicationDeadline, new Date()),
          filters?.jobType ? eq(p.jobType, filters.jobType) : undefined,
          filters?.skillId
            ? arrayContains(p.skillIds, [filters.skillId])
            : undefined,
        ),
      with: {
        employer: {
          columns: { companyName: true, companyAddress: true },
        },
      },
      orderBy: (p, { desc }) => desc(p.createdAt),
    })
    .catch((err) => {
      logger.exception("jobs", "Failed to fetch active job postings", err);
      throw err;
    });

  if (filters?.location) {
    const loc = filters.location.toLowerCase();
    return postings.filter((p) =>
      p.employer.companyAddress.toLowerCase().includes(loc),
    );
  }

  return postings;
}
