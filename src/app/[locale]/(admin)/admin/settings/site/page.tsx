import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { updateSiteSettings } from "./actions";

interface SiteSettingsPageProps {
  params: Promise<{ locale: string }>;
}

const iconOptions = [
  { value: "AWARD", label: "Award" },
  { value: "USERS", label: "Users" },
  { value: "BOOK_OPEN", label: "Book Open" },
  { value: "BRIEFCASE", label: "Briefcase" },
  { value: "GLOBE", label: "Globe" },
  { value: "HEADPHONES", label: "Headphones" },
];

export default async function SiteSettingsPage({
  params,
}: SiteSettingsPageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const settings = await prisma.siteSettings.findFirst({
    include: {
      whyChooseUsCards: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!settings) {
    throw new Error("Site settings have not been initialized.");
  }

  const cards = settings.whyChooseUsCards;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">Site Settings</h1>

      <form action={updateSiteSettings} className="mt-6 space-y-8">
        <input type="hidden" name="locale" value={locale} />

        <section className="rounded border border-border p-4">
          <h2 className="text-lg font-medium">At a Glance</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "yearsInOperation", label: "Years in operation" },
              { name: "studentsTrained", label: "Students trained" },
              { name: "centresWorldwide", label: "Centres worldwide" },
              { name: "affiliations", label: "Affiliations" },
              { name: "countries", label: "Countries" },
            ].map((field) => (
              <div key={field.name} className="space-y-1">
                <label htmlFor={field.name} className="text-sm font-medium">
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  defaultValue={settings[field.name as keyof typeof settings] as string}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded border border-border p-4">
          <h2 className="text-lg font-medium">About Section</h2>
          <div className="mt-4 grid gap-4">
            <div className="space-y-1">
              <label htmlFor="aboutBodyEn" className="text-sm font-medium">
                About body (English) <span className="text-destructive">*</span>
              </label>
              <textarea
                id="aboutBodyEn"
                name="aboutBodyEn"
                required
                rows={5}
                defaultValue={settings.aboutBodyEn}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="aboutBodyMl" className="text-sm font-medium">
                About body (Malayalam)
              </label>
              <textarea
                id="aboutBodyMl"
                name="aboutBodyMl"
                rows={5}
                defaultValue={settings.aboutBodyMl ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="aboutPhotoUrl" className="text-sm font-medium">
                About photo URL
              </label>
              <input
                id="aboutPhotoUrl"
                name="aboutPhotoUrl"
                type="url"
                defaultValue={settings.aboutPhotoUrl ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="rounded border border-border p-4">
          <h2 className="text-lg font-medium">Why Choose Us</h2>
          <div className="mt-4 space-y-6">
            {cards.map((card, index) => (
              <fieldset
                key={card.id}
                className="rounded border border-border p-4"
              >
                <legend className="px-2 text-sm font-medium">
                  Card {index + 1}
                </legend>
                <input type="hidden" name={`card_${index}_id`} value={card.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor={`card_${index}_icon`}
                      className="text-sm font-medium"
                    >
                      Icon
                    </label>
                    <select
                      id={`card_${index}_icon`}
                      name={`card_${index}_icon`}
                      defaultValue={card.icon}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    >
                      {iconOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor={`card_${index}_titleEn`}
                      className="text-sm font-medium"
                    >
                      Title (English) <span className="text-destructive">*</span>
                    </label>
                    <input
                      id={`card_${index}_titleEn`}
                      name={`card_${index}_titleEn`}
                      required
                      defaultValue={card.titleEn}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor={`card_${index}_titleMl`}
                      className="text-sm font-medium"
                    >
                      Title (Malayalam)
                    </label>
                    <input
                      id={`card_${index}_titleMl`}
                      name={`card_${index}_titleMl`}
                      defaultValue={card.titleMl ?? ""}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor={`card_${index}_descriptionEn`}
                      className="text-sm font-medium"
                    >
                      Description (English) <span className="text-destructive">*</span>
                    </label>
                    <input
                      id={`card_${index}_descriptionEn`}
                      name={`card_${index}_descriptionEn`}
                      required
                      defaultValue={card.descriptionEn}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label
                      htmlFor={`card_${index}_descriptionMl`}
                      className="text-sm font-medium"
                    >
                      Description (Malayalam)
                    </label>
                    <input
                      id={`card_${index}_descriptionMl`}
                      name={`card_${index}_descriptionMl`}
                      defaultValue={card.descriptionMl ?? ""}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        <section className="rounded border border-border p-4">
          <h2 className="text-lg font-medium">Location, Contact &amp; Social</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="address" className="text-sm font-medium">
                Centre Address
              </label>
              <input
                id="address"
                name="address"
                defaultValue={settings.address ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="mapsUrl" className="text-sm font-medium">
                Google Maps URL
              </label>
              <input
                id="mapsUrl"
                name="mapsUrl"
                type="url"
                placeholder="https://maps.google.com/?q=..."
                defaultValue={settings.mapsUrl ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="mapEmbedUrl" className="text-sm font-medium">
                Google Maps Embed URL
              </label>
              <input
                id="mapEmbedUrl"
                name="mapEmbedUrl"
                type="url"
                placeholder="https://www.google.com/maps/embed?pb=..."
                defaultValue={settings.mapEmbedUrl ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="whatsappNumber" className="text-sm font-medium">
                WhatsApp Number / URL
              </label>
              <input
                id="whatsappNumber"
                name="whatsappNumber"
                type="text"
                placeholder="e.g. 919544229992 or https://wa.me/..."
                defaultValue={settings.whatsappNumber ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="facebookUrl" className="text-sm font-medium">
                Facebook URL
              </label>
              <input
                id="facebookUrl"
                name="facebookUrl"
                type="url"
                defaultValue={settings.facebookUrl ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="instagramUrl" className="text-sm font-medium">
                Instagram URL
              </label>
              <input
                id="instagramUrl"
                name="instagramUrl"
                type="url"
                defaultValue={settings.instagramUrl ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="youtubeUrl" className="text-sm font-medium">
                YouTube URL
              </label>
              <input
                id="youtubeUrl"
                name="youtubeUrl"
                type="url"
                defaultValue={settings.youtubeUrl ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="linkedinUrl" className="text-sm font-medium">
                LinkedIn URL
              </label>
              <input
                id="linkedinUrl"
                name="linkedinUrl"
                type="url"
                defaultValue={settings.linkedinUrl ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="googleReviewsUrl" className="text-sm font-medium">
                Google Reviews URL
              </label>
              <input
                id="googleReviewsUrl"
                name="googleReviewsUrl"
                type="url"
                defaultValue={settings.googleReviewsUrl ?? ""}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <Button type="submit">Save Settings</Button>
      </form>
    </main>
  );
}
