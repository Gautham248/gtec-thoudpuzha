import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { inviteStaff, deactivateStaff, reactivateStaff, setStaffPermission } from "./actions";
import { PERMISSION_KEYS, PERMISSION_LABELS } from "./permissions";

interface StaffPageProps {
  params: Promise<{ locale: string }>;
}

export default async function StaffPage({ params }: StaffPageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const staff = await prisma.user.findMany({
    where: {
      role: { in: [Role.CENTRE_STAFF, Role.SUPER_ADMIN] },
    },
    orderBy: { createdAt: "desc" },
    include: { staffPermission: true },
  });

  return (
    <main className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>

      {/* Invite Staff */}
      <section className="rounded border border-border p-4 bg-card">
        <h2 className="text-lg font-medium">Invite Staff</h2>
        <form action={inviteStaff} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <input type="hidden" name="locale" value={locale} />
          <div className="flex-1">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address <span className="text-destructive">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <Button type="submit" size="sm" className="w-full sm:w-auto">Send Invite</Button>
        </form>
      </section>

      {/* Staff List */}
      <section>
        <h2 className="text-lg font-medium">All Staff</h2>
        {staff.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">User ID</th>
                    <th className="border border-border px-3 py-2 text-left">Role</th>
                    <th className="border border-border px-3 py-2 text-left">Status</th>
                    <th className="border border-border px-3 py-2 text-left">Created</th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((user) => (
                    <tr key={user.id}>
                      <td className="border border-border px-3 py-2 font-mono text-sm break-all">
                        {user.id}
                      </td>
                      <td className="border border-border px-3 py-2">{user.role}</td>
                      <td className="border border-border px-3 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${
                            user.deactivatedAt
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {user.deactivatedAt ? "Deactivated" : "Active"}
                        </span>
                      </td>
                      <td className="border border-border px-3 py-2 text-sm">
                        {user.createdAt.toISOString().slice(0, 10)}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {user.role === Role.CENTRE_STAFF && (
                          <>
                            {user.deactivatedAt ? (
                              <form action={reactivateStaff} className="inline">
                                <input type="hidden" name="userId" value={user.id} />
                                <input type="hidden" name="locale" value={locale} />
                                <Button type="submit" size="xs" variant="outline">
                                  Reactivate
                                </Button>
                              </form>
                            ) : (
                              <form action={deactivateStaff} className="inline">
                                <input type="hidden" name="userId" value={user.id} />
                                <input type="hidden" name="locale" value={locale} />
                                <Button type="submit" size="xs" variant="destructive">
                                  Deactivate
                                </Button>
                              </form>
                            )}
                          </>
                        )}
                        {user.role === Role.SUPER_ADMIN && (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 mt-4 md:hidden">
              {staff.map((user) => (
                <div key={user.id} className="w-full overflow-hidden rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-2 gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-sm font-semibold text-foreground block break-all">{user.id}</span>
                      <span className="text-sm text-muted-foreground">{user.role}</span>
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-sm font-semibold uppercase tracking-wider ${
                        user.deactivatedAt
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {user.deactivatedAt ? "Deactivated" : "Active"}
                    </span>
                  </div>

                  <div className="text-sm flex justify-between text-muted-foreground">
                    <span>Joined:</span>
                    <span className="font-mono text-foreground">{user.createdAt.toISOString().slice(0, 10)}</span>
                  </div>

                  {user.role === Role.CENTRE_STAFF && (
                    <div className="pt-2 border-t">
                      {user.deactivatedAt ? (
                        <form action={reactivateStaff} className="w-full">
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" size="xs" variant="outline" className="w-full">
                            Reactivate Staff
                          </Button>
                        </form>
                      ) : (
                        <form action={deactivateStaff} className="w-full">
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" size="xs" variant="destructive" className="w-full">
                            Deactivate Staff
                          </Button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">No staff found.</p>
        )}
      </section>

      {/* Permission Grid */}
      {staff.filter(u => u.role === Role.CENTRE_STAFF).length > 0 && (
        <section>
          <h2 className="text-lg font-medium">Staff Permissions</h2>
          
          {/* Desktop Permissions Table */}
          <div className="hidden md:block mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-3 py-2 text-left">Staff</th>
                  {PERMISSION_KEYS.map((key) => (
                    <th
                      key={key}
                      className="border border-border px-3 py-2 text-left text-sm font-medium"
                    >
                      {PERMISSION_LABELS[key]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff
                  .filter((u) => u.role === Role.CENTRE_STAFF && !u.deactivatedAt)
                  .map((user) => (
                    <tr key={user.id}>
                      <td className="border border-border px-3 py-2 font-mono text-sm break-all">
                        {user.id}
                      </td>
                      {PERMISSION_KEYS.map((key) => {
                        const currentValue =
                          user.staffPermission?.[key as keyof typeof user.staffPermission] ?? false;
                        return (
                          <td
                            key={key}
                            className="border border-border px-3 py-2 text-center"
                          >
                            <form action={setStaffPermission} className="inline">
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="permissionKey" value={key} />
                              <input
                                type="hidden"
                                name="value"
                                value={(!currentValue).toString()}
                              />
                              <button
                                type="submit"
                                className={`rounded px-2 py-1 text-sm font-medium ${
                                  currentValue
                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                    : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                }`}
                              >
                                {currentValue ? "ON" : "OFF"}
                              </button>
                            </form>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Permissions Cards */}
          <div className="space-y-4 mt-4 md:hidden">
            {staff
              .filter((u) => u.role === Role.CENTRE_STAFF && !u.deactivatedAt)
              .map((user) => (
                <div key={user.id} className="w-full overflow-hidden rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="border-b pb-2">
                    <span className="font-mono text-sm font-semibold text-foreground block break-all">{user.id}</span>
                    <span className="text-sm text-muted-foreground">Permission Matrix</span>
                  </div>

                  <div className="space-y-2">
                    {PERMISSION_KEYS.map((key) => {
                      const currentValue =
                        user.staffPermission?.[key as keyof typeof user.staffPermission] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                          <span className="text-sm text-foreground font-medium">{PERMISSION_LABELS[key]}</span>
                          <form action={setStaffPermission}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="permissionKey" value={key} />
                            <input
                              type="hidden"
                              name="value"
                              value={(!currentValue).toString()}
                            />
                            <button
                              type="submit"
                              className={`rounded px-3 py-1 text-sm font-medium ${
                                currentValue
                                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                                  : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              }`}
                            >
                              {currentValue ? "ON" : "OFF"}
                            </button>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </main>
  );
}
