import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  MessageCircle,
  Star,
  ExternalLink,
  Sparkles,
  Info,
  Layers,
} from "lucide-react";
import { updateFooterSettings } from "./actions";

interface FooterSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function FooterSettingsPage({
  params,
}: FooterSettingsPageProps) {
  const { locale } = await params;
  const authResult = await requireRole([Role.SUPER_ADMIN]);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const settings = await prisma.siteSettings.findFirst();

  if (!settings) {
    throw new Error("Site settings have not been initialized.");
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Layers className="size-4" />
          <span>Super Admin Control</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Footer &amp; Contact Settings
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Manage the dynamic location address, Google Maps, Instagram, Facebook, WhatsApp,
          and Google Reviews links displayed in the website footer. If any field is left empty,
          it will be automatically hidden from the public website.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 text-sm text-foreground">
        <Info className="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-primary">Live Database Synchronization</p>
          <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
            Changes saved here update the database and invalidate the server cache immediately.
            The public website footer will instantly display your updated contact and social links.
          </p>
        </div>
      </div>

      <form action={updateFooterSettings} className="mt-8 space-y-8">
        <input type="hidden" name="locale" value={locale} />

        {/* Section 1: Google Maps & Location */}
        <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-border/60 pb-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Google Maps &amp; Campus Location
              </h2>
              <p className="text-xs text-muted-foreground">
                Physical address and interactive Google Maps link for students and visitors.
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="space-y-1.5">
              <label htmlFor="address" className="text-sm font-semibold flex items-center justify-between">
                <span>Centre Address / Location Text</span>
                <span className="text-xs text-muted-foreground font-normal">Shown on footer &amp; location card</span>
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                placeholder="e.g. East End, Thodupuzha-Udumbanoor Rd, near De Paul Public School, Thodupuzha, Kerala 685585"
                defaultValue={settings.address ?? ""}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mapsUrl" className="text-sm font-semibold flex items-center justify-between">
                <span>Google Maps Direct Link URL</span>
                <span className="text-xs text-muted-foreground font-normal">Opens in new tab when clicked</span>
              </label>
              <input
                id="mapsUrl"
                name="mapsUrl"
                type="url"
                placeholder="https://maps.google.com/?q=..."
                defaultValue={settings.mapsUrl ?? ""}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mapEmbedUrl" className="text-sm font-semibold flex items-center justify-between">
                <span>Google Maps Embed URL (Iframe)</span>
                <span className="text-xs text-muted-foreground font-normal">Used on Contact page embed</span>
              </label>
              <input
                id="mapEmbedUrl"
                name="mapEmbedUrl"
                type="url"
                placeholder="https://www.google.com/maps/embed?pb=..."
                defaultValue={settings.mapEmbedUrl ?? ""}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Social Media & Direct Chat */}
        <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-border/60 pb-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Social Media &amp; Instant Messaging
              </h2>
              <p className="text-xs text-muted-foreground">
                Official handles and channels for student communication and social proof.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Instagram */}
            <div className="space-y-1.5 sm:col-span-1">
              <label htmlFor="instagramUrl" className="text-sm font-semibold flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4 text-pink-500"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <span>Instagram Profile URL</span>
              </label>
              <input
                id="instagramUrl"
                name="instagramUrl"
                type="url"
                placeholder="https://www.instagram.com/gtec_thodupuzha/"
                defaultValue={settings.instagramUrl ?? ""}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Facebook */}
            <div className="space-y-1.5 sm:col-span-1">
              <label htmlFor="facebookUrl" className="text-sm font-semibold flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4 text-blue-600"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" />
                </svg>
                <span>Facebook Page URL</span>
              </label>
              <input
                id="facebookUrl"
                name="facebookUrl"
                type="url"
                placeholder="https://www.facebook.com/gtectdpa"
                defaultValue={settings.facebookUrl ?? ""}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5 sm:col-span-1">
              <label htmlFor="whatsappNumber" className="text-sm font-semibold flex items-center gap-1.5">
                <MessageCircle className="size-4 text-emerald-600" />
                <span>WhatsApp Number or URL</span>
              </label>
              <input
                id="whatsappNumber"
                name="whatsappNumber"
                type="text"
                placeholder="e.g. 919544229992 or https://wa.me/919544229992"
                defaultValue={settings.whatsappNumber ?? ""}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                Enter digits with country code or full wa.me URL.
              </p>
            </div>

            {/* Google Reviews */}
            <div className="space-y-1.5 sm:col-span-1">
              <label htmlFor="googleReviewsUrl" className="text-sm font-semibold flex items-center gap-1.5">
                <Star className="size-4 text-amber-500 fill-amber-500" />
                <span>Google Reviews URL</span>
              </label>
              <input
                id="googleReviewsUrl"
                name="googleReviewsUrl"
                type="url"
                placeholder="https://www.google.com/maps/search/?api=1&query=..."
                defaultValue={settings.googleReviewsUrl ?? ""}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                Opens the Google Reviews rating modal or listing in a new tab.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Additional Channels (if configured) */}
        {(settings.youtubeUrl !== undefined || settings.linkedinUrl !== undefined) && (
          <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ExternalLink className="size-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Additional Social Profiles
                </h2>
                <p className="text-xs text-muted-foreground">
                  Optional channels already configured in your site settings.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="youtubeUrl" className="text-sm font-semibold">
                  YouTube Channel URL
                </label>
                <input
                  id="youtubeUrl"
                  name="youtubeUrl"
                  type="url"
                  placeholder="https://youtube.com/@..."
                  defaultValue={settings.youtubeUrl ?? ""}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="linkedinUrl" className="text-sm font-semibold">
                  LinkedIn Page URL
                </label>
                <input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/company/..."
                  defaultValue={settings.linkedinUrl ?? ""}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </section>
        )}

        <div className="flex items-center gap-4 pt-2">
          <Button
            type="submit"
            className="rounded-xl px-6 py-2.5 font-bold shadow-md cursor-pointer"
          >
            Save Footer Settings
          </Button>
          <span className="text-xs text-muted-foreground">
            Empty fields will automatically be excluded from the live website footer.
          </span>
        </div>
      </form>
    </main>
  );
}
