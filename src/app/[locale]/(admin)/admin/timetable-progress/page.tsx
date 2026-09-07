import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  addTimetableEntry,
  deleteTimetableEntry,
  addProgressEntry,
  deleteProgressEntry,
} from "./actions";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function TimetableProgressPage({ params }: Props) {
  const { locale } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const [courses, candidates, timetableEntries, progressEntries] =
    await Promise.all([
      prisma.course.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { titleEn: "asc" },
        select: { id: true, titleEn: true },
      }),
      prisma.candidateProfile.findMany({
        orderBy: { fullName: "asc" },
        include: { user: { select: { id: true } } },
      }),
      prisma.timetableEntry.findMany({
        orderBy: { createdAt: "desc" },
        include: { course: { select: { titleEn: true } } },
      }),
      prisma.studentProgressEntry.findMany({
        orderBy: { recordedAt: "desc" },
        include: {
          course: { select: { titleEn: true } },
          studentProfile: { select: { fullName: true } },
        },
      }),
    ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-10">
      <h1 className="text-2xl font-semibold">Timetable &amp; Progress</h1>

      {/* ───── Timetable Entry ───── */}
      <section className="rounded border border-border p-4">
        <h2 className="text-lg font-medium">Add Timetable Entry</h2>
        <form action={addTimetableEntry} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={locale} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="tt-courseId" className="text-sm font-medium">
                Course <span className="text-destructive">*</span>
              </label>
              <select
                id="tt-courseId"
                name="courseId"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">— Select Course —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="contentText" className="text-sm font-medium">
              Weekly Schedule <span className="text-destructive">*</span>
            </label>
            <textarea
              id="contentText"
              name="contentText"
              required
              rows={4}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="Enter the weekly schedule / timetable content for this course..."
            />
          </div>

          <Button type="submit">Add Timetable Entry</Button>
        </form>
      </section>

      {/* ───── Timetable Entries Table ───── */}
      <section>
        <h2 className="text-lg font-medium">Timetable Entries</h2>
        {timetableEntries.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">Course</th>
                    <th className="border border-border px-3 py-2 text-left">Content</th>
                    <th className="border border-border px-3 py-2 text-left">Created</th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timetableEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="border border-border px-3 py-2 font-medium">{e.course.titleEn}</td>
                      <td className="border border-border px-3 py-2 text-sm whitespace-pre-wrap">
                        {e.contentText}
                      </td>
                      <td className="border border-border px-3 py-2 text-sm font-mono">
                        {e.createdAt.toISOString().slice(0, 10)}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <form action={deleteTimetableEntry}>
                          <input type="hidden" name="id" value={e.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" size="xs" variant="destructive">
                            Delete
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 mt-4 md:hidden">
              {timetableEntries.map((e) => (
                <div key={e.id} className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-semibold text-foreground text-sm">{e.course.titleEn}</span>
                    <span className="text-sm font-mono text-muted-foreground">{e.createdAt.toISOString().slice(0, 10)}</span>
                  </div>

                  <p className="text-sm text-foreground whitespace-pre-wrap">{e.contentText}</p>

                  <div className="pt-2 border-t flex justify-end">
                    <form action={deleteTimetableEntry} className="w-full">
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <Button type="submit" size="xs" variant="destructive" className="w-full">
                        Delete Timetable Entry
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">No timetable entries yet.</p>
        )}
      </section>

      {/* ───── Student Progress Entry ───── */}
      <section className="rounded border border-border p-4">
        <h2 className="text-lg font-medium">Add Progress Note for Student</h2>
        <form action={addProgressEntry} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={locale} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="pr-student" className="text-sm font-medium">
                Student <span className="text-destructive">*</span>
              </label>
              <select
                id="pr-student"
                name="studentProfileId"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">— Select Student —</option>
                {candidates.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.fullName ?? "Unnamed"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="pr-courseId" className="text-sm font-medium">
                Course <span className="text-destructive">*</span>
              </label>
              <select
                id="pr-courseId"
                name="courseId"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">— Select Course —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="noteEn" className="text-sm font-medium">
              Note <span className="text-destructive">*</span>
            </label>
            <textarea
              id="noteEn"
              name="noteEn"
              required
              rows={3}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="Enter progress note about this student..."
            />
          </div>

          <Button type="submit">Add Progress Note</Button>
        </form>
      </section>

      {/* ───── Progress Entries Table ───── */}
      <section>
        <h2 className="text-lg font-medium">Progress Entries</h2>
        {progressEntries.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">Student</th>
                    <th className="border border-border px-3 py-2 text-left">Course</th>
                    <th className="border border-border px-3 py-2 text-left">Note</th>
                    <th className="border border-border px-3 py-2 text-left">Recorded</th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {progressEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="border border-border px-3 py-2 font-medium">
                        {e.studentProfile.fullName ?? e.studentProfileId}
                      </td>
                      <td className="border border-border px-3 py-2">{e.course.titleEn}</td>
                      <td className="border border-border px-3 py-2 text-sm">{e.noteEn}</td>
                      <td className="border border-border px-3 py-2 text-sm font-mono">
                        {e.recordedAt.toISOString().slice(0, 10)}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <form action={deleteProgressEntry}>
                          <input type="hidden" name="id" value={e.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" size="xs" variant="destructive">
                            Delete
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 mt-4 md:hidden">
              {progressEntries.map((e) => (
                <div key={e.id} className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <span className="font-semibold text-foreground text-sm block">{e.studentProfile.fullName ?? e.studentProfileId}</span>
                      <span className="text-sm text-muted-foreground">{e.course.titleEn}</span>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">{e.recordedAt.toISOString().slice(0, 10)}</span>
                  </div>

                  <p className="text-sm text-foreground">{e.noteEn}</p>

                  <div className="pt-2 border-t flex justify-end">
                    <form action={deleteProgressEntry} className="w-full">
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <Button type="submit" size="xs" variant="destructive" className="w-full">
                        Delete Progress Entry
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">No progress entries yet.</p>
        )}
      </section>
    </main>
  );
}
