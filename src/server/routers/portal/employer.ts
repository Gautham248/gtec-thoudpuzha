import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import { employerProfile, jobPosting } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import type {
  EmployeeCountRange,
  IndustrySector,
  JobType,
  SalaryVisibility,
} from "@/db/types";
import { Role, getEffectiveRole } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { form, text } from "@/server/form";
import { publicProcedure, router } from "@/server/trpc";

export interface ActionError {
  success: false;
  error: string;
}

const fail = (error: string): ActionError => ({ success: false, error });

/** Sends a signed-out user to sign in, and a non-employer to /forbidden. */
async function requireEmployer(session: Awaited<ReturnType<typeof auth>>) {
  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) {
    redirect("/forbidden");
  }
}

const profileFields = {
  companyName: text(),
  industrySector: text(),
  contactPersonName: text(),
  designation: text(),
  phone: text(),
  email: text(),
  companyAddress: text(),
  hasWebsite: text(),
  websiteUrl: text(),
  employeeCountRange: text(),
  aboutCompany: text(),
};

const REQUIRED = [
  "companyName",
  "industrySector",
  "contactPersonName",
  "designation",
  "phone",
  "email",
  "companyAddress",
  "employeeCountRange",
  "aboutCompany",
] as const;

const VALID_SECTORS: IndustrySector[] = [
  "IT_SOFTWARE",
  "EDUCATION_TRAINING",
  "HEALTHCARE",
  "BANKING_FINANCE",
  "MANUFACTURING",
  "RETAIL",
  "HOSPITALITY",
  "CONSTRUCTION",
  "TELECOMMUNICATION",
  "OTHER",
];

const VALID_RANGES: EmployeeCountRange[] = [
  "RANGE_1_10",
  "RANGE_11_50",
  "RANGE_51_200",
  "RANGE_200_PLUS",
];

/** Validates the company profile form: an error for the user, or the columns. */
function profileValues(
  input: z.output<z.ZodObject<typeof profileFields>>,
):
  | { error: ActionError }
  | { values: Omit<typeof employerProfile.$inferInsert, "userId"> } {
  for (const field of REQUIRED) {
    if (!input[field]) {
      return { error: fail("Please fill in all required fields.") };
    }
  }

  const hasWebsite = input.hasWebsite === "yes";

  // Website validation: if they said yes, URL is required
  if (hasWebsite && !input.websiteUrl) {
    return {
      error: fail("Please provide a website URL, or select 'No website'."),
    };
  }

  if (!VALID_SECTORS.includes(input.industrySector as IndustrySector)) {
    return { error: fail("Invalid industry sector selected.") };
  }
  if (!VALID_RANGES.includes(input.employeeCountRange as EmployeeCountRange)) {
    return { error: fail("Invalid employee count range selected.") };
  }

  return {
    values: {
      companyName: input.companyName,
      industrySector: input.industrySector as IndustrySector,
      contactPersonName: input.contactPersonName,
      designation: input.designation,
      phone: input.phone,
      email: input.email,
      companyAddress: input.companyAddress,
      hasWebsite,
      websiteUrl: hasWebsite ? input.websiteUrl : null,
      employeeCountRange: input.employeeCountRange as EmployeeCountRange,
      aboutCompany: input.aboutCompany,
    },
  };
}

