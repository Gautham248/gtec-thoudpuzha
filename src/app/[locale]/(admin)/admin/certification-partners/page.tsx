import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { getMediaUrl } from "@/lib/media";
import {
  createPartner,
  updatePartner,
  deletePartner,
  movePartner,
} from "./actions";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CertificationPartnersPage({
  params,
}: PageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const partners = await prisma.certificationPartner.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">Certification Partners</h1>

      <section className="mt-6 rounded border border-border p-4">
        <h2 className="text-lg font-medium">Add partner</h2>
        <form action={createPartner} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">
                Name (English) <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="nameMl" className="text-sm font-medium">
                Name (Malayalam)
              </label>
              <input
                id="nameMl"
                name="nameMl"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="link" className="text-sm font-medium">
                Link (optional)
              </label>
              <input
                id="link"
                name="link"
                type="url"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="logo" className="text-sm font-medium">
                Logo <span className="text-destructive">*</span>
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <Button type="submit">Add partner</Button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">All partners</h2>
        {partners.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left">Order</th>
                    <th className="border border-border px-3 py-2 text-left">Logo</th>
                    <th className="border border-border px-3 py-2 text-left">Name (EN)</th>
                    <th className="border border-border px-3 py-2 text-left">Name (ML)</th>
                    <th className="border border-border px-3 py-2 text-left">Link</th>
                    <th className="border border-border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner, index) => (
                    <tr key={partner.id}>
                      <td className="border border-border px-3 py-2">
                        <div className="flex items-center gap-1">
                          <form action={movePartner}>
                            <input type="hidden" name="id" value={partner.id} />
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
                          <form action={movePartner}>
                            <input type="hidden" name="id" value={partner.id} />
                            <input type="hidden" name="direction" value="down" />
                            <input type="hidden" name="locale" value={locale} />
                            <Button
                              type="submit"
                              size="icon-xs"
                              variant="outline"
                              disabled={index === partners.length - 1}
                              aria-label="Move down"
                            >
                              ↓
                            </Button>
                          </form>
                          <span className="ml-2 text-sm">{partner.sortOrder}</span>
                        </div>
                      </td>
                      <td className="border border-border px-3 py-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getMediaUrl(partner.logoUrl)}
                          alt={partner.name}
                          className="h-10 w-auto object-contain"
                        />
                      </td>
                      <td className="border border-border px-3 py-2 font-medium">
                        {partner.name}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {partner.nameMl || "—"}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {partner.link ? (
                          <a
                            href={partner.link}
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
                        <div className="flex items-center gap-2">
                          <details className="relative">
                            <summary className="cursor-pointer text-sm text-primary font-medium">Edit</summary>
                            <form action={updatePartner} className="absolute right-0 top-6 z-20 w-72 rounded border border-border bg-card p-3 shadow-lg space-y-2 text-left">
                              <input type="hidden" name="id" value={partner.id} />
                              <input type="hidden" name="locale" value={locale} />
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Name (English) *</label>
                                <input name="name" defaultValue={partner.name} required className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Name (Malayalam)</label>
                                <input name="nameMl" defaultValue={partner.nameMl ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">Link URL</label>
                                <input name="link" type="url" defaultValue={partner.link ?? ""} className="w-full rounded border border-border px-2 py-1 text-sm bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-0.5">New Logo (optional)</label>
                                <input name="logo" type="file" accept="image/*" className="w-full text-sm" />
                              </div>
                              <Button type="submit" size="xs" className="w-full">Save Changes</Button>
                            </form>
                          </details>
                          <form action={deletePartner}>
                            <input type="hidden" name="id" value={partner.id} />
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
              {partners.map((partner, index) => (
                <div key={partner.id} className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getMediaUrl(partner.logoUrl)}
                        alt={partner.name}
                        className="h-10 w-10 object-contain rounded border p-1 bg-background"
                      />
                      <div>
                        <span className="font-semibold text-foreground text-sm block">{partner.name}</span>
                        {partner.nameMl && <span className="text-sm text-muted-foreground block">{partner.nameMl}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm flex justify-between text-muted-foreground">
                    <span>Website Link:</span>
                    {partner.link ? (
                      <a href={partner.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {partner.link}
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground mr-1">Order ({partner.sortOrder}):</span>
                        <form action={movePartner}>
                          <input type="hidden" name="id" value={partner.id} />
                          <input type="hidden" name="direction" value="up" />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" size="icon-xs" variant="outline" disabled={index === 0}>↑</Button>
                        </form>
                        <form action={movePartner}>
                          <input type="hidden" name="id" value={partner.id} />
                          <input type="hidden" name="direction" value="down" />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" size="icon-xs" variant="outline" disabled={index === partners.length - 1}>↓</Button>
                        </form>
                      </div>

                      <form action={deletePartner}>
                        <input type="hidden" name="id" value={partner.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" size="xs" variant="destructive">
                          Delete
                        </Button>
                      </form>
                    </div>

                    <details className="pt-1 border-t">
                      <summary className="cursor-pointer text-sm font-medium text-primary py-1">Edit</summary>
                      <form action={updatePartner} className="mt-2 space-y-2.5 border border-border rounded p-3 bg-muted/20 text-left">
                        <input type="hidden" name="id" value={partner.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Name (English) *</label>
                          <input name="name" defaultValue={partner.name} required className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Name (Malayalam)</label>
                          <input name="nameMl" defaultValue={partner.nameMl ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Link URL</label>
                          <input name="link" type="url" defaultValue={partner.link ?? ""} className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">New Logo (optional)</label>
                          <input name="logo" type="file" accept="image/*" className="w-full text-sm" />
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
          <p className="mt-4 text-muted-foreground">
            No certification partners yet.
          </p>
        )}
      </section>
    </main>
  );
}
