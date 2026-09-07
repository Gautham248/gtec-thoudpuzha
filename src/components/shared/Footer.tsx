import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  GraduationCap,
  ShieldCheck,
  Phone,
  MessageCircle,
  ArrowUpRight,
  MapPin,
  Star,
} from "lucide-react";
import { siteConfig } from "@/lib/site";
import { getCachedSiteSettings } from "@/lib/data-cache";
import type { SiteSettings } from "@prisma/client";

const quickLinks: { labelKey: string; href: string }[] = [
  { labelKey: "home", href: "/" },
  { labelKey: "about", href: "/about" },
  { labelKey: "courses", href: "/courses" },
  { labelKey: "gallery", href: "/gallery" },
  { labelKey: "placement", href: "/placement" },
  { labelKey: "news", href: "/news" },
  { labelKey: "contact", href: "/contact" },
];

const legalLinks: { labelKey: string; href: string }[] = [
  { labelKey: "privacyPolicy", href: "/privacy" },
  { labelKey: "termsOfService", href: "/terms" },
];

const portalLinks: { labelKey: string; href: string; external?: boolean }[] = [
  { labelKey: "studentLogin", href: "/portal/sign-in" },
  { labelKey: "academicResources", href: "/portal/student" },
  { labelKey: "jobVacancies", href: "/portal/jobs" },
  { labelKey: "myBiodata", href: "/portal/biodata" },
  { labelKey: "employerLogin", href: "/portal/sign-in" },
  { labelKey: "postVacancy", href: "/portal/employer/post-vacancy" },
  {
    labelKey: "verifyCertificate",
    href: "https://gtecadmin.com",
    external: true,
  },
];

interface FooterProps {
  settings?: Partial<SiteSettings> | null;
  address?: string | null;
}

