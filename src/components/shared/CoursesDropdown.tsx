"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, GraduationCap, ArrowRight } from "lucide-react";

interface CourseDropdownItem {
  slug: string;
  titleEn: string;
  titleMl: string | null;
}

interface CoursesDropdownProps {
  courses: CourseDropdownItem[];
  label: string;
  locale: string;
}

export function CoursesDropdown({
  courses,
  label,
  locale,
}: CoursesDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const isCoursesActive = pathname.startsWith("/courses");

  useEffect(() => {
    // eslint-disable-next-line -- close dropdown on navigation; this is a legitimate UI responsiveness concern
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleArrowKeys = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || courses.length === 0) return;
      const items = containerRef.current?.querySelectorAll<HTMLAnchorElement>(
        '[role="menuitem"]',
      );
      if (!items || items.length === 0) return;
      const currentIndex = Array.from(items).indexOf(
        document.activeElement as HTMLAnchorElement,
      );
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
        items[next]?.focus();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev =
          currentIndex < 0 ? 0 : (currentIndex - 1 + items.length) % items.length;
        items[prev]?.focus();
      }
    },
    [open, courses.length],
  );

  if (courses.length === 0) {
    return (
      <Link
        href="/courses"
        className={cn(
          "relative text-sm font-medium px-2.5 xl:px-3.5 py-1.5 rounded-full transition-all duration-200 inline-flex items-center justify-center whitespace-nowrap",
          isCoursesActive
            ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
            : "text-foreground/75 hover:text-foreground hover:bg-background/60"
        )}
      >
        {label}
      </Link>
    );
  }

  const useThreeColumns = courses.length >= 7;

  return (
    <div ref={containerRef} className="relative inline-flex items-center" onKeyDown={handleArrowKeys}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!open) setOpen(true);
          }
        }}
        className={cn(
          "relative text-sm font-medium px-2.5 xl:px-3.5 py-1.5 rounded-full transition-all duration-200 inline-flex items-center justify-center gap-1 cursor-pointer select-none whitespace-nowrap",
          isCoursesActive || open
            ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
            : "text-foreground/75 hover:text-foreground hover:bg-background/60"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200 text-muted-foreground shrink-0",
            open ? "rotate-180 text-foreground" : ""
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`${label} menu`}
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/4 sm:-translate-x-1/3 md:-translate-x-1/2 mt-2.5 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-2xl text-foreground p-4 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150",
            useThreeColumns
              ? "w-[90vw] max-w-[660px] md:w-[680px] lg:w-[720px]"
              : "w-[85vw] max-w-[480px] md:w-[500px]"
          )}
        >
          <div className="flex items-center justify-between border-b border-border/70 pb-3 mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <GraduationCap className="size-3.5" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === "ml" ? "ലഭ്യമായ കോഴ്സുകൾ" : "Available Courses"} ({courses.length})
              </span>
            </div>
            <Link
              href="/courses"
              role="menuitem"
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
              tabIndex={-1}
            >
              <span>{locale === "ml" ? "എല്ലാ കോഴ്സുകളും" : "All Courses"}</span>
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div
            className={cn(
              "grid gap-1.5",
              useThreeColumns
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2"
            )}
          >
            {courses.map((course) => (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                role="menuitem"
                className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/90 transition-all hover:bg-muted hover:text-primary focus:bg-muted focus:text-primary focus:outline-none"
                tabIndex={-1}
              >
                <span className="line-clamp-2">
                  {locale === "ml" && course.titleMl
                    ? course.titleMl
                    : course.titleEn}
                </span>
                <ArrowRight className="size-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary shrink-0 ml-1.5" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


