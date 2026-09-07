import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSiteSettings, type Locale } from "@/lib/site-settings";
import { AboutSection } from "@/components/shared/AboutSection";
import { AtAGlanceSection } from "@/components/shared/AtAGlanceSection";
import { WhyChooseUsSection } from "@/components/shared/WhyChooseUsSection";
import { CertificationPartnerStrip } from "@/components/shared/CertificationPartnerStrip";
import { Target, Compass, Heart, MapPin, Phone, MessageSquare } from "lucide-react";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("heading"),
    description:
      locale === "ml"
        ? "ജി-ടെക് എഡ്യൂക്കേഷൻ തൊടുപുഴയെക്കുറിച്ച് അറിയുക. 25-ൽ പരം വർഷത്തെ പാരമ്പര്യവും ലോകോത്തര കോഴ്സുകളും."
        : "Learn more about G-TEC Education Thodupuzha. Over 25+ years of excellence in IT, Multimedia, Accounting, and Spoken English education.",
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;
  const settings = await getSiteSettings();

  const aboutT = await getTranslations({ locale, namespace: "about" });
  const aboutPageT = await getTranslations({ locale, namespace: "aboutPage" });
  const atAGlanceT = await getTranslations({ locale, namespace: "atAGlance" });
  const whyT = await getTranslations({ locale, namespace: "whyChooseUs" });
  const certT = await getTranslations({ locale, namespace: "certPartners" });

  return (
    <main className="min-h-screen pb-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 lg:py-24">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--color-primary)_/_8%,transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20">
            {aboutPageT("badge")}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {aboutPageT("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground leading-relaxed">
            {aboutPageT("subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/courses"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {aboutPageT("exploreCourses")}
            </Link>
            <Link
              href="/#enquiry"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {aboutPageT("contactUs")}
            </Link>
          </div>
        </div>
      </section>

      {/* Main Centre Overview */}
      <AboutSection
        settings={settings}
        locale={locale}
        heading={aboutT("heading")}
        photoPlaceholder={aboutT("photoPlaceholder")}
      />

      {/* Vision, Mission & Values Grid */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Mission */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                {aboutPageT("missionTitle")}
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-sm sm:text-base">
                {aboutPageT("missionText")}
              </p>
            </div>

            {/* Vision */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                {aboutPageT("visionTitle")}
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-sm sm:text-base">
                {aboutPageT("visionText")}
              </p>
            </div>

            {/* Core Values */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                {aboutPageT("valuesTitle")}
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-sm sm:text-base">
                {aboutPageT("valuesText")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* At A Glance Statistics */}
      <AtAGlanceSection heading={atAGlanceT("heading")} settings={settings} />

      {/* Why Choose Us Features */}
      <WhyChooseUsSection heading={whyT("heading")} settings={settings} locale={locale} />

      {/* Certification Partners */}
      <CertificationPartnerStrip heading={certT("heading")} />

      {/* Location & Centre Info */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Thodupuzha, Kerala</span>
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {aboutPageT("locationTitle")}
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {settings.address ||
                    "G-TEC Education, Temple Bypass Road, Near Private Bus Stand, Thodupuzha, Idukki District, Kerala - 685584."}
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="tel:+919447123456"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call Centre</span>
                  </a>
                  <a
                    href="https://wa.me/919447123456"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp Us</span>
                  </a>
                </div>
              </div>

              {settings.mapEmbedUrl ? (
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-inner">
                  <iframe
                    src={settings.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="G-TEC Education Thodupuzha location map"
                  />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-muted p-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="h-8 w-8 text-primary/60" />
                    <p className="text-sm font-medium">G-TEC Education Centre</p>
                    <p className="text-sm text-muted-foreground">Temple Bypass Road, Thodupuzha</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
