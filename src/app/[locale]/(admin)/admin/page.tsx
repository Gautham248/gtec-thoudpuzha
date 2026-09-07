import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole, getAllStaffPermissions, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ADMIN_ROUTES, isRouteVisible, type AdminRoute } from "@/lib/admin-routes";

interface AdminDashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboardPage({
  params,
}: AdminDashboardPageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const { userId: _userId, role } = authResult;

  const isSuperAdmin = role === Role.SUPER_ADMIN;

  // Super Admin gets all permissions; Centre Staff fetches in one query
  const permissions = isSuperAdmin
    ? ({
        canEditCourses: true,
        canEditGallery: true,
        canEditCertificationPartners: true,
        canEditNewsEvents: true,
        canEditFlashNews: true,
        canProvisionStudents: true,
        canApproveEmployers: true,
        canApproveJobPostings: true,
        canModerateSkillsTaxonomy: true,
      } as Record<string, boolean>)
    : await getAllStaffPermissions(authResult.userId);
  const { canApproveEmployers, canApproveJobPostings, canModerateSkillsTaxonomy } = permissions;

  // Fetch counts and recent enquiries in parallel
  const [pendingEmployerCount, pendingJobPostingCount, pendingSkillCount, recentEnquiries] =
    await Promise.all([
      canApproveEmployers
        ? prisma.employerProfile.count({ where: { status: "PENDING" } })
        : Promise.resolve(null),
      canApproveJobPostings
        ? prisma.jobPosting.count({ where: { status: "PENDING" } })
        : Promise.resolve(null),
      canModerateSkillsTaxonomy
        ? prisma.skill.count({ where: { status: "PENDING" } })
        : Promise.resolve(null),
      prisma.enquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          course: { select: { titleEn: true } },
        },
      }),
    ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome, {role === Role.SUPER_ADMIN ? "Super Admin" : "Staff"}
      </p>

      {/* Summary cards */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pending employers */}
        <SummaryCard
          title="Pending Employer Registrations"
          count={pendingEmployerCount}
          href={`/${locale}/admin/employers?status=PENDING`}
          hasPermission={canApproveEmployers}
        />

        {/* Pending job postings */}
        <SummaryCard
          title="Pending Job Postings"
          count={pendingJobPostingCount}
          href={`/${locale}/admin/job-postings?status=PENDING`}
          hasPermission={canApproveJobPostings}
        />

        {/* Pending skills taxonomy */}
        <SummaryCard
          title="Pending Skills Taxonomy"
          count={pendingSkillCount}
          href={`/${locale}/admin/skills-taxonomy`}
          hasPermission={canModerateSkillsTaxonomy}
        />
      </section>

      {/* Recent enquiries */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Enquiries</h2>
          <Link
            href={`/${locale}/admin/enquiries`}
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-3">
          {recentEnquiries.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground border rounded">No enquiries yet.</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded border border-border">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left text-sm font-medium">Name</th>
                      <th className="px-3 py-2 text-left text-sm font-medium">Phone</th>
                      <th className="px-3 py-2 text-left text-sm font-medium">Course</th>
                      <th className="px-3 py-2 text-left text-sm font-medium">Source</th>
                      <th className="px-3 py-2 text-left text-sm font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEnquiries.map((enquiry) => (
                      <tr key={enquiry.id} className="border-t border-border">
                        <td className="px-3 py-2 text-sm">{enquiry.name}</td>
                        <td className="px-3 py-2 text-sm">{enquiry.phone}</td>
                        <td className="px-3 py-2 text-sm">
                          {enquiry.course?.titleEn || "—"}
                        </td>
                        <td className="px-3 py-2 text-sm">{enquiry.source}</td>
                        <td className="px-3 py-2 text-sm">
                          {new Date(enquiry.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack */}
              <div className="space-y-3 md:hidden">
                {recentEnquiries.map((enquiry) => (
                  <div key={enquiry.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-sm">{enquiry.name}</span>
                      <span className="text-sm text-muted-foreground">{new Date(enquiry.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <div><span className="font-medium text-foreground">Phone:</span> <a href={`tel:${enquiry.phone}`} className="text-primary underline">{enquiry.phone}</a></div>
                      <div><span className="font-medium text-foreground">Course:</span> {enquiry.course?.titleEn || "—"}</div>
                      <div><span className="font-medium text-foreground">Source:</span> <span className="inline-block rounded bg-secondary px-2 py-0.5 text-sm text-secondary-foreground">{enquiry.source}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="mt-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${locale}/admin/students/course-enrollment`}
            className="inline-block rounded bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Manage Course Enrollments
          </Link>
          {isSuperAdmin && (
            <Link
              href={`/${locale}/admin/audit-log`}
              className="inline-block rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              View Audit Log
            </Link>
          )}
        </div>
      </section>

      {/* Module quick-link cards — all admin modules */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">All Modules</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_ROUTES.filter((r) => r.href !== "/admin").map((route) => (
            <QuickLinkCard
              key={route.href}
              route={route}
              locale={locale}
              hasPermission={isRouteVisible(route, isSuperAdmin, permissions)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  title,
  count,
  href,
  hasPermission,
}: {
  title: string;
  count: number | null;
  href: string;
  hasPermission: boolean;
}) {
  if (!hasPermission) {
    return (
      <div className="rounded border border-border bg-muted/30 p-4 opacity-60">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">No access</p>
      </div>
    );
  }

  const colorClass =
    count !== null && count > 0
      ? "border-accent/30 bg-accent/5"
      : "border-border bg-card";

  return (
    <Link href={href} className="block">
      <div
        className={`rounded border p-4 transition-shadow hover:shadow-md ${colorClass}`}
      >
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="mt-2 text-3xl font-bold">
          {count !== null ? count : "—"}
        </p>
        {count !== null && count > 0 && (
          <p className="mt-1 text-sm text-accent">Requires review</p>
        )}
      </div>
    </Link>
  );
}

function QuickLinkCard({
  route,
  locale,
  hasPermission,
}: {
  route: AdminRoute;
  locale: string;
  hasPermission: boolean;
}) {
  if (!hasPermission) {
    return (
      <div className="rounded border border-border bg-muted/30 p-4 opacity-60">
        <div className="flex items-center gap-2">
          <route.icon className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">{route.label}</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">No access</p>
      </div>
    );
  }

  return (
    <Link href={`/${locale}${route.href}`} className="block">
      <div className="rounded border border-border bg-card p-4 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-2">
          <route.icon className="size-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">{route.label}</h3>
        </div>
      </div>
    </Link>
  );
}
