"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jobPosting } from "@/db/schema";
import { Role, getEffectiveRole } from "@/lib/auth";
import type { JobType, SalaryVisibility } from "@/db/types";

interface ActionResult {
  success: false;
  error: string;
}

export async function submitVacancy(
  formData: FormData,
): Promise<ActionResult | undefined> {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) {
    redirect("/forbidden");
  }

  const profile = await db.query.employerProfile.findFirst({
    where: (e, { eq }) => eq(e.userId, session.userId!),
  });

  if (!profile || profile.status !== "APPROVED") {
    redirect("/portal/employer/register/status");
  }

  const title = formData.get("title") as string;
  const department = formData.get("department") as string;
  const salaryMinRaw = formData.get("salaryMin") as string;
  const salaryMaxRaw = formData.get("salaryMax") as string;
  const salaryVisibility = formData.get("salaryVisibility") as string;
  const jobType = formData.get("jobType") as string;
  const skillIdsRaw = formData.get("skillIds") as string;
  const applicationDeadline = formData.get("applicationDeadline") as string;
  const description = formData.get("description") as string;

  if (!title || !jobType || !applicationDeadline || !description) {
    return {
      success: false,
      error: "Please fill in all required fields.",
    };
  }

  const validJobTypes: JobType[] = ["FULL_TIME", "PART_TIME", "CONTRACT"];
  if (!validJobTypes.includes(jobType as JobType)) {
    return { success: false, error: "Invalid job type selected." };
  }

  const validSalaryVisibilities: SalaryVisibility[] = ["DISCLOSE", "PRIVATE"];
  const vis = validSalaryVisibilities.includes(
    salaryVisibility as SalaryVisibility,
  )
    ? (salaryVisibility as SalaryVisibility)
    : "PRIVATE";

  const salaryMin = salaryMinRaw ? parseInt(salaryMinRaw, 10) : null;
  const salaryMax = salaryMaxRaw ? parseInt(salaryMaxRaw, 10) : null;

  if (salaryMin !== null && isNaN(salaryMin)) {
    return { success: false, error: "Invalid minimum salary." };
  }
  if (salaryMax !== null && isNaN(salaryMax)) {
    return { success: false, error: "Invalid maximum salary." };
  }

  const deadline = new Date(applicationDeadline);
  if (isNaN(deadline.getTime())) {
    return { success: false, error: "Invalid application deadline." };
  }

  let skillIds: string[] = [];
  try {
    skillIds = skillIdsRaw ? JSON.parse(skillIdsRaw) : [];
  } catch {
    return { success: false, error: "Invalid skills data." };
  }

  if (!Array.isArray(skillIds)) {
    return { success: false, error: "Invalid skills data." };
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
}
