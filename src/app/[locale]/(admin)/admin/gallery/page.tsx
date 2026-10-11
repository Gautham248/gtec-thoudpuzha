import Image from "next/image";
import { redirect } from "next/navigation";
import { ChevronRight, PlayCircle, Trash2 } from "lucide-react";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  createCategory,
  updateCategory as _updateCategory,
  deleteCategory,
  moveCategory,
  addVideoItem,
  deleteGalleryItem,
} from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { getMediaUrl } from "@/lib/media";
import { GalleryToolbar } from "./gallery-toolbar";
import { UploadImagesForm } from "./upload-images-form";

interface GalleryPageProps {
  params: Promise<{ locale: string }>;
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const [categories, items] = await Promise.all([
    prisma.galleryCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.galleryItem.findMany({
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const itemsByCategory = new Map<string, typeof items>();
  for (const item of items) {
    const group = itemsByCategory.get(item.categoryId) ?? [];
    group.push(item);
    itemsByCategory.set(item.categoryId, group);
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-10">
      <h1 className="text-2xl font-semibold">Gallery</h1>

      {/* ── Categories ── */}
      <section className="rounded border border-border p-4">
        <h2 className="text-lg font-medium">Gallery Categories</h2>

        <ActionForm action={createCategory} success="Category added" resetOnSuccess className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="locale" value={locale} />
          <div>
            <label htmlFor="cat-nameEn" className="block text-sm font-medium">
              Name (English) <span className="text-destructive">*</span>
            </label>
            <input
              id="cat-nameEn"
              name="nameEn"
              required
              className="mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="cat-nameMl" className="block text-sm font-medium">
              Name (Malayalam)
            </label>
            <input
              id="cat-nameMl"
              name="nameMl"
              className="mt-1 rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit">Add Category</Button>
        </ActionForm>

        {categories.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">Order</th>
                    <th className="border border-border px-3 py-2 text-left">English</th>
                    <th className="border border-border px-3 py-2 text-left">Malayalam</th>
                    <th className="border border-border px-3 py-2 text-left">Items</th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, index) => (
                    <tr key={cat.id}>
                      <td className="border border-border px-3 py-2">
                        <div className="flex items-center gap-1">
                          <ActionForm action={moveCategory} success="Order updated">
                            <input type="hidden" name="id" value={cat.id} />
                            <input type="hidden" name="direction" value="up" />
                            <input type="hidden" name="locale" value={locale} />
                            <Button type="submit" size="icon-xs" variant="outline" disabled={index === 0} aria-label="Move up">↑</Button>
                          </ActionForm>
                          <ActionForm action={moveCategory} success="Order updated">
                            <input type="hidden" name="id" value={cat.id} />
                            <input type="hidden" name="direction" value="down" />
                            <input type="hidden" name="locale" value={locale} />
                            <Button type="submit" size="icon-xs" variant="outline" disabled={index === categories.length - 1} aria-label="Move down">↓</Button>
                          </ActionForm>
                          <span className="ml-1 text-sm">{cat.sortOrder}</span>
                        </div>
                      </td>
                      <td className="border border-border px-3 py-2 font-medium">{cat.nameEn}</td>
                      <td className="border border-border px-3 py-2">{cat.nameMl || "—"}</td>
                      <td className="border border-border px-3 py-2">{cat._count.items}</td>
                      <td className="border border-border px-3 py-2">
                        <ActionForm
                          action={deleteCategory} success="Category deleted"
                          confirmMessage={
                            cat._count.items > 0
                              ? `Delete "${cat.nameEn}" and all ${cat._count.items} items in it?`
                              : `Delete "${cat.nameEn}"?`
                          }
                        >
                          <input type="hidden" name="id" value={cat.id} />
                          <input type="hidden" name="nameEn" value={cat.nameEn} />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" size="xs" variant="destructive">Delete</Button>
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 mt-4 md:hidden">
              {categories.map((cat, index) => (
                <div key={cat.id} className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2 border-b pb-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground text-sm block leading-snug">{cat.nameEn}</span>
                      {cat.nameMl && <span className="text-sm text-muted-foreground block">{cat.nameMl}</span>}
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded bg-primary/10 px-2 py-0.5 text-sm font-semibold uppercase tracking-wider text-primary">
                      {cat._count.items} items
                    </span>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground mr-1">Order ({cat.sortOrder}):</span>
                      <ActionForm action={moveCategory} success="Order updated">
                        <input type="hidden" name="id" value={cat.id} />
                        <input type="hidden" name="direction" value="up" />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" size="icon-xs" variant="outline" disabled={index === 0}>↑</Button>
                      </ActionForm>
                      <ActionForm action={moveCategory} success="Order updated">
                        <input type="hidden" name="id" value={cat.id} />
                        <input type="hidden" name="direction" value="down" />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" size="icon-xs" variant="outline" disabled={index === categories.length - 1}>↓</Button>
                      </ActionForm>
                    </div>

                    <ActionForm
                      action={deleteCategory} success="Category deleted"
                      confirmMessage={
                        cat._count.items > 0
                          ? `Delete "${cat.nameEn}" and all ${cat._count.items} items in it?`
                          : `Delete "${cat.nameEn}"?`
                      }
                    >
                      <input type="hidden" name="id" value={cat.id} />
                      <input type="hidden" name="nameEn" value={cat.nameEn} />
                      <input type="hidden" name="locale" value={locale} />
                      <Button type="submit" size="xs" variant="destructive">Delete</Button>
                    </ActionForm>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {categories.length === 0 && (
          <p className="mt-4 text-muted-foreground">No categories yet.</p>
        )}
      </section>

      {/* ── Media management per category ── */}
      {categories.length > 0 && (
        <section aria-label="Category media" className="space-y-3">
          <GalleryToolbar total={categories.length} />

          {categories.map((cat) => {
            const catItems = itemsByCategory.get(cat.id) ?? [];
            const previewItems = catItems.filter((item) => item.mediaType === "IMAGE").slice(0, 4);

            return (
              <details
                key={cat.id}
                data-gallery-panel
                data-name={`${cat.nameEn} ${cat.nameMl ?? ""}`.toLowerCase()}
                className="group rounded-lg border border-border bg-card"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg p-4 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-medium">{cat.nameEn}</h2>
                    {cat.nameMl && (
                      <p className="truncate text-sm text-muted-foreground">{cat.nameMl}</p>
                    )}
                  </div>
                  {previewItems.length > 0 && (
                    <div className="hidden -space-x-2 sm:flex" aria-hidden>
                      {previewItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative size-9 overflow-hidden rounded-md border-2 border-card bg-muted"
                        >
                          <Image src={getMediaUrl(item.url)} alt="" fill sizes="36px" className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
                    {catItems.length} {catItems.length === 1 ? "item" : "items"}
                  </span>
                </summary>

                <div className="space-y-4 border-t border-border p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Bulk image upload */}
                    <div className="rounded border border-border bg-muted/30 p-4">
                      <h3 className="mb-2 text-sm font-medium">Upload Images</h3>
                      <UploadImagesForm categoryId={cat.id} locale={locale} />
                    </div>

                    {/* Add video URL */}
                    <div className="rounded border border-border bg-muted/30 p-4">
                      <h3 className="text-sm font-medium">Add Video URL</h3>
                      <ActionForm action={addVideoItem} success="Video added" resetOnSuccess className="mt-2 space-y-3">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="categoryId" value={cat.id} />
                        <div>
                          <label htmlFor={`vidUrl-${cat.id}`} className="text-sm font-medium">
                            External video URL <span className="text-destructive">*</span>
                          </label>
                          <input
                            id={`vidUrl-${cat.id}`}
                            name="url"
                            type="url"
                            required
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label htmlFor={`vidCapEn-${cat.id}`} className="text-sm font-medium">
                              Caption (English)
                            </label>
                            <input
                              id={`vidCapEn-${cat.id}`}
                              name="captionEn"
                              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`vidCapMl-${cat.id}`} className="text-sm font-medium">
                              Caption (Malayalam)
                            </label>
                            <input
                              id={`vidCapMl-${cat.id}`}
                              name="captionMl"
                              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <Button type="submit" size="sm" variant="secondary">Add Video</Button>
                      </ActionForm>
                    </div>
                  </div>

                  {/* Items: thumbnail grid capped in height so large categories scroll inside the panel. */}
                  {catItems.length > 0 ? (
                    <ul className="grid max-h-[28rem] grid-cols-2 gap-3 overflow-y-auto rounded border border-border p-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                      {catItems.map((item) => (
                        <li key={item.id} className="group/item relative overflow-hidden rounded-md border border-border bg-background">
                          <div className="relative aspect-square bg-muted">
                            {item.mediaType === "IMAGE" ? (
                              <Image
                                src={getMediaUrl(item.url)}
                                alt={item.captionEn ?? ""}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16vw"
                                className="object-cover"
                              />
                            ) : (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted-foreground hover:text-foreground"
                              >
                                <PlayCircle className="size-8" />
                                <span className="line-clamp-2 break-all">{item.url}</span>
                              </a>
                            )}
                            <ActionForm
                              action={deleteGalleryItem}
                              success="Item deleted"
                              confirmMessage="Delete this item?"
                              className="absolute right-1.5 top-1.5 transition-opacity md:opacity-0 md:group-hover/item:opacity-100 md:group-focus-within/item:opacity-100"
                            >
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <Button type="submit" size="icon-xs" variant="destructive" aria-label="Delete item">
                                <Trash2 />
                              </Button>
                            </ActionForm>
                          </div>
                          <p className="truncate px-2 py-1.5 text-xs" title={item.captionEn ?? undefined}>
                            {item.captionEn || <span className="text-muted-foreground">No caption</span>}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items yet.</p>
                  )}
                </div>
              </details>
            );
          })}
        </section>
      )}
    </main>
  );
}
