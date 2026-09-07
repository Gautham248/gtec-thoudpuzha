import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface EnquiriesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function EnquiriesPage({ params }: EnquiriesPageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        select: { titleEn: true },
      },
    },
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">Enquiries</h1>

      <section className="mt-6">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-3 py-2 text-left">
                  Name
                </th>
                <th className="border border-border px-3 py-2 text-left">
                  Phone
                </th>
                <th className="border border-border px-3 py-2 text-left">
                  Course
                </th>
                <th className="border border-border px-3 py-2 text-left">
                  Source
                </th>
                <th className="border border-border px-3 py-2 text-left">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td className="border border-border px-3 py-2">
                    {enquiry.name}
                  </td>
                  <td className="border border-border px-3 py-2">
                    {enquiry.phone}
                  </td>
                  <td className="border border-border px-3 py-2">
                    {enquiry.course?.titleEn || "—"}
                  </td>
                  <td className="border border-border px-3 py-2">
                    {enquiry.source}
                  </td>
                  <td className="border border-border px-3 py-2">
                    {enquiry.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Stack */}
        <div className="space-y-3 md:hidden">
          {enquiries.map((enquiry) => (
            <div key={enquiry.id} className="rounded-lg border border-border bg-card p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-semibold text-foreground">{enquiry.name}</span>
                <span className="text-sm text-muted-foreground">{new Date(enquiry.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-sm space-y-1.5 text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Phone:</span>
                  <a href={`tel:${enquiry.phone}`} className="text-primary font-mono hover:underline">{enquiry.phone}</a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Course:</span>
                  <span className="text-foreground text-right">{enquiry.course?.titleEn || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Source:</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-sm text-secondary-foreground font-medium">{enquiry.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {enquiries.length === 0 && (
          <p className="mt-4 text-muted-foreground">No enquiries yet.</p>
        )}
      </section>
    </main>
  );
}
