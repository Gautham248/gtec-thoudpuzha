"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Phone, MessageCircle, Send, Sparkles, Star, ExternalLink } from "lucide-react";
import { EnquiryForm } from "@/components/shared/EnquiryForm";
import { useFocusTrap } from "@/hooks/useFocusTrap";
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
  courses: PublicCourse[];
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

function useCloseOnEscape(onClose: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useCloseOnEscape(onClose);
  const containerRef = useFocusTrap(true);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Enquiry form"
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-background p-4 sm:p-6 shadow-2xl border border-border/80 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="size-5"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

export function ContactSection({ settings, courses }: ContactSectionProps) {
  const t = useTranslations("contact");
  const [showEnquiry, setShowEnquiry] = useState(false);

  const socialLinks = [
    { url: settings.facebookUrl, key: "facebook" },
    { url: settings.instagramUrl, key: "instagram" },
    { url: settings.youtubeUrl, key: "youtube" },
    { url: settings.linkedinUrl, key: "linkedin" },
  ].filter((s): s is { url: string; key: string } => !!s.url);

  return (
    <section id="enquiry" className="relative bg-muted/30 py-16 sm:py-20 lg:py-24 border-t border-border/60 overflow-hidden scroll-mt-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary mb-3.5">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Get In Touch</span>
          </div>
          <h2
            id="contact-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground"
          >
            {t("heading")}
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-stretch">
          {/* Interactive Google Maps Frame */}
          {settings.mapEmbedUrl && (
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg min-h-[360px] sm:min-h-[440px] flex flex-col">
              <iframe
                title="G-TEC Thodupuzha location"
                src={settings.mapEmbedUrl}
                width="100%"
                height="100%"
                className="flex-1 w-full min-h-[360px] sm:min-h-[440px]"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                data-testid="google-map-iframe"
              />
            </div>
          )}

          {/* Contact Details Card */}
          <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-lg">
            <div className="space-y-5">
              <div>
                <span className="text-sm font-bold uppercase tracking-wider text-primary">
                  Campus Centre
                </span>
                <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  G-TEC <span className="text-primary">{siteConfig.centreName}</span>
                </h3>
                {settings.address && (
                  <div className="mt-3 flex items-start gap-2.5 text-muted-foreground">
                    <MapPin className="mt-1 size-4.5 shrink-0 text-primary" />
                    <span className="text-sm sm:text-base leading-relaxed">{settings.address}</span>
                  </div>
                )}
              </div>

              {/* Direct Action Chips */}
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={`tel:${siteConfig.phoneNumber}`}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3.5 text-sm sm:text-base font-bold text-foreground transition-all hover:border-primary/40 hover:bg-muted/70 hover:shadow-xs group"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Phone className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-muted-foreground">{t("phone")}</p>
                    <p className="text-sm font-bold text-foreground truncate">{siteConfig.phoneNumber}</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-sm sm:text-base font-bold text-foreground transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:shadow-xs group"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <MessageCircle className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t("whatsapp")}</p>
                    <p className="text-sm font-bold text-foreground truncate">{siteConfig.phoneNumber}</p>
                  </div>
                </a>
              </div>

              {/* Social Channels & Reviews */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    {socialLinks.map(({ url, key }) => {
                      const icon = socialIcons[key];
                      return (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={icon.label}
                          className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-background text-muted-foreground shadow-2xs transition-all hover:border-primary/40 hover:text-primary hover:shadow-xs hover:scale-105 active:scale-95"
                        >
                          <svg
                            viewBox={icon.viewBox}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-5"
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
                    className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-700 dark:text-amber-300 transition-all hover:bg-amber-500/20 hover:scale-105"
                  >
                    <Star className="size-4 fill-amber-500 text-amber-500" />
                    <span>{t("googleReviews")}</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Modal Trigger CTA */}
            <div className="mt-8 pt-6 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowEnquiry(true)}
                className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-primary px-7 py-4 text-base sm:text-lg font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Send className="size-5" />
                <span>{t("sendMessage")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Overlay */}
        {showEnquiry && (
          <ModalOverlay onClose={() => setShowEnquiry(false)}>
            <EnquiryForm source="contact_page" courses={courses} />
          </ModalOverlay>
        )}
      </div>
    </section>
  );
}

