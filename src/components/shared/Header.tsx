"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "@/lib/i18n/navigation";
import {
  Menu,
  X,
  Phone,
  MessageCircle,
  Sparkles,
  Home,
  Info,
  GraduationCap,
  Briefcase,
  Image as ImageIcon,
  BookOpen,
  Send,
  User,
  ChevronDown,
  ArrowRight,
  Globe,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { siteConfig } from "@/lib/site";
import { CoursesDropdown } from "@/components/shared/CoursesDropdown";
import Image from "next/image";
import { cn } from "@/lib/utils";

const navItems: {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { labelKey: "home", href: "/", icon: Home },
  { labelKey: "about", href: "/about", icon: Info },
  { labelKey: "placement", href: "/placement", icon: Briefcase },
  { labelKey: "resources", href: "/portal/student", icon: BookOpen },
  { labelKey: "gallery", href: "/gallery", icon: ImageIcon },
  { labelKey: "contact", href: "/contact", icon: Send },
];

interface CourseDropdownItem {
  slug: string;
  titleEn: string;
  titleMl: string | null;
}

const emptySubscribe = () => () => {};

export function Header({
  courses,
}: {
  courses?: CourseDropdownItem[];
}) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [coursesOpenMobile, setCoursesOpenMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const { isSignedIn } = useAuth();

  // Close drawer upon route navigation
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  const localeHref = (path: string) => {
    if (path === "/") return `/${locale}`;
    return `/${locale}${path}`;
  };

  const portalUrl = localeHref("/portal");

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname.startsWith(href);
  };

  const sidebarDrawerContent = (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex justify-end transition-all duration-300",
        drawerOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
      )}
      role="dialog"
      aria-modal={drawerOpen}
      aria-label="Sidebar Menu"
    >
      {/* Backdrop Overlay covering 100% of viewport */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Drawer attached to right, 100dvh */}
      <aside
        id="slideout-sidebar"
        className={cn(
          "relative z-10 h-[100dvh] w-[85vw] max-w-[380px] sm:w-[360px] bg-background border-l border-border/80 shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-out",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col p-5 sm:p-6 space-y-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 aspect-[1600/1094]">
                <Image
                  src="/icons/gtec.jpeg"
                  alt="G-TEC Thodupuzha logo"
                  fill
                  sizes="50px"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Navigation & Profile
                </span>
                <span className="text-sm font-medium text-muted-foreground uppercase">
                  {siteConfig.centreName} Centre
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="size-8 inline-flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close drawer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* 1. User Details / Authentication Section */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
            {isSignedIn ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserButton
                      appearance={{
                        elements: { avatarBox: "size-9 ring-2 ring-primary/20" },
                      }}
                    >
                      <UserButton.MenuItems>
                        <UserButton.Link
                          href={portalUrl}
                          label={t("myPortal")}
                          labelIcon={<span />}
                        />
                      </UserButton.MenuItems>
                    </UserButton>
                    <div>
                      <span className="block font-bold text-sm text-foreground">
                        {t("myPortal")}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {t("brandName")} Account
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={portalUrl}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors mt-1"
                >
                  <span>Open Student / Job Portal</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <User className="size-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Student & Portal Access</p>
                    <p className="text-sm text-muted-foreground">Sign in to access resources and job matches</p>
                  </div>
                </div>

                <Link
                  href={localeHref("/sign-in")}
                  aria-label={t("login")}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.99] mt-1"
                >
                  <User className="size-3.5" />
                  <span>{t("login")}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile-Only Navigation Links */}
          {drawerOpen && (
            <nav
              className="lg:hidden space-y-1 py-2 border-y border-border/70"
              aria-label="Mobile navigation"
            >
              <p className="px-2 py-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Navigation
              </p>
              <Link
                href={localeHref("/")}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                  isLinkActive("/")
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-muted/70"
                )}
                onClick={() => setDrawerOpen(false)}
              >
                <Home className="size-4 text-muted-foreground" />
                <span>{t("home")}</span>
              </Link>

              <Link
                href={localeHref("/about")}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                  isLinkActive("/about")
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-muted/70"
                )}
                onClick={() => setDrawerOpen(false)}
              >
                <Info className="size-4 text-muted-foreground" />
                <span>{t("about")}</span>
              </Link>

              {/* Mobile Courses Collapsible */}
              <div className="rounded-xl overflow-hidden">
                <div
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 transition-all",
                    pathname.startsWith("/courses")
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-foreground hover:bg-muted/70"
                  )}
                >
                  <Link
                    href={localeHref("/courses")}
                    className="flex items-center gap-3 text-sm font-semibold flex-1"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <GraduationCap className="size-4 text-muted-foreground" />
                    <span>{t("courses")}</span>
                  </Link>
                  {courses && courses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCoursesOpenMobile((o) => !o)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                      aria-label="Toggle courses submenu"
                    >
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform duration-200",
                          coursesOpenMobile ? "rotate-180" : ""
                        )}
                      />
                    </button>
                  )}
                </div>

                {courses && courses.length > 0 && coursesOpenMobile && (
                  <div className="ml-7 my-1 border-l-2 border-primary/30 pl-3 space-y-1">
                    {courses.map((course) => (
                      <Link
                        key={course.slug}
                        href={localeHref(`/courses/${course.slug}`)}
                        className="block rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        onClick={() => setDrawerOpen(false)}
                      >
                        {locale === "ml" && course.titleMl
                          ? course.titleMl
                          : course.titleEn}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href={localeHref("/placement")}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                  isLinkActive("/placement")
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-muted/70"
                )}
                onClick={() => setDrawerOpen(false)}
              >
                <Briefcase className="size-4 text-muted-foreground" />
                <span>{t("placement")}</span>
              </Link>

              <Link
                href={localeHref("/portal/student")}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                  isLinkActive("/portal/student")
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-muted/70"
                )}
                onClick={() => setDrawerOpen(false)}
              >
                <BookOpen className="size-4 text-muted-foreground" />
                <span>{t("resources")}</span>
              </Link>

              <Link
                href={localeHref("/gallery")}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                  isLinkActive("/gallery")
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-muted/70"
                )}
                onClick={() => setDrawerOpen(false)}
              >
                <ImageIcon className="size-4 text-muted-foreground" />
                <span>{t("gallery")}</span>
              </Link>

              <Link
                href={localeHref("/contact")}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                  isLinkActive("/contact")
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-muted/70"
                )}
                onClick={() => setDrawerOpen(false)}
              >
                <Send className="size-4 text-muted-foreground" />
                <span>{t("contact")}</span>
              </Link>
            </nav>
          )}

          {/* 2. Language Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Globe className="size-3.5 text-primary" />
              <span>Language / ഭാഷ</span>
            </div>
            <LanguageSwitcher variant="segmented" />
          </div>

          {/* 3. WhatsApp & Direct Contact Channels */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Phone className="size-3.5 text-primary" />
              <span>Direct Support</span>
            </div>

            {/* WhatsApp Contact Button */}
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("whatsapp")}
              className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all group"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <MessageCircle className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">WhatsApp Admission Desk</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 truncate">Chat directly with counsellor</p>
              </div>
              <ChevronRight className="size-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Call Now Button */}
            <a
              href={`tel:${siteConfig.phoneNumber}`}
              aria-label={t("callNow")}
              className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-sm font-semibold text-foreground hover:bg-primary/10 transition-all group"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Phone className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{t("callNow")}</p>
                <p className="text-sm text-muted-foreground truncate">{siteConfig.phoneNumber}</p>
              </div>
              <ChevronRight className="size-4 text-primary group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* 4. Apply Now Primary CTA */}
          <div className="pt-2">
            <Link
              href={localeHref("/#enquiry")}
              aria-label={t("applyNow")}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary p-3.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg transition-all active:scale-[0.99] group overflow-hidden"
            >
              <Sparkles className="size-4 text-amber-300 animate-pulse" />
              <span>{t("applyNow")}</span>
              <ArrowRight className="size-4 ml-auto transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 sm:p-6 border-t border-border/70 bg-muted/20">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <ShieldCheck className="size-4 shrink-0" />
            <span>ISO 9001:2015 Certified Centre</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            G-TEC Education Centre, Thodupuzha
          </p>
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled
            ? "bg-background/95 backdrop-blur-xl border-b border-border/80 shadow-xs supports-[backdrop-filter]:bg-background/85"
            : "bg-background/85 backdrop-blur-lg border-b border-border/50 supports-[backdrop-filter]:bg-background/75"
        )}
      >
        <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
          {/* Brand Logo & Centre Identity */}
          <Link
            href={localeHref("/")}
            className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 group py-1"
            aria-label="G-TEC Thodupuzha home"
          >
            <div className="relative h-10 sm:h-12 aspect-[1600/1094] shrink-0 flex items-center transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/icons/gtec.jpeg"
                alt="G-TEC Thodupuzha"
                fill
                priority
                sizes="(max-width: 640px) 60px, (max-width: 1024px) 70px, 80px"
                className="object-contain"
              />
            </div>

            <div className="flex flex-col justify-center min-w-0 border-l border-border/80 pl-2.5 sm:pl-3.5">
              <span className="text-base sm:text-lg font-bold leading-tight tracking-tight text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1.5 whitespace-nowrap">
                <span>{t("brandName")}</span>
              </span>
              <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase truncate flex items-center gap-1.5 whitespace-nowrap">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
                <span>{siteConfig.centreName}</span>
              </span>
            </div>
          </Link>

          {/* Clean Main Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-1 bg-muted/40 p-1.5 rounded-full border border-border/50 shadow-2xs backdrop-blur-sm"
            aria-label="Primary navigation"
          >
            {/* Home & About */}
            {navItems.slice(0, 2).map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={localeHref(item.href)}
                  className={cn(
                    "relative text-sm font-medium px-2.5 xl:px-3.5 py-1.5 rounded-full transition-all duration-200 inline-flex items-center justify-center whitespace-nowrap",
                    active
                      ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
                      : "text-foreground/75 hover:text-foreground hover:bg-background/60"
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}

            {/* Courses */}
            {courses && courses.length > 0 ? (
              <CoursesDropdown
                courses={courses}
                label={t("courses")}
                locale={locale}
              />
            ) : (
              <Link
                href={localeHref("/courses")}
                className={cn(
                  "relative text-sm font-medium px-2.5 xl:px-3.5 py-1.5 rounded-full transition-all duration-200 inline-flex items-center justify-center whitespace-nowrap",
                  pathname.startsWith("/courses")
                    ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
                    : "text-foreground/75 hover:text-foreground hover:bg-background/60"
                )}
              >
                {t("courses")}
              </Link>
            )}

            {/* Placement/Jobs, Resources/Student Portal, Gallery, Contact */}
            {navItems.slice(2).map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={localeHref(item.href)}
                  className={cn(
                    "relative text-sm font-medium px-2.5 xl:px-3.5 py-1.5 rounded-full transition-all duration-200 inline-flex items-center justify-center whitespace-nowrap",
                    active
                      ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
                      : "text-foreground/75 hover:text-foreground hover:bg-background/60"
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Sidebar Trigger (Menu / Profile Action) */}
          <div className="hidden lg:flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="group flex items-center gap-2.5 rounded-full border border-border/80 bg-muted/40 hover:bg-muted/80 px-4 py-2 text-sm font-bold text-foreground transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
              aria-label="Open account menu"
              aria-expanded={drawerOpen}
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-4" />
              </div>
              <span className="font-bold text-sm">
                {isSignedIn ? t("myPortal") : "Menu"}
              </span>
              <Menu className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>

          {/* Mobile Header Hamburger Toggle */}
          <div className="flex lg:hidden items-center shrink-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="size-10 inline-flex items-center justify-center rounded-full bg-muted/60 text-foreground hover:bg-muted border border-border/70 transition-all duration-200 shrink-0 active:scale-95 cursor-pointer"
              aria-label={drawerOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={drawerOpen}
              aria-controls="slideout-sidebar"
            >
              {drawerOpen ? (
                <X className="size-5 transition-transform duration-200 rotate-90" />
              ) : (
                <Menu className="size-5 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Portal Rendered Sidebar Drawer outside of header containing block */}
      {mounted && typeof document !== "undefined"
        ? createPortal(sidebarDrawerContent, document.body)
        : null}
    </>
  );
}



