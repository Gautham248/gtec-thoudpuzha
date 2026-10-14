import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { candidateProfile, staffPermission, user } from "@/db/schema";
import { Role } from "@/lib/auth";

export default async function CompleteSignupPage(props: {
  searchParams: Promise<{ intent?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { intent } = await props.searchParams;
  const { locale } = await props.params;
  const session = await auth();

  if (!session.userId) {
    redirect("/sign-in");
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(session.userId);
  const invitedRole = clerkUser.publicMetadata?.role as string | undefined;

  if (invitedRole === Role.CENTRE_STAFF) {
    await db
      .insert(user)
      .values({ id: session.userId, role: Role.CENTRE_STAFF })
      .onConflictDoUpdate({
        target: user.id,
        set: { role: Role.CENTRE_STAFF },
      });

    // Default permissions on first sign-in; keep existing ones untouched.
    await db
      .insert(staffPermission)
      .values({ userId: session.userId })
      .onConflictDoNothing({ target: staffPermission.userId });

    redirect(`/${locale}/admin`);
  }

  if (!intent || (intent !== "job_seeker" && intent !== "employer")) {
    redirect(`/${locale}`);
  }

  const role = intent === "job_seeker" ? "JOB_SEEKER" : "EMPLOYER";

  await client.users.updateUserMetadata(session.userId, {
    publicMetadata: { role },
  });

  await db
    .insert(user)
    .values({ id: session.userId, role })
    .onConflictDoUpdate({ target: user.id, set: { role } });

  if (intent === "job_seeker") {
    await db
      .insert(candidateProfile)
      .values({ userId: session.userId, isVerifiedStudent: false })
      .onConflictDoNothing({ target: candidateProfile.userId });
    redirect(`/${locale}/portal/student/biodata`);
  }

  redirect(`/${locale}/portal/employer/register`);
}