export const employerRouter = router({
  register: publicProcedure
    .input(form(profileFields))
    .mutation(async ({ input }): Promise<ActionError | undefined> => {
      const session = await auth();
      if (!session.userId) {
        redirect("/sign-in");
      }

      // Rate-limit: 5 per minute per IP
      const ip = await getClientIp();
      const rateCheck = checkRateLimit(`employer-reg:${ip}`);
      if (!rateCheck.allowed) {
        return fail("Too many attempts. Please try again later.");
      }

      await requireEmployer(session);

      // Check if employer already has a profile
      const existing = await db.query.employerProfile.findFirst({
        where: (e, { eq }) => eq(e.userId, session.userId!),
      });
      if (existing) {
        if (existing.status === "PENDING" || existing.status === "REJECTED") {
          redirect("/portal/employer/register/status");
        }
        // Already approved — send to portal
        redirect("/portal");
      }

      const result = profileValues(input);
      if ("error" in result) return result.error;

      // A concurrent double-submit that got past the check above is settled by
      // the unique userId index; both requests then land on the status page.
      await db
        .insert(employerProfile)
        .values({
          ...result.values,
          userId: session.userId,
          status: "PENDING",
          autoPublishTrusted: false,
        })
        .onConflictDoNothing({ target: employerProfile.userId });

      redirect("/portal/employer/register/status");
    }),

  updateProfile: publicProcedure
    .input(form(profileFields))
    .mutation(async ({ input }): Promise<ActionError | undefined> => {
      const session = await auth();
      if (!session.userId) {
        redirect("/sign-in");
      }

      await requireEmployer(session);

      const existing = await db.query.employerProfile.findFirst({
        where: (e, { eq }) => eq(e.userId, session.userId!),
      });
      if (!existing) {
        redirect("/portal/employer/register");
      }

      const result = profileValues(input);
      if ("error" in result) return result.error;

      expectRow(
        await db
          .update(employerProfile)
          .set(result.values)
          .where(eq(employerProfile.userId, session.userId))
          .returning({ id: employerProfile.id }),
        "Employer profile",
      );
    }),

  submitVacancy: publicProcedure
    .input(
      form({
        title: text(),
        department: text(),
        salaryMin: text(),
        salaryMax: text(),
        salaryVisibility: text(),
        jobType: text(),
        skillIds: text(),
        applicationDeadline: text(),
        description: text(),
      }),
    )
    .mutation(async ({ input }): Promise<ActionError | undefined> => {
      const session = await auth();
      if (!session.userId) {
        redirect("/sign-in");
      }

      await requireEmployer(session);

      const profile = await db.query.employerProfile.findFirst({
        where: (e, { eq }) => eq(e.userId, session.userId!),
      });

      if (!profile || profile.status !== "APPROVED") {
        redirect("/portal/employer/register/status");
      }

      const { title, department, jobType, applicationDeadline, description } =
        input;

      if (!title || !jobType || !applicationDeadline || !description) {
        return fail("Please fill in all required fields.");
      }

      const validJobTypes: JobType[] = ["FULL_TIME", "PART_TIME", "CONTRACT"];
      if (!validJobTypes.includes(jobType as JobType)) {
        return fail("Invalid job type selected.");
      }

      const validSalaryVisibilities: SalaryVisibility[] = [
        "DISCLOSE",
        "PRIVATE",
      ];
      const vis = validSalaryVisibilities.includes(
        input.salaryVisibility as SalaryVisibility,
      )
        ? (input.salaryVisibility as SalaryVisibility)
        : "PRIVATE";

      const salaryMin = input.salaryMin ? parseInt(input.salaryMin, 10) : null;
      const salaryMax = input.salaryMax ? parseInt(input.salaryMax, 10) : null;

      if (salaryMin !== null && isNaN(salaryMin)) {
        return fail("Invalid minimum salary.");
      }
      if (salaryMax !== null && isNaN(salaryMax)) {
        return fail("Invalid maximum salary.");
      }

      const deadline = new Date(applicationDeadline);
      if (isNaN(deadline.getTime())) {
        return fail("Invalid application deadline.");
      }

      let skillIds: string[] = [];
      try {
        skillIds = input.skillIds ? JSON.parse(input.skillIds) : [];
      } catch {
        return fail("Invalid skills data.");
      }

      if (!Array.isArray(skillIds)) {
        return fail("Invalid skills data.");
      }

      const autoPublish = profile.autoPublishTrusted;

      await db.insert(jobPosting).values({
        employerId: profile.id,
        title,
        department: department || null,
        salaryMin,
        salaryMax,
        salaryVisibility: vis,
        jobType: jobType as JobType,
        skillIds,
        applicationDeadline: deadline,
        description,
        status: autoPublish ? "APPROVED" : "PENDING",
        autoPublished: autoPublish,
      });

      redirect("/portal/employer");
    }),
});
