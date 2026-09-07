import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  createFlashNews,
  updateFlashNews,
  deleteFlashNews,
  toggleFlashNewsActive,
  moveFlashNews,
} from "./actions";

interface FlashNewsPageProps {
  params: Promise<{ locale: string }>;
}

function formatLocalDateTime(date: Date | null): string {
  if (!date) return "";
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

export default async function FlashNewsPage({ params }: FlashNewsPageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const items = await prisma.flashNewsItem.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">Flash News</h1>

      <section className="mt-6 rounded border border-border p-4">
        <h2 className="text-lg font-medium">Create new item</h2>
        <form action={createFlashNews} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="textEn" className="text-sm font-medium">
                Text (English) <span className="text-destructive">*</span>
              </label>
              <input
                id="textEn"
                name="textEn"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="textMl" className="text-sm font-medium">
                Text (Malayalam)
              </label>
              <input
                id="textMl"
                name="textMl"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="link" className="text-sm font-medium">
                Link
              </label>
              <input
                id="link"
                name="link"
                type="url"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="expiresAt" className="text-sm font-medium">
                Expires at
              </label>
              <input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
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
                    <th className="border border-border px-3 py-2 text-left">Order</th>
                    <th className="border border-border px-3 py-2 text-left">English</th>
                    <th className="border border-border px-3 py-2 text-left">Malayalam</th>
                    <th className="border border-border px-3 py-2 text-left">Link</th>
                    <th className="border border-border px-3 py-2 text-left">Status</th>
                    <th className="border border-border px-3 py-2 text-left">Expires</th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={
                        !item.active || isExpired(item.expiresAt)
                          ? "bg-muted/50 text-muted-foreground"
                          : ""
                      }
                    >
                      <td className="border border-border px-3 py-2">
                        <div className="flex items-center gap-1">
                          <form action={moveFlashNews}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="direction" value="up" />
                            <input type="hidden" name="locale" value={locale} />
                            <Button
                              type="submit"
                              size="icon-xs"
                              variant="outline"
                              disabled={index === 0}
                              aria-label="Move up"
                            >
                              ↑
                            </Button>
                          </form>
                          <form action={moveFlashNews}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="direction" value="down" />
                            <input type="hidden" name="locale" value={locale} />
                            <Button
                              type="submit"
                              size="icon-xs"
                              variant="outline"
                              disabled={index === items.length - 1}
                              aria-label="Move down"
                            >
                              ↓
                            </Button>
                          </form>
                          <span className="ml-2 text-sm">{item.sortOrder}</span>
                        </div>
                      </td>
                      <td className="border border-border px-3 py-2">{item.textEn}</td>
                      <td className="border border-border px-3 py-2">
                        {item.textMl || "—"}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            link
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <form action={toggleFlashNewsActive}>
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="active"
                            value={String(!item.active)}
                          />
                          <input type="hidden" name="locale" value={locale} />
                          <Button
                            type="submit"
                            size="xs"
                            variant={item.active ? "default" : "outline"}
                          >
                            {item.active ? "Active" : "Inactive"}
                          </Button>
                        </form>
                      </td>
                      <td className="border border-border px-3 py-2">
                        {item.expiresAt ? (
                          <>
                            {formatLocalDateTime(item.expiresAt)}
                            {isExpired(item.expiresAt) && (
                              <span className="ml-2 text-sm text-destructive">
                                expired
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <details className="relative">
                            <summary className="cursor-pointer text-sm text-primary font-medium">Edit</summary>
                            <form action={updateFlashNews} className="absolute right-0 top-6 z-20 w-80 rounded border border-border bg-card p-3 shadow-lg space-y-2 text-left">
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Text (English) *</label>
                                <input name="textEn" defaultValue={item.textEn} required className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Text (Malayalam)</label>
                                <input name="textMl" defaultValue={item.textMl ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Link URL</label>
                                <input name="link" type="url" defaultValue={item.link ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Expires At</label>
                                <input name="expiresAt" type="datetime-local" defaultValue={item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : ""} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <label className="flex items-center gap-2 text-sm pt-1">
                                <input type="checkbox" name="active" defaultChecked={item.active} />
                                Active
                              </label>
                              <Button type="submit" size="xs" className="w-full">Save Changes</Button>
                            </form>
                          </details>
                          <form action={deleteFlashNews}>
                            <input type="hidden" name="id" value={item.id} />
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
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs ${
                    !item.active || isExpired(item.expiresAt) ? "opacity-75 bg-muted/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b pb-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground text-sm block leading-snug">{item.textEn}</span>
                      {item.textMl && <span className="text-sm text-muted-foreground block">ML: {item.textMl}</span>}
                    </div>
                    <form action={toggleFlashNewsActive} className="shrink-0">
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="active" value={String(!item.active)} />
                      <input type="hidden" name="locale" value={locale} />
                      <Button
                        type="submit"
                        size="xs"
                        variant={item.active ? "default" : "outline"}
                        className="shrink-0 whitespace-nowrap text-sm font-semibold uppercase tracking-wider"
                      >
                        {item.active ? "Active" : "Inactive"}
                      </Button>
                    </form>
                  </div>

                  <div className="text-sm space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Link:</span>
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                          {item.link}
                        </a>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Expires:</span>
                      <span className="font-mono text-foreground">
                        {item.expiresAt ? formatLocalDateTime(item.expiresAt) : "Never"}
                        {isExpired(item.expiresAt) && <span className="ml-1 text-destructive font-semibold">(expired)</span>}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground mr-1">Order ({item.sortOrder}):</span>
                        <form action={moveFlashNews}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="direction" value="up" />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" size="icon-xs" variant="outline" disabled={index === 0}>↑</Button>
                        </form>
                        <form action={moveFlashNews}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="direction" value="down" />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" size="icon-xs" variant="outline" disabled={index === items.length - 1}>↓</Button>
                        </form>
                      </div>

                      <form action={deleteFlashNews}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" size="xs" variant="destructive">
                          Delete
                        </Button>
                      </form>
                    </div>

                    <details className="pt-1 border-t">
                      <summary className="cursor-pointer text-sm font-medium text-primary py-1">Edit</summary>
                      <form action={updateFlashNews} className="mt-2 space-y-2.5 border border-border rounded p-3 bg-muted/20 text-left">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Text (English) *</label>
                          <input name="textEn" defaultValue={item.textEn} required className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Text (Malayalam)</label>
                          <input name="textMl" defaultValue={item.textMl ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Link URL</label>
                          <input name="link" type="url" defaultValue={item.link ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Expires At</label>
                          <input name="expiresAt" type="datetime-local" defaultValue={item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <label className="flex items-center gap-2 text-sm pt-1">
                          <input type="checkbox" name="active" defaultChecked={item.active} />
                          Active
                        </label>
                        <Button type="submit" size="xs" className="w-full">Save Changes</Button>
                      </form>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">No flash news items yet.</p>
        )}
      </section>
    </main>
  );
}
