import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

interface StudentDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { locale, id } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const record = await prisma.studentRecord.findUnique({
    where: { id },
  });

  if (!record) {
    redirect(`/${locale}/admin/students`);
  }

  // Find associated CandidateProfile either via record.linkedUserId or studentRecordId
  const candidate = await prisma.candidateProfile.findFirst({
    where: {
      OR: [
        { studentRecordId: record.id },
        ...(record.linkedUserId ? [{ userId: record.linkedUserId }] : []),
      ],
    },
    include: {
      enrollments: {
        include: { course: { select: { titleEn: true } } },
        orderBy: { enrolledAt: "desc" },
      },
      progressEntries: {
        include: { course: { select: { titleEn: true } } },
        orderBy: { recordedAt: "desc" },
      },
    },
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div className="min-w-0 flex-1">
          <Link
            href={`/${locale}/admin/students`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2 font-medium"
          >
            ← Back to Students
          </Link>
          <h1 className="text-2xl font-bold text-foreground break-words">{record.fullName}</h1>
          <p className="text-sm font-mono text-muted-foreground">ID: {record.studentId}</p>
        </div>
        <span
          className={`shrink-0 whitespace-nowrap self-start sm:self-auto rounded px-2.5 py-1 text-sm font-semibold uppercase tracking-wider ${
            record.linkedUserId
              ? "bg-primary/10 text-primary"
              : !record.email
              ? "bg-accent/10 text-accent"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {record.linkedUserId ? "Verified Student" : !record.email ? "Blocked (No Email)" : "Pending Verification"}
        </span>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xs min-w-0">
        <h2 className="text-lg font-semibold border-b pb-2 text-foreground">Contact & Identification</h2>
        <div className="grid gap-4 sm:grid-cols-2 text-sm min-w-0">
          <div className="min-w-0">
            <span className="text-muted-foreground block text-sm font-medium">Full Name</span>
            <span className="font-medium text-foreground break-words">{record.fullName}</span>
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground block text-sm font-medium">Student ID</span>
            <span className="font-mono text-foreground break-all">{record.studentId}</span>
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground block text-sm font-medium">Phone Number</span>
            <a href={`tel:${record.phone}`} className="text-primary font-mono hover:underline break-all block">{record.phone}</a>
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground block text-sm font-medium">Email Address</span>
            <span className="font-mono text-foreground break-all block">{record.email || "Not provided"}</span>
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground block text-sm font-medium">Created On</span>
            <span className="text-foreground">{new Date(record.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground block text-sm font-medium">Linked Account ID</span>
            <span className="font-mono text-sm text-foreground break-all block">{record.linkedUserId || "None"}</span>
          </div>
        </div>
      </section>

      {candidate && (
        <>
          <section className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xs min-w-0">
            <h2 className="text-lg font-semibold border-b pb-2 text-foreground">Profile Details</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm min-w-0">
              <div className="min-w-0">
                <span className="text-muted-foreground block text-sm font-medium">Educational Qualification</span>
                <span className="text-foreground break-words">{candidate.educationalQualification || "—"}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground block text-sm font-medium">Year of Passing</span>
                <span className="text-foreground">{candidate.yearOfPassing || "—"}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground block text-sm font-medium">Address</span>
                <span className="text-foreground break-words">{candidate.address || "—"}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground block text-sm font-medium">Preferred Job Location</span>
                <span className="text-foreground break-words">{candidate.preferredJobLocation || "—"}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground block text-sm font-medium">Preferred Job Type</span>
                <span className="text-foreground">{candidate.preferredJobType || "—"}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground block text-sm font-medium">Languages Known</span>
                <span className="text-foreground break-words">{candidate.languagesKnown.join(", ") || "—"}</span>
              </div>
            </div>
            {candidate.careerObjective && (
              <div className="pt-2 border-t text-sm min-w-0">
                <span className="text-muted-foreground block text-sm font-medium">Career Objective</span>
                <p className="mt-1 text-foreground break-words">{candidate.careerObjective}</p>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xs min-w-0">
            <h2 className="text-lg font-semibold border-b pb-2 text-foreground">Enrolled Courses ({candidate.enrollments.length})</h2>
            {candidate.enrollments.length > 0 ? (
              <div className="space-y-2">
                {candidate.enrollments.map((e) => (
                  <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-3 rounded border border-border bg-muted/20 text-sm min-w-0">
                    <span className="font-medium text-foreground leading-snug break-words">{e.course.titleEn}</span>
                    <span className="text-sm text-muted-foreground shrink-0 whitespace-nowrap">Enrolled: {new Date(e.enrolledAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No course enrollments found.</p>
            )}
          </section>
        </>
      )}

      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link href={`/${locale}/admin/students`} className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">← Back to All Students</Button>
        </Link>
        {candidate && (
          <Link href={`/${locale}/admin/students/course-enrollment?studentProfileId=${encodeURIComponent(candidate.id)}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Manage Course Enrollments →</Button>
          </Link>
        )}
      </div>
    </main>
  );
}
