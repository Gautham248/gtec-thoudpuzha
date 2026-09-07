import { redirect } from "next/navigation";
import { requireRole, requirePermission, StaffPermissionKeys, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { JobPostingStatus } from "@prisma/client";
import {
  approveJobPosting,
  rejectJobPosting,
  editAndApproveJobPosting,
} from "./actions";

interface JobPostingsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CLOSED: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-accent/10 text-accent",
  APPROVED: "bg-primary/10 text-primary",
  REJECTED: "bg-destructive/10 text-destructive",
  CLOSED: "bg-muted text-foreground",
  AUTO_PUBLISHED: "bg-primary/10 text-primary",
};

export default async function JobPostingsPage({
  params,
  searchParams,
}: JobPostingsPageProps) {
  const { locale } = await params;
  const { status: filterStatus } = await searchParams;

  const authResult = await requireRole([
    Role.CENTRE_STAFF,
    Role.SUPER_ADMIN,
  ]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const permResult = await requirePermission(StaffPermissionKeys.canApproveJobPostings);
  const canApprove = permResult.authorized;
  const isAutoPublishedView = filterStatus === "AUTO_PUBLISHED";

  // Determine Prisma filter
  let where: Record<string, unknown> = {};
  if (isAutoPublishedView) {
    where = { status: "APPROVED", autoPublished: true };
  } else if (
    filterStatus &&
    ["PENDING", "APPROVED", "REJECTED", "CLOSED"].includes(filterStatus)
  ) {
    where = { status: filterStatus as JobPostingStatus };
  }

  const postings = await prisma.jobPosting.findMany({
    where,
    include: { employer: true },
    orderBy: { createdAt: "desc" },
  });

  const statusFilters = ["PENDING", "APPROVED", "REJECTED", "CLOSED"];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">Job Postings Moderation</h1>

      {/* Status filter */}
      <section className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <a
          href={`/${locale}/admin/job-postings`}
          className={`rounded px-3 py-1 text-sm ${!filterStatus ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          All
        </a>
        {statusFilters.map((s) => (
          <a
            key={s}
            href={`/${locale}/admin/job-postings?status=${s}`}
            className={`rounded px-3 py-1 text-sm ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {STATUS_LABELS[s]}
          </a>
        ))}
        <a
          href={`/${locale}/admin/job-postings?status=AUTO_PUBLISHED`}
          className={`rounded px-3 py-1 text-sm ${isAutoPublishedView ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Auto-published (audit)
        </a>
      </section>

      {/* Postings table */}
      <section className="mt-6">
        <h2 className="text-lg font-medium">
          {postings.length} posting{postings.length !== 1 ? "s" : ""}
          {isAutoPublishedView ? " (auto-published — for audit)" : ""}
        </h2>

        {postings.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No job postings found.</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block mt-4 overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">
                      Title
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Company
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Job Type
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Deadline
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Status
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Auto-published
                    </th>
                    {canApprove && !isAutoPublishedView && (
                      <th className="border border-border px-3 py-2 text-left">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {postings.map((jp) => (
                    <tr key={jp.id}>
                      <td className="border border-border px-3 py-2 font-medium">
                        {jp.title}
                      </td>
                      <td className="border border-border px-3 py-2 text-sm">
                        {jp.employer.companyName}
                      </td>
                      <td className="border border-border px-3 py-2 text-sm">
                        {jp.jobType.replace(/_/g, " ")}
                      </td>
                      <td className="border border-border px-3 py-2 text-sm font-mono">
                        {new Date(jp.applicationDeadline).toLocaleDateString()}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${
                            isAutoPublishedView
                              ? STATUS_COLORS["AUTO_PUBLISHED"]
                              : STATUS_COLORS[jp.status] || STATUS_COLORS["PENDING"]
                          }`}
                        >
                          {isAutoPublishedView
                            ? "Auto-published"
                            : STATUS_LABELS[jp.status]}
                        </span>
                      </td>
                      <td className="border border-border px-3 py-2 text-sm">
                        {jp.autoPublished ? (
                          <span className="text-primary font-medium">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                        {jp.rejectionReason && (
                          <p className="mt-1 text-sm text-destructive">
                            {jp.rejectionReason}
                          </p>
                        )}
                      </td>
                      {canApprove && !isAutoPublishedView && (
                        <td className="border border-border px-3 py-2">
                          {jp.status === "PENDING" && (
                            <div className="flex flex-wrap gap-1">
                              <form action={approveJobPosting}>
                                <input type="hidden" name="locale" value={locale} />
                                <input
                                  type="hidden"
                                  name="postingId"
                                  value={jp.id}
                                />
                                <button
                                  type="submit"
                                  className="rounded bg-primary px-2 py-1 text-sm text-white hover:bg-primary/90"
                                >
                                  Approve
                                </button>
                              </form>

                              <details className="inline-block">
                                <summary className="cursor-pointer rounded bg-destructive px-2 py-1 text-sm text-white hover:bg-destructive/90">
                                  Reject
                                </summary>
                                <form
                                  action={rejectJobPosting}
                                  className="mt-1 flex gap-1"
                                >
                                  <input
                                    type="hidden"
                                    name="locale"
                                    value={locale}
                                  />
                                  <input
                                    type="hidden"
                                    name="postingId"
                                    value={jp.id}
                                  />
                                  <input
                                    name="rejectionReason"
                                    placeholder="Reason (required)"
                                    required
                                    className="w-40 rounded border border-border px-2 py-1 text-sm"
                                  />
                                  <button
                                    type="submit"
                                    className="rounded bg-destructive px-2 py-1 text-sm text-white hover:bg-destructive/90"
                                  >
                                    Submit
                                  </button>
                                </form>
                              </details>

                              <details className="inline-block">
                                <summary className="cursor-pointer rounded bg-primary px-2 py-1 text-sm text-white hover:bg-primary/90">
                                  Edit & Approve
                                </summary>
                                <form
                                  action={editAndApproveJobPosting}
                                  className="mt-1 flex flex-col gap-1"
                                >
                                  <input
                                    type="hidden"
                                    name="locale"
                                    value={locale}
                                  />
                                  <input
                                    type="hidden"
                                    name="postingId"
                                    value={jp.id}
                                  />
                                  <input
                                    name="title"
                                    defaultValue={jp.title}
                                    className="w-full rounded border border-border px-2 py-1 text-sm"
                                  />
                                  <textarea
                                    name="description"
                                    defaultValue={jp.description}
                                    className="w-full rounded border border-border px-2 py-1 text-sm"
                                    rows={2}
                                  />
                                  <div className="flex gap-1">
                                    <input
                                      name="salaryMin"
                                      type="number"
                                      defaultValue={jp.salaryMin ?? ""}
                                      placeholder="Salary min"
                                      className="w-24 rounded border border-border px-2 py-1 text-sm"
                                    />
                                    <input
                                      name="salaryMax"
                                      type="number"
                                      defaultValue={jp.salaryMax ?? ""}
                                      placeholder="Salary max"
                                      className="w-24 rounded border border-border px-2 py-1 text-sm"
                                    />
                                  </div>
                                  <button
                                    type="submit"
                                    className="rounded bg-primary px-2 py-1 text-sm text-white hover:bg-primary/90"
                                  >
                                    Save & Approve
                                  </button>
                                </form>
                              </details>
                            </div>
                          )}

                          {jp.status === "REJECTED" && (
                            <form action={approveJobPosting}>
                              <input type="hidden" name="locale" value={locale} />
                              <input
                                type="hidden"
                                name="postingId"
                                value={jp.id}
                              />
                              <button
                                type="submit"
                                className="rounded bg-primary px-2 py-1 text-sm text-white hover:bg-primary/90"
                              >
                                Re-approve
                              </button>
                            </form>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack View */}
            <div className="space-y-3 mt-4 md:hidden">
              {postings.map((jp) => (
                <div key={jp.id} className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2 border-b pb-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground text-sm block leading-snug">{jp.title}</span>
                      <span className="text-sm text-muted-foreground">{jp.employer.companyName}</span>
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-sm font-semibold uppercase tracking-wider ${
                        isAutoPublishedView
                          ? STATUS_COLORS["AUTO_PUBLISHED"]
                          : STATUS_COLORS[jp.status] || STATUS_COLORS["PENDING"]
                      }`}
                    >
                      {isAutoPublishedView
                        ? "Auto-published"
                        : STATUS_LABELS[jp.status]}
                    </span>
                  </div>

                  <div className="text-sm space-y-1.5 text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Type:</span>
                      <span className="text-foreground">{jp.jobType.replace(/_/g, " ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Deadline:</span>
                      <span className="font-mono text-foreground">{new Date(jp.applicationDeadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Auto-published:</span>
                      {jp.autoPublished ? <span className="text-primary font-medium">Yes</span> : <span>No</span>}
                    </div>
                    {jp.rejectionReason && (
                      <div className="pt-1 text-destructive font-medium">
                        Reason: {jp.rejectionReason}
                      </div>
                    )}
                  </div>

                  {canApprove && !isAutoPublishedView && (
                    <div className="pt-2 border-t flex flex-col gap-2">
                      {jp.status === "PENDING" && (
                        <>
                          <div className="flex gap-2">
                            <form action={approveJobPosting} className="flex-1">
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="postingId" value={jp.id} />
                              <button
                                type="submit"
                                className="w-full rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                              >
                                Approve
                              </button>
                            </form>
                          </div>

                          <details className="w-full">
                            <summary className="cursor-pointer text-center rounded bg-destructive px-3 py-1.5 text-sm font-medium text-white hover:bg-destructive/90">
                              Reject Job Posting
                            </summary>
                            <form action={rejectJobPosting} className="mt-2 space-y-2">
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="postingId" value={jp.id} />
                              <input
                                name="rejectionReason"
                                placeholder="Reason (required)"
                                required
                                className="w-full rounded border border-border px-2 py-1 text-sm"
                              />
                              <button
                                type="submit"
                                className="w-full rounded bg-destructive px-2 py-1 text-sm font-medium text-white hover:bg-destructive/90"
                              >
                                Submit Rejection
                              </button>
                            </form>
                          </details>

                          <details className="w-full">
                            <summary className="cursor-pointer text-center rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90">
                              Edit & Approve
                            </summary>
                            <form action={editAndApproveJobPosting} className="mt-2 space-y-2 border border-border rounded p-3 bg-muted/20">
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="postingId" value={jp.id} />
                              <div>
                                <label className="text-sm font-medium block">Title</label>
                                <input name="title" defaultValue={jp.title} className="w-full rounded border border-border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-sm font-medium block">Description</label>
                                <textarea name="description" defaultValue={jp.description} rows={2} className="w-full rounded border border-border px-2 py-1 text-sm" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input name="salaryMin" type="number" defaultValue={jp.salaryMin ?? ""} placeholder="Salary min" className="w-full rounded border border-border px-2 py-1 text-sm" />
                                <input name="salaryMax" type="number" defaultValue={jp.salaryMax ?? ""} placeholder="Salary max" className="w-full rounded border border-border px-2 py-1 text-sm" />
                              </div>
                              <button
                                type="submit"
                                className="w-full rounded bg-primary px-2 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                              >
                                Save & Approve Posting
                              </button>
                            </form>
                          </details>
                        </>
                      )}

                      {jp.status === "REJECTED" && (
                        <form action={approveJobPosting} className="w-full">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="postingId" value={jp.id} />
                          <button
                            type="submit"
                            className="w-full rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                          >
                            Re-approve Posting
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
