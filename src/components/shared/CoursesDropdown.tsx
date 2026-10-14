"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  groupNavCourses,
  pickFeaturedCourse,
  type NavCourse,
  type NavCourseGroup,
} from "@/lib/nav-courses";
import { slugifyCategory } from "@/lib/course-filters";

/** Max courses listed per category in the menus; the rest sit behind "View all". */
export const NAV_COURSES_PER_CATEGORY = 5;

/** Course list URL for a group — category-filtered, or all courses for "Other". */
export function categoryHref(group: NavCourseGroup): string {
  return group.id === "__other"
    ? "/courses"
    : `/courses?category=${slugifyCategory(group.nameEn)}`;
}

export function groupName(group: NavCourseGroup, locale: string): string {
  return locale === "ml" && group.nameMl ? group.nameMl : group.nameEn;
}

export function courseTitle(course: NavCourse, locale: string): string {
  return locale === "ml" && course.titleMl ? course.titleMl : course.titleEn;
}

interface CoursesDropdownProps {
  courses: NavCourse[];
  label: string;
  locale: string;
}

export function CoursesDropdown({
  courses,
  label,
  locale,
}: CoursesDropdownProps) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => groupNavCourses(courses), [courses]);
  const featured = useMemo(() => pickFeaturedCourse(courses), [courses]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const isCoursesActive = pathname.startsWith("/courses");
  const isMl = locale === "ml";

  const activeGroup = groups.find((g) => g.id === activeId) ?? groups[0];

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
      const items = containerRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]',
      );
      if (!items || items.length === 0) return;
      const currentIndex = Array.from(items).indexOf(
        document.activeElement as HTMLElement,
      );
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
        items[next]?.focus();
      } else if (e.key === "ArrowUp") {
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
            ? "bg-white text-primary font-semibold shadow-xs border border-slate-200/80"
            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
        )}
      >
        {label}
      </Link>
    );
  }

  const visibleCourses = activeGroup.courses.slice(0, NAV_COURSES_PER_CATEGORY);
  const hiddenCount = activeGroup.courses.length - visibleCourses.length;

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
            ? "bg-white text-primary font-semibold shadow-xs border border-slate-200/80"
            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200 shrink-0",
            open ? "rotate-180 text-primary" : "text-slate-400"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={`${label} menu`}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[92vw] max-w-[760px] origin-top overflow-hidden rounded-3xl border border-slate-200/80 bg-white/98 backdrop-blur-2xl text-slate-800 shadow-2xl shadow-slate-900/10 z-50"
          >
            <div className="grid grid-cols-[220px_1fr]">
              {/* Category rail */}
              <div className="border-r border-slate-100 bg-slate-50/70 p-3">
                <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {isMl ? "വിഭാഗങ്ങൾ" : "Categories"}
                </p>
                <ul className="space-y-0.5">
                  {groups.map((group) => {
                    const isActive = group.id === activeGroup.id;
                    return (
                      <li key={group.id}>
                        <button
                          type="button"
                          role="menuitem"
                          tabIndex={-1}
                          onMouseEnter={() => setActiveId(group.id)}
                          onFocus={() => setActiveId(group.id)}
                          onClick={() => setActiveId(group.id)}
                          className={cn(
                            "group relative flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors focus:outline-none",
                            isActive
                              ? "bg-white text-primary shadow-xs ring-1 ring-slate-200/80"
                              : "text-slate-600 hover:bg-white/70 hover:text-slate-900 focus:bg-white/70"
                          )}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="courses-menu-indicator"
                              className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-primary"
                            />
                          )}
                          <span className="line-clamp-1">{groupName(group, locale)}</span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "bg-slate-200/70 text-slate-500"
                            )}
                          >
                            {group.courses.length}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Courses in the active category */}
              <div className="flex min-h-[300px] flex-col p-4">
                <div className="flex items-center justify-between px-2 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="size-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {groupName(activeGroup, locale)}
                    </span>
                  </div>
                  <Link
                    href="/courses"
                    role="menuitem"
                    tabIndex={-1}
                    className="group inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary focus:text-primary focus:outline-none"
                  >
                    <span>{isMl ? "എല്ലാ കോഴ്സുകളും" : "All courses"}</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.ul
                    key={activeGroup.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className="flex-1 space-y-1"
                  >
                    {visibleCourses.map((course) => (
                      <li key={course.slug}>
                        <Link
                          href={`/courses/${course.slug}`}
                          role="menuitem"
                          tabIndex={-1}
                          className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                        >
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-semibold text-slate-800 group-hover:text-primary group-focus:text-primary">
                              {courseTitle(course, locale)}
                            </p>
                            {course.durationText && (
                              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="size-3" />
                                {course.durationText}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="size-3.5 shrink-0 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                </AnimatePresence>

                <Link
                  href={categoryHref(activeGroup)}
                  role="menuitem"
                  tabIndex={-1}
                  className="group mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground focus:outline-none"
                >
                  <span>
                    {hiddenCount > 0
                      ? isMl
                        ? `എല്ലാ ${activeGroup.courses.length} കോഴ്സുകളും കാണുക`
                        : `View all ${activeGroup.courses.length} courses`
                      : isMl
                        ? "വിഭാഗം കാണുക"
                        : "View category"}
                  </span>
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {featured && (
              <Link
                href={`/courses/${featured.slug}`}
                role="menuitem"
                tabIndex={-1}
                className="group flex items-center gap-3 border-t border-slate-100 bg-gradient-to-r from-primary/5 via-white to-white px-5 py-3 transition-colors hover:from-primary/10 focus:from-primary/10 focus:outline-none"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {isMl ? "ഫീച്ചർ ചെയ്ത കോഴ്സ്" : "Featured course"}
                  </p>
                  <p className="line-clamp-1 text-sm font-semibold text-slate-800">
                    {courseTitle(featured, locale)}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
