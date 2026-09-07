import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { uploadResource, updateResource, deleteResource } from "./actions";

interface Props {
  params: Promise<{ locale: string }>;
}

const RESOURCE_TYPES = ["NOTE", "ASSIGNMENT", "PAST_PAPER", "LECTURE"] as const;
const TYPE_LABELS: Record<string, string> = {
  NOTE: "Study Notes",
  ASSIGNMENT: "Assignments",
  PAST_PAPER: "Past Papers",
  LECTURE: "Video Lectures",
};

export default async function AcademicResourcesPage({ params }: Props) {
  const { locale } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const [courses, resources] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { titleEn: "asc" },
      select: { id: true, titleEn: true },
    }),
    prisma.academicResource.findMany({
      orderBy: { uploadedAt: "desc" },
      include: { course: { select: { titleEn: true } } },
    }),
  ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-10">
      <h1 className="text-2xl font-semibold">Academic Resources</h1>

      <section className="rounded border border-border p-4">
        <h2 className="text-lg font-medium">Upload Resource</h2>
        <form action={uploadResource} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={locale} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="ar-courseId" className="text-sm font-medium">
                Course <span className="text-destructive">*</span>
              </label>
              <select
                id="ar-courseId"
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

            <div className="space-y-1">
              <label htmlFor="ar-type" className="text-sm font-medium">
                Resource Type <span className="text-destructive">*</span>
              </label>
              <select
                id="ar-type"
                name="type"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">— Select Type —</option>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="ar-title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="ar-title"
                name="title"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="ar-fileUrl" className="text-sm font-medium">
                File URL (link to resource)
              </label>
              <input
                id="ar-fileUrl"
                name="fileUrl"
                type="url"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="ar-embedUrl" className="text-sm font-medium">
                Video URL (for Video Lectures — YouTube/Vimeo)
              </label>
              <input
                id="ar-embedUrl"
                name="embedUrl"
                type="url"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>

          <Button type="submit">Upload Resource</Button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">All Resources</h2>
        {resources.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">Title</th>
                    <th className="border border-border px-3 py-2 text-left">Type</th>
                    <th className="border border-border px-3 py-2 text-left">Course</th>
                    <th className="border border-border px-3 py-2 text-left">Uploaded</th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr key={r.id}>
                      <td className="border border-border px-3 py-2 font-medium">
                        {r.type === "LECTURE" && r.embedUrl ? (
                          <a
                            href={r.embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            {r.title}
                          </a>
                        ) : r.fileUrl ? (
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            {r.title}
                          </a>
                        ) : (
                          r.title
                        )}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {TYPE_LABELS[r.type] || r.type}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {r.course.titleEn}
                      </td>
                      <td className="border border-border px-3 py-2 text-sm font-mono">
                        {r.uploadedAt.toISOString().slice(0, 10)}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <details className="relative">
                            <summary className="cursor-pointer text-sm text-primary font-medium">Edit</summary>
                            <form action={updateResource} className="absolute right-0 top-6 z-20 w-72 rounded border border-border bg-card p-3 shadow-lg space-y-2 text-left">
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Title *</label>
                                <input name="title" defaultValue={r.title} required className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Type *</label>
                                <select name="type" defaultValue={r.type} className="w-full rounded border border-border px-2 py-1 text-sm bg-background">
                                  {RESOURCE_TYPES.map((t) => (
                                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">File URL</label>
                                <input name="fileUrl" type="url" defaultValue={r.fileUrl ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Video Embed URL (Lectures)</label>
                                <input name="embedUrl" type="url" defaultValue={r.embedUrl ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <Button type="submit" size="xs" className="w-full">Save Changes</Button>
                            </form>
                          </details>
                          <form action={deleteResource}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="locale" value={locale} />
                            <Button type="submit" size="xs" variant="destructive">
                              Delete
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 mt-4 md:hidden">
              {resources.map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2 border-b pb-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground text-sm block leading-snug">
                        {r.type === "LECTURE" && r.embedUrl ? (
                          <a href={r.embedUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            {r.title}
                          </a>
                        ) : r.fileUrl ? (
                          <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            {r.title}
                          </a>
                        ) : (
                          r.title
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">{r.course.titleEn}</span>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded bg-primary/10 px-2 py-0.5 text-sm font-semibold uppercase tracking-wider text-primary">
                      {TYPE_LABELS[r.type] || r.type}
                    </span>
                  </div>

                  <div className="text-sm flex justify-between text-muted-foreground">
                    <span>Uploaded:</span>
                    <span className="font-mono text-foreground">{r.uploadedAt.toISOString().slice(0, 10)}</span>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <form action={deleteResource} className="w-full">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <Button type="submit" size="xs" variant="destructive" className="w-full">
                        Delete Resource
                      </Button>
                    </form>

                    <details className="pt-1 border-t">
                      <summary className="cursor-pointer text-sm font-medium text-primary py-1">Edit</summary>
                      <form action={updateResource} className="mt-2 space-y-2.5 border border-border rounded p-3 bg-muted/20 text-left">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                          <input name="title" defaultValue={r.title} required className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Type *</label>
                          <select name="type" defaultValue={r.type} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background">
                            {RESOURCE_TYPES.map((t) => (
                              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">File URL</label>
                          <input name="fileUrl" type="url" defaultValue={r.fileUrl ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Video Embed URL (Lectures)</label>
                          <input name="embedUrl" type="url" defaultValue={r.embedUrl ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <Button type="submit" size="xs" className="w-full">Save Changes</Button>
                      </form>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">No resources uploaded yet.</p>
        )}
      </section>
    </main>
  );
}
