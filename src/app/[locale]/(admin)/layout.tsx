import { redirect } from "next/navigation";
import { requireRole, Role, type PermissionKey } from "@/lib/auth";
import { db } from "@/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { logger } from "@/lib/logger";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let authResult;
  try {
    authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  } catch (err) {
    logger.exception("admin-layout", "Auth check failed", err);
    redirect(`/${locale}/forbidden?reason=error&from=admin`);
  }
  if (!authResult.authorized) {
    logger.warn("admin-layout", "Unauthorized access attempt", {
      reason: authResult.reason,
    });
    redirect(`/${locale}/forbidden?reason=${authResult.reason}&from=admin`);
  }

  const { role, userId } = authResult;
  const isSuperAdmin = role === Role.SUPER_ADMIN;

  let permissions: Partial<Record<PermissionKey, boolean>> = {};
  if (!isSuperAdmin) {
    try {
      const row = await db.query.staffPermission.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (row) {
        permissions = {
          canEditCourses: row.canEditCourses,
          canEditGallery: row.canEditGallery,
          canEditCertificationPartners: row.canEditCertificationPartners,
          canEditNewsEvents: row.canEditNewsEvents,
          canEditFlashNews: row.canEditFlashNews,
          canProvisionStudents: row.canProvisionStudents,
          canApproveEmployers: row.canApproveEmployers,
          canApproveJobPostings: row.canApproveJobPostings,
          canModerateSkillsTaxonomy: row.canModerateSkillsTaxonomy,
        };
      }
    } catch (err) {
      logger.exception(
        "admin-layout",
        "Failed to load staff permissions — defaulting to none",
        err,
      );
    }
  }

  return (
    <AdminShell isSuperAdmin={isSuperAdmin} permissions={permissions}>
      {children}
    </AdminShell>
  );
}
