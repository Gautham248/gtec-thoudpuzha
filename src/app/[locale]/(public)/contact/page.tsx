import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  MapPin,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { getSiteSettings, type Locale } from "@/lib/site-settings";
import { getPublishedCourses } from "@/lib/courses";
import { EnquiryForm } from "@/components/shared/EnquiryForm";
import { siteConfig } from "@/lib/site";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: t("heading"),
    description:
      locale === "ml"
        ? "ജി-ടെക് എഡ്യൂക്കേഷൻ തൊടുപുഴയുമായി ബന്ധപ്പെടുക. അഡ്മിഷൻ, കോഴ്സുകൾ, വിലാസം, ഫോൺ നമ്പർ എന്നിവ ലഭ്യമാണ്."
        : "Contact G-TEC EDUCATION Thodupuzha. Phone, WhatsApp, address, office hours, and online enquiry form.",
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;

  const settings = await getSiteSettings();
  const courses = await getPublishedCourses();

  const t = await getTranslations({ locale, namespace: "contact" });
  const contactPageT = await getTranslations({
    locale,
    namespace: "contactPage",
  });

  const mapsUrl = settings.mapsUrl || siteConfig.mapsUrl;
  const address = settings.address || siteConfig.locationAddress;

  const socialLinks = [
    { url: settings.facebookUrl, label: "Facebook" },
    { url: settings.instagramUrl, label: "Instagram" },
    { url: settings.youtubeUrl, label: "YouTube" },
    { url: settings.linkedinUrl, label: "LinkedIn" },
  ].filter((s): s is { url: string; label: string } => !!s.url);

  return (
    <main className="min-h-screen pb-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-14 lg:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--color-primary)_/_8%,transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20">
            {contactPageT("badge")}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {contactPageT("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
            {contactPageT("subtitle")}
          </p>
        </div>
      </section>

      {/* Info Cards Grid */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Phone & WhatsApp Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                {contactPageT("phoneTitle")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {contactPageT("phoneDesc")}
              </p>

              <div className="mt-4 space-y-2.5 text-sm font-medium">
                <div>
                  <a
                    href={`tel:${siteConfig.phoneNumber.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{siteConfig.phoneNumber}</span>
                  </a>
                </div>
                <div>
                  <a
                    href={`https://wa.me/${siteConfig.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-600 hover:underline"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>WhatsApp: {siteConfig.phoneNumber}</span>
                  </a>
                </div>
                <div className="pt-1 border-t border-border/60">
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary hover:underline break-all"
                  >
                    <Mail className="h-4 w-4 text-sky-500 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">
                      {siteConfig.email}
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">
                  {contactPageT("addressTitle")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {address}
                </p>
              </div>

              {mapsUrl && (
                <div className="mt-4 pt-3 border-t border-border/60">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline group"
                  >
                    <MapPin className="size-4 text-red-500 group-hover:scale-110 transition-transform" />
                    <span>Find Us on Google Maps</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Operating Hours Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                {contactPageT("hoursTitle")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {contactPageT("hoursText")}
              </p>

              {socialLinks.length > 0 && (
                <div className="mt-4 flex items-center gap-2 pt-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 px-2.5 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Section: Enquiry Form & Map */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            {/* Direct Inline Enquiry Form */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {contactPageT("enquiryTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {contactPageT("enquirySubtitle")}
                </p>
              </div>

              <EnquiryForm source="contact-page" courses={courses} />
            </div>

            {/* Google Map & Directions */}
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {contactPageT("locationTitle")}
                  </h2>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline group"
                    >
                      <MapPin className="size-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                      <span>Find Us on Google Maps</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
                  <iframe
                    src={settings.mapEmbedUrl || siteConfig.mapEmbedUrl}
                    title={`${siteConfig.brandName} location`}
                    width="100%"
                    height="420"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="block h-[320px] w-full sm:h-[420px]"
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {siteConfig.brandName}
                    </span>
                    , {address.replace(/^G-TEC EDUCATION,\s*/i, "")}
                  </p>
                  <a
                    href={siteConfig.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-black"
                  >
                    <Navigation className="size-4" />
                    Get Directions
                  </a>
                </div>

                {settings.googleReviewsUrl && (
                  <div className="mt-6 text-center">
                    <a
                      href={settings.googleReviewsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <span>{t("googleReviews")}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
