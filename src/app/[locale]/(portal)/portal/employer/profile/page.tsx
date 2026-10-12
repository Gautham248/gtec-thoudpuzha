import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import { RegistrationForm } from "@/app/[locale]/(portal)/portal/employer/register/registration-form";
import { updateEmployerProfile } from "@/app/[locale]/(portal)/portal/employer/register/actions";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function EmployerProfilePage({
  params,
}: ProfilePageProps) {
  const { locale } = await params;
  const session = await auth();
  if (!session.userId) {
    redirect(`/${locale}/sign-in`);
  }

  const role = await getEffectiveRole(session);
  if (role !== Role.EMPLOYER) {
    redirect(`/${locale}/forbidden`);
  }

  const profile = await db.query.employerProfile.findFirst({
    where: (e, { eq }) => eq(e.userId, session.userId!),
  });

  if (!profile) {
    redirect(`/${locale}/portal/employer/register`);
  }
  if (profile.status !== "APPROVED") {
    redirect(`/${locale}/portal/employer/register/status`);
  }

  return (
    <RegistrationForm
      initialData={{
        companyName: profile.companyName,
        industrySector: profile.industrySector,
        contactPersonName: profile.contactPersonName,
        designation: profile.designation,
        phone: profile.phone,
        email: profile.email,
        companyAddress: profile.companyAddress,
        hasWebsite: profile.hasWebsite,
        websiteUrl: profile.websiteUrl,
        employeeCountRange: profile.employeeCountRange,
        aboutCompany: profile.aboutCompany,
      }}
      onSubmit={updateEmployerProfile}
    />
  );
}
