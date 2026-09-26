"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Link, usePathname } from "@/lib/i18n/navigation";

interface CourseDropdownItem {
  slug: string;
  titleEn: string;
  titleMl: string | null;
}

interface CoursesDropdownProps {
  courses: CourseDropdownItem[];
  label: string;
  locale: string;
  triggerClassName?: string;
}

export function CoursesDropdown({
  courses,
  label,
  locale,
  triggerClassName,
}: CoursesDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

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
      <Link href="/courses" className="text-sm font-medium hover:text-primary transition-colors">
        {label}
      </Link>
    );
  }

  const useThreeColumns = courses.length >= 7;

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleArrowKeys}>
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
        className={
          triggerClassName ??
          "text-sm font-medium hover:text-primary transition-colors inline-flex items-center gap-1 py-2"
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`${label} menu`}
          className={`absolute top-full left-1/2 -translate-x-1/4 sm:-translate-x-1/3 md:-translate-x-1/2 mt-2 ${
            useThreeColumns
              ? "w-[90vw] max-w-[660px] md:w-[680px] lg:w-[720px]"
              : "w-[85vw] max-w-[480px] md:w-[500px]"
          } rounded-xl border border-border bg-white dark:bg-zinc-900 bg-background text-foreground p-4 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150`}
        >
          <div className="flex items-center justify-between border-b border-border/80 pb-2.5 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {locale === "ml" ? "ലഭ്യമായ കോഴ്സുകൾ" : "Available Courses"} ({courses.length})
            </span>
            <Link
              href="/courses"
              role="menuitem"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 group"
              tabIndex={-1}
            >
              <span>{locale === "ml" ? "എല്ലാ കോഴ്സുകളും" : "All Courses"}</span>
              <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </Link>
          </div>

          <div
            className={`grid gap-1.5 ${
              useThreeColumns
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {courses.map((course) => (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                role="menuitem"
                className="flex items-center rounded-md px-3 py-2 text-xs md:text-sm font-medium text-foreground/90 transition-colors hover:bg-accent hover:text-primary focus:bg-accent focus:text-primary focus:outline-none"
                tabIndex={-1}
              >
                <span className="line-clamp-2">
                  {locale === "ml" && course.titleMl
                    ? course.titleMl
                    : course.titleEn}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

