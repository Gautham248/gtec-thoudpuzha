"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, MapPin, Phone, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { useEnquiryModal } from "@/components/enquiry/EnquiryModal";
import { siteConfig } from "@/lib/site";
import type { PublicCourse } from "@/lib/courses";
import type { SiteSettings } from "@prisma/client";

interface ContactSectionProps {
  settings: Pick<
    SiteSettings,
    | "address"
    | "mapEmbedUrl"
    | "facebookUrl"
    | "instagramUrl"
    | "youtubeUrl"
    | "linkedinUrl"
    | "googleReviewsUrl"
  >;
  /** No longer used here: the shared enquiry modal gets courses from the layout. */
  courses?: PublicCourse[];
}

const socialIcons: Record<
  string,
  { label: string; path: string; viewBox: string }
> = {
  facebook: {
    label: "Facebook",
    path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z",
    viewBox: "0 0 24 24",
  },
  instagram: {
    label: "Instagram",
    path: "M17.5 6.5h.01M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    viewBox: "0 0 24 24",
  },
  youtube: {
    label: "YouTube",
    path: "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29.45 29.45 0 0 0 1 12a29.45 29.45 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29.45 29.45 0 0 0 23 12a29.45 29.45 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z",
    viewBox: "0 0 24 24",
  },
  linkedin: {
    label: "LinkedIn",
    path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    viewBox: "0 0 24 24",
  },
};

export function ContactSection({ settings }: ContactSectionProps) {
  const t = useTranslations("contact");
  const { openEnquiry } = useEnquiryModal();

  const socialLinks = [
    { url: settings.facebookUrl, key: "facebook" },
    { url: settings.instagramUrl, key: "instagram" },
    { url: settings.youtubeUrl, key: "youtube" },
    { url: settings.linkedinUrl, key: "linkedin" },
  ].filter((s): s is { url: string; key: string } => !!s.url);

  return (
    <section className="bg-muted/40 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            {t("heading")}
          </h2>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {settings.mapEmbedUrl && (
            <Reveal
              x={-30}
              y={0}
              className="overflow-hidden rounded-2xl border shadow-md"
            >
              <iframe
                title="G-TEC Thodupuzha location"
                src={settings.mapEmbedUrl}
                width="100%"
                height="360"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                data-testid="google-map-iframe"
              />
            </Reveal>
          )}

          <Reveal
            x={30}
            y={0}
            delay={0.1}
            className="flex flex-col justify-center gap-6"
          >
            <div>
              <h3 className="text-2xl font-bold tracking-tight">
                G-TEC{" "}
                <span className="text-primary">{siteConfig.centreName}</span>
              </h3>
              {settings.address && (
                <div className="mt-2 flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span className="text-sm leading-relaxed">
                    {settings.address}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <a
                href={`tel:${siteConfig.phoneNumber}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Phone className="size-4" />
                {t("phone")}: {siteConfig.phoneNumber}
              </a>
              <br />
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <MessageCircle className="size-4" />
                {t("whatsapp")}: {siteConfig.phoneNumber}
              </a>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex gap-2.5">
                {socialLinks.map(({ url, key }) => {
                  const icon = socialIcons[key];
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={icon.label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md"
                    >
                      <svg
                        viewBox={icon.viewBox}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d={icon.path} />
                      </svg>
                    </a>
                  );
                })}
              </div>
            )}

            {settings.googleReviewsUrl && (
              <a
                href={settings.googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("googleReviews")} →
              </a>
            )}

            <div>
              <button
                type="button"
                onClick={() => openEnquiry({ source: "contact_page" })}
                className="group inline-flex items-center gap-3 rounded-full bg-[#0B1220] py-2 pl-6 pr-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-black active:scale-[0.98]"
              >
                {t("sendMessage")}
                <span className="flex size-9 items-center justify-center rounded-full bg-[#1753DA] transition-transform group-hover:scale-105">
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
