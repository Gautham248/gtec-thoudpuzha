"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { employerProfile } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { Role, getEffectiveRole } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import type { IndustrySector, EmployeeCountRange } from "@/db/types";

interface RegistrationResult {
  success: false;
  error: string;
}

export async function submitEmployerRegistration(
  formData: FormData,
): Promise<RegistrationResult | undefined> {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  // Rate-limit: 5 per minute per IP
  const ip = await getClientIp();
  const rateCheck = checkRateLimit(`employer-reg:${ip}`);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: "Too many attempts. Please try again later.",
    };
  }

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) {
    redirect("/forbidden");
  }

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

  // Parse & validate fields
  const companyName = formData.get("companyName") as string;
  const industrySector = formData.get("industrySector") as string;
  const contactPersonName = formData.get("contactPersonName") as string;
  const designation = formData.get("designation") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const companyAddress = formData.get("companyAddress") as string;
  const hasWebsiteRaw = formData.get("hasWebsite") as string;
  const websiteUrl = formData.get("websiteUrl") as string;
  const employeeCountRange = formData.get("employeeCountRange") as string;
  const aboutCompany = formData.get("aboutCompany") as string;

  // Required fields check
  const required = [
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

  for (const field of required) {
    if (!formData.get(field)) {
      return { success: false, error: `Please fill in all required fields.` };
    }
  }

  const hasWebsite = hasWebsiteRaw === "yes";

  // Website validation: if they said yes, URL is required
  if (hasWebsite && !websiteUrl) {
    return {
      success: false,
      error: "Please provide a website URL, or select 'No website'.",
    };
  }

  // Validate enums
  const validSectors: IndustrySector[] = [
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
  const validRanges: EmployeeCountRange[] = [
    "RANGE_1_10",
    "RANGE_11_50",
    "RANGE_51_200",
    "RANGE_200_PLUS",
  ];

  if (!validSectors.includes(industrySector as IndustrySector)) {
    return { success: false, error: "Invalid industry sector selected." };
  }
  if (!validRanges.includes(employeeCountRange as EmployeeCountRange)) {
    return { success: false, error: "Invalid employee count range selected." };
  }

  await db.insert(employerProfile).values({
    userId: session.userId,
    companyName,
    industrySector: industrySector as IndustrySector,
    contactPersonName,
    designation,
    phone,
    email,
    companyAddress,
    hasWebsite,
    websiteUrl: hasWebsite ? websiteUrl : null,
    employeeCountRange: employeeCountRange as EmployeeCountRange,
    aboutCompany,
    status: "PENDING",
    autoPublishTrusted: false,
  });

  redirect("/portal/employer/register/status");
}

export async function updateEmployerProfile(
  formData: FormData,
): Promise<RegistrationResult | undefined> {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) {
    redirect("/forbidden");
  }

  const existing = await db.query.employerProfile.findFirst({
    where: (e, { eq }) => eq(e.userId, session.userId!),
  });
  if (!existing) {
    redirect("/portal/employer/register");
  }

  // Parse & validate fields (same as registration)
  const companyName = formData.get("companyName") as string;
  const industrySector = formData.get("industrySector") as string;
  const contactPersonName = formData.get("contactPersonName") as string;
  const designation = formData.get("designation") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const companyAddress = formData.get("companyAddress") as string;
  const hasWebsiteRaw = formData.get("hasWebsite") as string;
  const websiteUrl = formData.get("websiteUrl") as string;
  const employeeCountRange = formData.get("employeeCountRange") as string;
  const aboutCompany = formData.get("aboutCompany") as string;

  const required = [
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

  for (const field of required) {
    if (!formData.get(field)) {
      return { success: false, error: "Please fill in all required fields." };
    }
  }

  const hasWebsite = hasWebsiteRaw === "yes";

  if (hasWebsite && !websiteUrl) {
    return {
      success: false,
      error: "Please provide a website URL, or select 'No website'.",
    };
  }

  const validSectors: IndustrySector[] = [
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
  const validRanges: EmployeeCountRange[] = [
    "RANGE_1_10",
    "RANGE_11_50",
    "RANGE_51_200",
    "RANGE_200_PLUS",
  ];

  if (!validSectors.includes(industrySector as IndustrySector)) {
    return { success: false, error: "Invalid industry sector selected." };
  }
  if (!validRanges.includes(employeeCountRange as EmployeeCountRange)) {
    return { success: false, error: "Invalid employee count range selected." };
  }

  expectRow(
    await db
      .update(employerProfile)
      .set({
        companyName,
        industrySector: industrySector as IndustrySector,
        contactPersonName,
        designation,
        phone,
        email,
        companyAddress,
        hasWebsite,
        websiteUrl: hasWebsite ? websiteUrl : null,
        employeeCountRange: employeeCountRange as EmployeeCountRange,
        aboutCompany,
      })
      .where(eq(employerProfile.userId, session.userId))
      .returning({ id: employerProfile.id }),
    "Employer profile",
  );
}
