"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

export function buildLocalePath(pathname: string, targetLocale: "en" | "ml") {
  if (pathname === "/") return `/${targetLocale}`;
  return `/${targetLocale}${pathname}`;
}

interface LanguageSwitcherProps {
  className?: string;
  variant?: "default" | "pill" | "segmented";
}

export function LanguageSwitcher({ className, variant = "default" }: LanguageSwitcherProps) {
  const locale = useLocale() as "en" | "ml";
  const pathname = usePathname();
  const targetLocale = locale === "en" ? "ml" : "en";
  const targetPath = buildLocalePath(pathname, targetLocale);

  if (variant === "segmented") {
    return (
      <div className={cn("flex items-center rounded-xl border border-border/80 bg-muted/60 p-1 text-sm font-semibold backdrop-blur-md", className)}>
        <Link
          href={locale === "en" ? pathname : buildLocalePath(pathname, "en")}
          className={cn(
            "flex-1 rounded-lg py-1.5 px-3 text-center transition-all duration-200",
            locale === "en"
              ? "bg-background text-foreground shadow-xs font-bold border border-border/40"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          English
        </Link>
        <Link
          href={locale === "ml" ? pathname : buildLocalePath(pathname, "ml")}
          className={cn(
            "flex-1 rounded-lg py-1.5 px-3 text-center transition-all duration-200",
            locale === "ml"
              ? "bg-background text-foreground shadow-xs font-bold border border-border/40"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          മലയാളം
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={targetPath}
      hrefLang={targetLocale}
      className={cn(
        "h-8.5 inline-flex items-center justify-center gap-1.5 rounded-full border border-border/70 bg-background/60 hover:bg-muted/80 px-2.5 xl:px-3 text-sm font-semibold text-foreground/80 hover:text-foreground transition-all duration-200 shadow-2xs hover:scale-105 active:scale-95 whitespace-nowrap shrink-0",
        className
      )}
      aria-label={`Switch to ${targetLocale === "ml" ? "Malayalam" : "English"}`}
    >
      <Globe className="size-3.5 text-primary shrink-0" />
      <span>{targetLocale === "ml" ? "മലയാളം" : "English"}</span>
    </Link>
  );
}

