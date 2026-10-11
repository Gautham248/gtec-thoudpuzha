import { redirect } from "next/navigation";
import { requireRole, requirePermission, StaffPermissionKeys, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { EmployerProfileStatus } from "@prisma/client";
import {
  approveEmployer,
  rejectEmployer,
  approveAndTrustEmployer,
  toggleAutoPublishTrusted,
} from "./actions";
import { ActionForm } from "@/components/admin/action-form";

interface EmployersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default async function EmployersPage({
  params,
  searchParams,
}: EmployersPageProps) {
  const { locale } = await params;
  const { status: filterStatus } = await searchParams;

  const authResult = await requireRole([
    Role.CENTRE_STAFF,
    Role.SUPER_ADMIN,
  ]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const permResult = await requirePermission(StaffPermissionKeys.canApproveEmployers);
  const canApprove = permResult.authorized;

  const where =
    filterStatus && ["PENDING", "APPROVED", "REJECTED"].includes(filterStatus)
      ? { status: filterStatus as EmployerProfileStatus }
      : {};

  const employers = await prisma.employerProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const statuses = ["PENDING", "APPROVED", "REJECTED"];

  return (
    <main className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Employer Registrations</h1>

      {/* Status filter */}
      <section className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">Filter:</span>
        <a
          href={`/${locale}/admin/employers`}
          className={`rounded px-3 py-1 text-sm font-medium ${!filterStatus ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          All
        </a>
        {statuses.map((s) => (
          <a
            key={s}
            href={`/${locale}/admin/employers?status=${s}`}
            className={`rounded px-3 py-1 text-sm font-medium ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {STATUS_LABELS[s]}
          </a>
        ))}
      </section>

      {/* Employers table */}
      <section>
        <h2 className="text-lg font-medium text-foreground">
          {employers.length} registration{employers.length !== 1 ? "s" : ""}
        </h2>

        {employers.length === 0 ? (
          <p className="mt-4 text-muted-foreground text-sm">
            No employer registrations found.
          </p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block mt-4 overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">
                      Company
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Contact Person
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Phone
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Email
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Industry
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Status
                    </th>
                    <th className="border border-border px-3 py-2 text-left">
                      Auto-Publish
                    </th>
                    {canApprove && (
                      <th className="border border-border px-3 py-2 text-left">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {employers.map((ep) => (
                    <tr key={ep.id}>
                      <td className="border border-border px-3 py-2 font-medium break-all">
                        {ep.companyName}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {ep.contactPersonName}
                      </td>
                      <td className="border border-border px-3 py-2 font-mono text-sm">
                        {ep.phone}
                      </td>
                      <td className="border border-border px-3 py-2 text-sm break-all">
                        {ep.email}
                      </td>
                      <td className="border border-border px-3 py-2 text-sm">
                        {ep.industrySector.replace(/_/g, " ")}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${
                            ep.status === "APPROVED"
                              ? "bg-primary/10 text-primary"
                              : ep.status === "REJECTED"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-accent/10 text-accent"
                          }`}
                        >
                          {STATUS_LABELS[ep.status]}
                        </span>
                        {ep.rejectionReason && (
                          <p className="mt-1 text-sm text-destructive break-all">
                            {ep.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="border border-border px-3 py-2 text-sm">
                        {ep.autoPublishTrusted ? (
                          <span className="text-primary font-medium">Trusted</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      {canApprove && (
                        <td className="border border-border px-3 py-2">
                          {ep.status === "PENDING" && (
                            <div className="flex flex-wrap gap-1">
                              <ActionForm action={approveEmployer} success="Employer approved">
                                <input type="hidden" name="locale" value={locale} />
                                <input
                                  type="hidden"
                                  name="profileId"
                                  value={ep.id}
                                />
                                <button
                                  type="submit"
                                  className="rounded bg-primary px-2 py-1 text-sm text-white hover:bg-primary/90"
                                >
                                  Approve
                                </button>
                              </ActionForm>

                              <ActionForm action={approveAndTrustEmployer} success="Employer approved and trusted">
                                <input type="hidden" name="locale" value={locale} />
                                <input
                                  type="hidden"
                                  name="profileId"
                                  value={ep.id}
                                />
                                <button
                                  type="submit"
                                  className="rounded bg-primary px-2 py-1 text-sm text-white hover:bg-primary/90"
                                >
                                  Approve + Trust
                                </button>
                              </ActionForm>

                              <details className="inline-block">
                                <summary className="cursor-pointer rounded bg-destructive px-2 py-1 text-sm text-white hover:bg-destructive/90">
                                  Reject
                                </summary>
                                <ActionForm
                                  action={rejectEmployer} success="Employer rejected"
                                  className="mt-1 flex gap-1"
                                >
                                  <input
                                    type="hidden"
                                    name="locale"
                                    value={locale}
                                  />
                                  <input
                                    type="hidden"
                                    name="profileId"
                                    value={ep.id}
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
                                </ActionForm>
                              </details>
                            </div>
                          )}

                          {ep.status === "REJECTED" && (
                            <ActionForm action={approveEmployer} success="Employer approved">
                              <input type="hidden" name="locale" value={locale} />
                              <input
                                type="hidden"
                                name="profileId"
                                value={ep.id}
                              />
                              <button
                                type="submit"
                                className="rounded bg-primary px-2 py-1 text-sm text-white hover:bg-primary/90"
                              >
                                Re-approve
                              </button>
                            </ActionForm>
                          )}

                          {ep.status === "APPROVED" && (
                            <ActionForm action={toggleAutoPublishTrusted} success="Auto-publish setting updated">
                              <input type="hidden" name="locale" value={locale} />
                              <input
                                type="hidden"
                                name="profileId"
                                value={ep.id}
                              />
                              <button
                                type="submit"
                                className={`rounded px-2 py-1 text-sm text-white ${ep.autoPublishTrusted ? "bg-accent/80 hover:bg-accent/90" : "bg-primary hover:bg-primary/90"}`}
                              >
                                {ep.autoPublishTrusted
                                  ? "Remove Trust"
                                  : "Mark Trusted"}
                              </button>
                            </ActionForm>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 mt-4 md:hidden">
              {employers.map((ep) => (
                <div key={ep.id} className="w-full overflow-hidden rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between border-b pb-2 gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground text-sm block break-all">{ep.companyName}</span>
                      <span className="text-sm text-muted-foreground">{ep.contactPersonName}</span>
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-sm font-semibold uppercase tracking-wider ${
                        ep.status === "APPROVED"
                          ? "bg-primary/10 text-primary"
                          : ep.status === "REJECTED"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-accent/10 text-accent"
                      }`}
                    >
                      {STATUS_LABELS[ep.status]}
                    </span>
                  </div>

                  <div className="text-sm space-y-1.5 text-muted-foreground">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-foreground shrink-0">Phone:</span>
                      <a href={`tel:${ep.phone}`} className="text-primary font-mono hover:underline">{ep.phone}</a>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-foreground shrink-0">Email:</span>
                      <span className="font-mono text-foreground break-all text-right">{ep.email}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-foreground shrink-0">Industry:</span>
                      <span className="text-foreground">{ep.industrySector.replace(/_/g, " ")}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-foreground shrink-0">Auto-Publish:</span>
                      {ep.autoPublishTrusted ? (
                        <span className="text-primary font-medium">Trusted</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </div>
                    {ep.rejectionReason && (
                      <div className="pt-1 text-destructive font-medium break-all">
                        Reason: {ep.rejectionReason}
                      </div>
                    )}
                  </div>

                  {canApprove && (
                    <div className="pt-2 border-t space-y-2">
                      {ep.status === "PENDING" && (
                        <>
                          <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <ActionForm action={approveEmployer} success="Employer approved" className="w-full">
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="profileId" value={ep.id} />
                              <button
                                type="submit"
                                className="w-full rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                              >
                                Approve
                              </button>
                            </ActionForm>

                            <ActionForm action={approveAndTrustEmployer} success="Employer approved and trusted" className="w-full">
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="profileId" value={ep.id} />
                              <button
                                type="submit"
                                className="w-full rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                              >
                                Approve + Trust
                              </button>
                            </ActionForm>
                          </div>

                          <details className="w-full">
                            <summary className="cursor-pointer text-center rounded bg-destructive px-3 py-1.5 text-sm font-medium text-white hover:bg-destructive/90">
                              Reject Registration
                            </summary>
                            <ActionForm action={rejectEmployer} success="Employer rejected" className="mt-2 space-y-2">
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="profileId" value={ep.id} />
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Rejection Reason *</label>
                                <input
                                  name="rejectionReason"
                                  placeholder="Specify reason..."
                                  required
                                  className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background"
                                />
                              </div>
                              <button
                                type="submit"
                                className="w-full rounded bg-destructive px-2 py-1.5 text-sm font-medium text-white hover:bg-destructive/90"
                              >
                                Submit Rejection
                              </button>
                            </ActionForm>
                          </details>
                        </>
                      )}

                      {ep.status === "REJECTED" && (
                        <ActionForm action={approveEmployer} success="Employer approved" className="w-full">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="profileId" value={ep.id} />
                          <button
                            type="submit"
                            className="w-full rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                          >
                            Re-approve Employer
                          </button>
                        </ActionForm>
                      )}

                      {ep.status === "APPROVED" && (
                        <ActionForm action={toggleAutoPublishTrusted} success="Auto-publish setting updated" className="w-full">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="profileId" value={ep.id} />
                          <button
                            type="submit"
                            className={`w-full rounded px-3 py-1.5 text-sm font-medium text-white ${ep.autoPublishTrusted ? "bg-accent/80 hover:bg-accent/90" : "bg-primary hover:bg-primary/90"}`}
                          >
                            {ep.autoPublishTrusted ? "Remove Trust Status" : "Mark as Trusted Employer"}
                          </button>
                        </ActionForm>
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
