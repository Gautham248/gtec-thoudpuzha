import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { Role, getEffectiveRole } from "@/lib/auth";
import { RegistrationForm } from "./registration-form";

export default async function EmployerRegisterPage() {
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

  if (existing) {
    if (existing.status === "APPROVED") {
      redirect("/portal");
    }
    // PENDING or REJECTED — show status page
    redirect("/portal/employer/register/status");
  }

  return <RegistrationForm />;
}
