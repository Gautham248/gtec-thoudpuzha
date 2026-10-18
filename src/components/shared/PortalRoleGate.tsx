import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Role, requirePortalRole } from "@/lib/auth";

const ROLE_LABELS: Record<Role, string> = {
  [Role.STUDENT]: "Student",
  [Role.JOB_SEEKER]: "Job Seeker",
  [Role.EMPLOYER]: "Employer",
  [Role.CENTRE_STAFF]: "Centre Staff",
  [Role.SUPER_ADMIN]: "Super Admin",
};

function NotYourAccountType({
  allowedRoleNames,
}: {
  allowedRoleNames: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">
          This area isn&apos;t for your account type
        </h1>
        <p className="mt-2 text-muted-foreground">
          This section is intended for {allowedRoleNames} accounts. Please use
          the appropriate portal for your account type.
        </p>
        <Link
          href="/portal"
          className="mt-4 inline-block text-primary underline"
        >
          Go to Portal Dashboard
        </Link>
      </div>
    </div>
  );
}

interface PortalRoleGateProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export async function PortalRoleGate({
  allowedRoles,
  children,
}: PortalRoleGateProps) {
  const result = await requirePortalRole(allowedRoles);

  if (!result.authorized) {
    if (result.reason === "unauthenticated") {
      redirect("/sign-in");
    }
    if (result.reason === "no_role") {
      redirect("/account-setup-incomplete");
    }

    const roleNames = allowedRoles.map((r) => ROLE_LABELS[r]).join(" / ");
    return <NotYourAccountType allowedRoleNames={roleNames} />;
  }

  return <>{children}</>;
}
