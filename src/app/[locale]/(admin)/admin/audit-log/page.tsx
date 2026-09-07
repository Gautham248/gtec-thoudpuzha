import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface AuditLogPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AuditLogPage({ params }: AuditLogPageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const entries = await prisma.auditLogEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
      {entries.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto mt-4">
            <table className="w-full min-w-[800px] border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-3 py-2 text-left">Time</th>
                  <th className="border border-border px-3 py-2 text-left">Actor</th>
                  <th className="border border-border px-3 py-2 text-left">Role</th>
                  <th className="border border-border px-3 py-2 text-left">Action</th>
                  <th className="border border-border px-3 py-2 text-left">Entity</th>
                  <th className="border border-border px-3 py-2 text-left">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="border border-border px-3 py-2 text-sm font-mono whitespace-nowrap">
                      {entry.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                    </td>
                    <td className="border border-border px-3 py-2 text-sm font-mono break-all max-w-[150px]">
                      {entry.actorUserId}
                    </td>
                    <td className="border border-border px-3 py-2 text-sm">
                      {entry.actorRole}
                    </td>
                    <td className="border border-border px-3 py-2 font-medium">
                      {entry.action}
                    </td>
                    <td className="border border-border px-3 py-2 text-sm font-mono break-all max-w-[150px]">
                      {entry.entityType}:{entry.entityId}
                    </td>
                    <td className="border border-border px-3 py-2 text-sm font-mono max-w-[200px] truncate">
                      {entry.metadata
                        ? JSON.stringify(entry.metadata)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 mt-4 md:hidden">
            {entries.map((entry) => (
              <div key={entry.id} className="w-full overflow-hidden rounded-lg border border-border bg-card p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2 gap-2">
                  <span className="font-semibold text-foreground text-sm break-all">{entry.action}</span>
                  <span className="text-sm font-mono text-muted-foreground shrink-0">{entry.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
                </div>

                <div className="text-sm space-y-1 text-muted-foreground">
                  <div className="flex justify-between items-start gap-2">
                    <span className="shrink-0 font-medium">Actor:</span>
                    <span className="font-mono text-foreground break-all text-right">{entry.actorUserId} ({entry.actorRole})</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="shrink-0 font-medium">Target Entity:</span>
                    <span className="font-mono text-foreground break-all text-right">{entry.entityType}:{entry.entityId}</span>
                  </div>
                  {entry.metadata && (
                    <div className="pt-1">
                      <span className="block font-medium text-foreground">Metadata:</span>
                      <pre className="mt-1 bg-muted p-2 rounded text-sm max-w-full overflow-x-auto whitespace-pre-wrap break-all font-mono">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-4 text-muted-foreground">No audit entries logged.</p>
      )}
    </main>
  );
}