export async function Footer({ settings: propSettings, address: propAddress }: FooterProps) {
  const t = await getTranslations("footer");
  const navT = await getTranslations("nav");
  const currentYear = new Date().getFullYear();

  let settings = propSettings;
  if (!settings) {
    try {
      settings = await getCachedSiteSettings();
    } catch {
      settings = null;
    }
  }

  const liveAddress = settings?.address ?? propAddress ?? null;
  const mapsUrl =
    settings?.mapsUrl ||
    (liveAddress ? `https://maps.google.com/?q=${encodeURIComponent(liveAddress)}` : null);
  const instagramUrl = settings?.instagramUrl ?? null;
  const facebookUrl = settings?.facebookUrl ?? null;
  const rawWhatsapp = settings?.whatsappNumber ?? null;
  const whatsappUrl = rawWhatsapp
    ? rawWhatsapp.startsWith("http")
      ? rawWhatsapp
      : `https://wa.me/${rawWhatsapp.replace(/[^0-9]/g, "")}`
    : null;
  const googleReviewsUrl = settings?.googleReviewsUrl ?? null;

  // Build the dynamic list of Top of Footer quick link cards
  const topFooterItems: {
    id: string;
    href: string;
    title: string;
    subtitle: string;
    ariaLabel: string;
    testId: string;
    icon: React.ReactNode;
    badgeColor?: string;
  }[] = [];

  // 1. Google Maps / Campus Location
  if (mapsUrl && liveAddress) {
    topFooterItems.push({
      id: "location",
      href: mapsUrl,
      title: t("findOurCampus"),
      subtitle: liveAddress,
      ariaLabel: `Find G-TEC Thodupuzha on Google Maps - ${liveAddress}`,
      testId: "footer-location-link",
      badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      icon: <MapPin className="size-5 shrink-0 text-red-600 dark:text-red-400" />,
    });
  }

  // 2. Instagram
  if (instagramUrl) {
    topFooterItems.push({
      id: "instagram",
      href: instagramUrl,
      title: t("instagram"),
      subtitle: instagramUrl.includes("instagram.com/")
        ? `@${instagramUrl.split("instagram.com/")[1].replace(/\/$/, "") || "gtec_thodupuzha"}`
        : t("followUs"),
      ariaLabel: "Follow G-TEC Thodupuzha on Instagram",
      testId: "footer-instagram-link",
      badgeColor: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-pink-600 dark:text-pink-400"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    });
  }

  // 3. Facebook
  if (facebookUrl) {
    topFooterItems.push({
      id: "facebook",
      href: facebookUrl,
      title: t("facebook"),
      subtitle: t("officialPage"),
      ariaLabel: "Visit G-TEC Thodupuzha on Facebook",
      testId: "footer-facebook-link",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-blue-600 dark:text-blue-400"
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" />
        </svg>
      ),
    });
  }

  // 4. WhatsApp
  if (whatsappUrl) {
    topFooterItems.push({
      id: "whatsapp",
      href: whatsappUrl,
      title: t("whatsapp"),
      subtitle: t("chatOnWhatsapp"),
      ariaLabel: "Chat with G-TEC Thodupuzha on WhatsApp",
      testId: "footer-whatsapp-link",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    });
  }

  // 5. Google Reviews
  if (googleReviewsUrl) {
    topFooterItems.push({
      id: "reviews",
      href: googleReviewsUrl,
      title: t("googleReviews"),
      subtitle: t("topRated"),
      ariaLabel: "Read G-TEC Thodupuzha Google Reviews and Ratings",
      testId: "footer-google-reviews-link",
      badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      icon: <Star className="size-5 shrink-0 text-amber-500 fill-amber-500" />,
    });
  }

  return (
    <footer className="border-t border-border/80 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* =========================================================
            Top of Footer — Dynamic Quick Links & Social Hub
           ========================================================= */}
        {topFooterItems.length > 0 && (
          <div className="mb-10 sm:mb-12" data-testid="top-of-footer-section">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {topFooterItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.ariaLabel}
                  data-testid={item.testId}
                  className="group relative flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/75 backdrop-blur-md p-3.5 sm:p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-md active:translate-y-0 min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl border ${item.badgeColor} shadow-2xs transition-transform duration-200 group-hover:scale-105 shrink-0`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex size-7 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-8 sm:mt-10 border-b border-border/70" />
          </div>
        )}

        {/* =========================================================
            Main Footer Columns (Preserved 100%)
           ========================================================= */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand Info */}
          <div className="sm:col-span-2 lg:col-span-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <GraduationCap className="size-6" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  G-TEC <span className="text-primary">{siteConfig.centreName}</span>
                </p>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Computer Education
                </p>
              </div>
            </div>

            {liveAddress && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">
                {liveAddress}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2.5 pt-1">
              <a
                href={`tel:${siteConfig.phoneNumber}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 text-sm font-bold text-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Phone className="size-3.5 text-primary" />
                <span>{siteConfig.phoneNumber}</span>
              </a>
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
              >
                <MessageCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="mb-4 text-sm sm:text-base font-black uppercase tracking-wider text-foreground">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm sm:text-base text-muted-foreground transition-colors hover:text-primary font-medium"
                  >
                    {navT(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals & Verification */}
          <div className="lg:col-span-3">
            <h3 className="mb-4 text-sm sm:text-base font-black uppercase tracking-wider text-foreground">
              {t("portals")}
            </h3>
            <ul className="space-y-3">
              {portalLinks.map((link, i) => {
                if (link.external) {
                  return (
                    <li key={`portal-${link.labelKey}-${i}`}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm sm:text-base font-bold text-primary hover:underline"
                        data-testid="verify-certificate-link"
                      >
                        <span>{t(link.labelKey)}</span>
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={`portal-${link.labelKey}-${i}`}>
                    <Link
                      href={link.href}
                      className="text-sm sm:text-base text-muted-foreground transition-colors hover:text-primary font-medium"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Legal & ISO Accreditation */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 text-sm sm:text-base font-black uppercase tracking-wider text-foreground">
              {t("legal")}
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm sm:text-base text-muted-foreground transition-colors hover:text-primary font-medium"
                    data-testid={link.labelKey === "privacyPolicy" ? "footer-privacy-link" : "footer-terms-link"}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <ShieldCheck className="size-4.5 shrink-0" />
                <span>ISO 9001:2015</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Certified Quality Management in Computer Training
              </p>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="mt-12 border-t border-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-sm text-muted-foreground font-medium">
          <p>
            &copy; {currentYear} G-TEC {siteConfig.centreName}. {t("allRightsReserved")}
          </p>
          <p className="text-sm text-muted-foreground/80">
            Official Digital Portal for G-TEC Education Centre, Thodupuzha
          </p>
        </div>
      </div>
    </footer>
  );
}
