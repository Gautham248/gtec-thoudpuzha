import { arrayContains } from "drizzle-orm";
import type * as drizzle from "drizzle-orm";
import { db } from "@/db";
import type { jobPosting } from "@/db/schema";
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
  /** Whether the posting is still accepting applications. */
  isOpen: boolean;
  employer: Pick<
    EmployerProfile,
    | "companyName"
    | "companyAddress"
    | "industrySector"
    | "employeeCountRange"
    | "aboutCompany"
  >;
};

type PostingColumns = (typeof jobPosting)["_"]["columns"];
type Operators = Pick<typeof drizzle, "and" | "eq" | "gt" | "isNull">;

/**
 * A posting accepts applications while it is approved, not deleted and before
 * its deadline. Listing, detail and apply all go through this one filter.
 * Takes the query's own operators so it composes inside any `where` callback.
 */
export const acceptingApplications = (
  p: PostingColumns,
  { and, eq, gt, isNull }: Operators,
) =>
  and(
    eq(p.status, "APPROVED"),
    isNull(p.deletedAt),
    gt(p.applicationDeadline, new Date()),
  );

/**
 * Fetch a single active job posting. With `includeClosed`, also return an
 * approved posting that has since closed or passed its deadline, so a past
 * applicant can still read it; `isOpen` tells the two apart.
 */
export async function getJobDetail(
  id: string,
  { includeClosed = false }: { includeClosed?: boolean } = {},
): Promise<JobDetail | null> {
  try {
    const posting = await db.query.jobPosting.findFirst({
      where: (p, ops) =>
        ops.and(
          ops.eq(p.id, id),
          includeClosed
            ? ops.and(
                ops.inArray(p.status, ["APPROVED", "CLOSED"]),
                ops.isNull(p.deletedAt),
              )
            : acceptingApplications(p, ops),
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
        status: true,
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
    if (!posting) return null;
    const { status, ...detail } = posting;
    return {
      ...detail,
      isOpen:
        status === "APPROVED" && posting.applicationDeadline > new Date(),
    };
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
      where: (p, ops) =>
        ops.and(
          acceptingApplications(p, ops),
          filters?.jobType ? ops.eq(p.jobType, filters.jobType) : undefined,
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
