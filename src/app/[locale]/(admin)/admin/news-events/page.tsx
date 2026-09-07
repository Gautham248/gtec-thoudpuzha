import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteForm } from "./confirm-delete-form";
import {
  createNewsEvent,
  updateNewsEvent,
  deleteNewsEvent,
  togglePublishNewsEvent,
} from "./actions";

interface NewsEventsPageProps {
  params: Promise<{ locale: string }>;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export default async function NewsEventsPage({
  params,
}: NewsEventsPageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const items = await prisma.newsEvent.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">News &amp; Events</h1>

      <section className="mt-6 rounded border border-border p-4">
        <h2 className="text-lg font-medium">Create new item</h2>
        <form action={createNewsEvent} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="type" className="text-sm font-medium">
                Type <span className="text-destructive">*</span>
              </label>
              <select
                id="type"
                name="type"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="NEWS">News</option>
                <option value="EVENT">Event</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="titleEn" className="text-sm font-medium">
                Title (English) <span className="text-destructive">*</span>
              </label>
              <input
                id="titleEn"
                name="titleEn"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="titleMl" className="text-sm font-medium">
                Title (Malayalam)
              </label>
              <input
                id="titleMl"
                name="titleMl"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="eventDate" className="text-sm font-medium">
                Event date
              </label>
              <input
                id="eventDate"
                name="eventDate"
                type="datetime-local"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="coverImageUrl" className="text-sm font-medium">
                Cover image URL
              </label>
              <input
                id="coverImageUrl"
                name="coverImageUrl"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="publishNow" />
                Publish immediately
              </label>
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="bodyEn" className="text-sm font-medium">
              Body (English) <span className="text-destructive">*</span>
            </label>
            <textarea
              id="bodyEn"
              name="bodyEn"
              required
              rows={4}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="bodyMl" className="text-sm font-medium">
              Body (Malayalam)
            </label>
            <textarea
              id="bodyMl"
              name="bodyMl"
              rows={4}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">All items</h2>
        {items.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">Type</th>
                    <th className="border border-border px-3 py-2 text-left">Title (EN)</th>
                    <th className="border border-border px-3 py-2 text-left">Status</th>
                    <th className="border border-border px-3 py-2 text-left">Event date</th>
                    <th className="border border-border px-3 py-2 text-left">Published</th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-border px-3 py-2">
                        {item.type === "NEWS" ? "News" : "Event"}
                      </td>
                      <td className="border border-border px-3 py-2">{item.titleEn}</td>
                      <td className="border border-border px-3 py-2">
                        {item.publishedAt ? (
                          <span className="text-primary font-medium">Published</span>
                        ) : (
                          <span className="text-muted-foreground">Draft</span>
                        )}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {formatDate(item.eventDate)}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {formatDate(item.publishedAt)}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <form action={togglePublishNewsEvent}>
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              type="hidden"
                              name="publish"
                              value={String(!item.publishedAt)}
                            />
                            <input type="hidden" name="locale" value={locale} />
                            <Button
                              type="submit"
                              size="xs"
                              variant={item.publishedAt ? "outline" : "default"}
                            >
                              {item.publishedAt ? "Unpublish" : "Publish"}
                            </Button>
                          </form>
                          <details className="relative">
                            <summary className="cursor-pointer text-sm text-primary font-medium">Edit</summary>
                            <form action={updateNewsEvent} className="absolute right-0 top-6 z-20 w-80 rounded border border-border bg-card p-3 shadow-lg space-y-2 text-left">
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Type *</label>
                                <select name="type" defaultValue={item.type} className="w-full rounded border border-border px-2 py-1 text-sm bg-background">
                                  <option value="NEWS">News</option>
                                  <option value="EVENT">Event</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Title (English) *</label>
                                <input name="titleEn" defaultValue={item.titleEn} required className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Title (Malayalam)</label>
                                <input name="titleMl" defaultValue={item.titleMl ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Event Date</label>
                                <input name="eventDate" type="datetime-local" defaultValue={item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 16) : ""} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Body (English) *</label>
                                <textarea name="bodyEn" defaultValue={item.bodyEn} required rows={3} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Body (Malayalam)</label>
                                <textarea name="bodyMl" defaultValue={item.bodyMl ?? ""} rows={3} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Cover Image URL</label>
                                <input name="coverImageUrl" defaultValue={item.coverImageUrl ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <Button type="submit" size="xs" className="w-full">Save Changes</Button>
                            </form>
                          </details>
                          <ConfirmDeleteForm
                            action={deleteNewsEvent}
                            confirmMessage="Delete this item?"
                          >
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="locale" value={locale} />
                            <Button
                              type="submit"
                              size="xs"
                              variant="destructive"
                            >
                              Delete
                            </Button>
                          </ConfirmDeleteForm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="space-y-3 mt-4 md:hidden">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2 border-b pb-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground text-sm block leading-snug">{item.titleEn}</span>
                    </div>
                    <span className={`shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-sm font-semibold uppercase tracking-wider ${item.publishedAt ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {item.publishedAt ? "Published" : "Draft"}
                    </span>
                  </div>

                  <div className="text-sm space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Type:</span>
                      <span className="text-foreground">{item.type === "NEWS" ? "News" : "Event"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Event Date:</span>
                      <span className="font-mono text-foreground">{formatDate(item.eventDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Published At:</span>
                      <span className="font-mono text-foreground">{formatDate(item.publishedAt)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <form action={togglePublishNewsEvent} className="flex-1">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="publish" value={String(!item.publishedAt)} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button
                          type="submit"
                          size="xs"
                          variant={item.publishedAt ? "outline" : "default"}
                          className="w-full"
                        >
                          {item.publishedAt ? "Unpublish" : "Publish"}
                        </Button>
                      </form>

                      <ConfirmDeleteForm
                        action={deleteNewsEvent}
                        confirmMessage="Delete this item?"
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button
                          type="submit"
                          size="xs"
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      </ConfirmDeleteForm>
                    </div>

                    <details className="pt-1 border-t">
                      <summary className="cursor-pointer text-sm font-medium text-primary py-1">Edit</summary>
                      <form action={updateNewsEvent} className="mt-2 space-y-2.5 border border-border rounded p-3 bg-muted/20 text-left">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Type *</label>
                          <select name="type" defaultValue={item.type} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background">
                            <option value="NEWS">News</option>
                            <option value="EVENT">Event</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Title (English) *</label>
                          <input name="titleEn" defaultValue={item.titleEn} required className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Title (Malayalam)</label>
                          <input name="titleMl" defaultValue={item.titleMl ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Event Date</label>
                          <input name="eventDate" type="datetime-local" defaultValue={item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 16) : ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Body (English) *</label>
                          <textarea name="bodyEn" defaultValue={item.bodyEn} required rows={3} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Body (Malayalam)</label>
                          <textarea name="bodyMl" defaultValue={item.bodyMl ?? ""} rows={3} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Cover Image URL</label>
                          <input name="coverImageUrl" defaultValue={item.coverImageUrl ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
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
          <p className="mt-4 text-muted-foreground">No news or events yet.</p>
        )}
      </section>
    </main>
  );
}
