"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Clock,
  GraduationCap,
} from "lucide-react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { getMediaUrl } from "@/lib/media";
import { courseIcon as iconFor } from "@/lib/course-icons";
import {
  groupNavCourses,
  pickFeaturedCourse,
  type NavCourse,
  type NavCourseGroup,
} from "@/lib/nav-courses";
import { EASE_OUT } from "@/components/motion/Reveal";

const courseIcon = (course: NavCourse) =>
  iconFor(course.titleEn, course.category?.nameEn);

const COPY = {
  en: {
    featured: "Featured course",
    featuredFallback: "Hands-on training built for real careers.",
    viewCourse: "View course",
    allCourses: "All courses",
  },
  ml: {
    featured: "ശ്രദ്ധേയമായ കോഴ്സ്",
    featuredFallback: "യഥാർത്ഥ കരിയറിനായുള്ള പ്രായോഗിക പരിശീലനം.",
    viewCourse: "കോഴ്സ് കാണുക",
    allCourses: "എല്ലാ കോഴ്സുകളും",
  },
} as const;

function useLocalized(locale: string) {
  const isMl = locale === "ml";
  return {
    copy: isMl ? COPY.ml : COPY.en,
    pick: (en: string, ml: string | null | undefined) => (isMl && ml ? ml : en),
  };
}

const panelStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const panelColumn: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
};

const HOVER_OPEN_DELAY = 80;
const HOVER_CLOSE_DELAY = 180;

interface CoursesDropdownProps {
  courses: NavCourse[];
  label: string;
  locale: string;
  triggerClassName?: string;
}

/**
 * Desktop mega-menu. The panel is absolutely positioned against the nearest
 * positioned ancestor (the header row), so this wrapper must stay static.
 */
export function CoursesDropdown({
  courses,
  label,
  locale,
  triggerClassName,
}: CoursesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByHover = useRef(false);
  const focusFirstOnOpen = useRef(false);
  const panelId = useId();
  const { copy, pick } = useLocalized(locale);

  // Close on navigation (render-time state adjustment instead of an effect).
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const groups = useMemo(() => groupNavCourses(courses), [courses]);
  const featured = useMemo(() => pickFeaturedCourse(courses), [courses]);

  const clearTimer = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearTimer();
    openedByHover.current = false;
    setOpen(false);
    setHovered(null);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !focusFirstOnOpen.current) return;
    focusFirstOnOpen.current = false;
    const frame = requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLAnchorElement>("[data-course-link]")
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function handlePanelKeys(e: React.KeyboardEvent) {
    const links = Array.from(
      panelRef.current?.querySelectorAll<HTMLAnchorElement>(
        "[data-course-link]",
      ) ?? [],
    );
    if (links.length === 0) return;
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    let next: number | null = null;
    if (e.key === "ArrowDown")
      next = index < 0 ? 0 : (index + 1) % links.length;
    else if (e.key === "ArrowUp")
      next = index < 0 ? 0 : (index - 1 + links.length) % links.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = links.length - 1;
    if (next === null) return;
    e.preventDefault();
    links[next]?.focus();
  }

  if (courses.length === 0) {
    return (
      <Link href="/courses" className={triggerClassName}>
        {label}
      </Link>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={containerRef}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          clearTimer();
          if (!open) {
            hoverTimer.current = setTimeout(() => {
              openedByHover.current = true;
              setOpen(true);
            }, HOVER_OPEN_DELAY);
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return;
          clearTimer();
          // A menu opened by click/keyboard stays until explicitly dismissed.
          if (open && !openedByHover.current) return;
          hoverTimer.current = setTimeout(close, HOVER_CLOSE_DELAY);
        }}
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null;
          if (open && next && !containerRef.current?.contains(next)) close();
        }}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            clearTimer();
            // Clicking a hover-opened menu pins it open instead of closing it.
            if (open && openedByHover.current) {
              openedByHover.current = false;
              return;
            }
            openedByHover.current = false;
            setOpen((o) => !o);
          }}
          onKeyDown={(e) => {
            if (open && e.key === "ArrowDown") {
              e.preventDefault();
              panelRef.current
                ?.querySelector<HTMLAnchorElement>("[data-course-link]")
                ?.focus();
              return;
            }
            if (!open && ["ArrowDown", "Enter", " "].includes(e.key)) {
              e.preventDefault();
              clearTimer();
              openedByHover.current = false;
              focusFirstOnOpen.current = true;
              setOpen(true);
            }
          }}
          className={triggerClassName}
          aria-expanded={open}
          aria-controls={panelId}
        >
          {label}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              key="courses-panel"
              id={panelId}
              ref={panelRef}
              className="absolute inset-x-0 top-full z-50 pt-3"
              style={{ transformOrigin: "top center" }}
              initial={{ opacity: 0, y: -10, scale: 0.985 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.28, ease: EASE_OUT },
              }}
              exit={{
                opacity: 0,
                y: -8,
                scale: 0.985,
                transition: { duration: 0.18, ease: "easeIn" },
              }}
              onKeyDown={handlePanelKeys}
            >
              <motion.div
                variants={panelStagger}
                initial="hidden"
                animate="show"
                className="grid overflow-hidden rounded-[28px] border border-black/5 bg-white text-[#111827] shadow-[0_28px_60px_-16px_rgba(11,18,32,0.4)] lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]"
              >
                {/* Category columns */}
                <motion.div
                  variants={panelStagger}
                  layoutScroll
                  className="max-h-[min(70vh,560px)] overflow-y-auto overscroll-contain p-5 xl:p-7"
                  onPointerLeave={() => setHovered(null)}
                >
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 xl:grid-cols-3">
                    {groups.map((group) => (
                      <CategoryColumn
                        key={group.id}
                        group={group}
                        hovered={hovered}
                        onHover={setHovered}
                        onNavigate={close}
                        highlightId={`${panelId}-hover`}
                        pick={pick}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Featured course */}
                <motion.aside
                  variants={panelColumn}
                  className="flex flex-col gap-4 bg-[#F5F7FB] p-5 xl:p-7 lg:rounded-l-[28px]"
                >
                  {featured && (
                    <>
                      <div>
                        <p className="text-sm font-semibold">{copy.featured}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                          {pick(
                            featured.summaryEn ?? copy.featuredFallback,
                            featured.summaryMl,
                          )}
                        </p>
                      </div>

                      <Link
                        href={`/courses/${featured.slug}`}
                        data-course-link=""
                        onClick={close}
                        className="group/feat block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#1753DA]/40"
                      >
                        <span className="relative block aspect-16/10 overflow-hidden rounded-2xl bg-linear-to-br from-[#0B57D0] to-[#093C98]">
                          {featured.coverImageUrl ? (
                            // Cover images may live on any host, which next/image would reject.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getMediaUrl(featured.coverImageUrl)}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover/feat:scale-105"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <GraduationCap className="h-12 w-12 text-white/80 transition-transform duration-500 group-hover/feat:scale-110" />
                            </span>
                          )}
                        </span>
                        <span className="mt-3 flex items-center gap-1.5 text-sm font-semibold">
                          <span className="line-clamp-1">
                            {pick(featured.titleEn, featured.titleMl)}
                          </span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/feat:-translate-y-0.5 group-hover/feat:translate-x-0.5" />
                        </span>
                        <span className="sr-only">{copy.viewCourse}</span>
                      </Link>
                    </>
                  )}

                  <Link
                    href="/courses"
                    data-course-link=""
                    onClick={close}
                    className="group/all mt-auto inline-flex items-center justify-between rounded-full bg-[#0B1220] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1753DA]/60"
                  >
                    <span>
                      {copy.allCourses} ({courses.length})
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/all:translate-x-0.5" />
                  </Link>
                </motion.aside>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function CategoryColumn({
  group,
  hovered,
  onHover,
  onNavigate,
  highlightId,
  pick,
}: {
  group: NavCourseGroup;
  hovered: string | null;
  onHover: (slug: string) => void;
  onNavigate: () => void;
  highlightId: string;
  pick: (en: string, ml: string | null | undefined) => string;
}) {
  const headingId = useId();

  return (
    <motion.section variants={panelColumn} aria-labelledby={headingId}>
      <h3 id={headingId} className="px-3 text-sm font-semibold text-[#111827]">
        {pick(group.nameEn, group.nameMl)}
      </h3>
      <ul className="mt-2 space-y-0.5">
        {group.courses.map((course) => {
          const Icon = courseIcon(course);
          return (
            <li key={course.slug}>
              <Link
                href={`/courses/${course.slug}`}
                data-course-link=""
                onClick={onNavigate}
                onPointerEnter={() => onHover(course.slug)}
                onFocus={() => onHover(course.slug)}
                className="group/item relative flex items-start gap-3 rounded-2xl p-3 outline-none focus-visible:ring-2 focus-visible:ring-[#1753DA]/40"
              >
                {/* One shared highlight that glides between hovered rows. */}
                {hovered === course.slug && (
                  <motion.span
                    layoutId={highlightId}
                    className="absolute inset-0 rounded-2xl bg-[#F2F4F7]"
                    transition={{ type: "spring", stiffness: 520, damping: 42 }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-white text-[#344054] shadow-xs transition-all duration-200 group-hover/item:-translate-y-0.5 group-hover/item:text-[#1753DA] group-hover/item:shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="relative min-w-0 pt-0.5">
                  <span className="line-clamp-2 text-sm font-semibold leading-snug text-[#111827]">
                    {pick(course.titleEn, course.titleMl)}
                  </span>
                  {course.durationText && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {course.durationText}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}

/** Accordion version of the Courses menu for the mobile drawer. */
export function MobileCoursesMenu({
  courses,
  label,
  locale,
  onNavigate,
}: {
  courses: NavCourse[];
  label: string;
  locale: string;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const regionId = useId();
  const { copy, pick } = useLocalized(locale);
  const groups = useMemo(() => groupNavCourses(courses), [courses]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="rounded-3xl bg-[#F9F9F9]">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={regionId}
          className="flex w-full items-center justify-between rounded-full px-4 py-2 text-sm font-semibold text-[#111827]"
        >
          <span>{label}</span>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="mobile-courses"
              id={regionId}
              className="overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <div className="space-y-4 px-2 pb-3 pt-1">
                {groups.map((group) => (
                  <div key={group.id}>
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      {pick(group.nameEn, group.nameMl)}
                    </p>
                    <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                      {group.courses.map((course) => {
                        const Icon = courseIcon(course);
                        return (
                          <li key={course.slug}>
                            <Link
                              href={`/courses/${course.slug}`}
                              onClick={onNavigate}
                              className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-white active:bg-white"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-white text-[#344054] shadow-xs">
                                <Icon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <span className="min-w-0">
                                <span className="line-clamp-1 text-sm font-medium text-[#111827]">
                                  {pick(course.titleEn, course.titleMl)}
                                </span>
                                {course.durationText && (
                                  <span className="block text-xs text-zinc-500">
                                    {course.durationText}
                                  </span>
                                )}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}

                <Link
                  href="/courses"
                  onClick={onNavigate}
                  className="mx-2 flex items-center justify-between rounded-full bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white"
                >
                  <span>
                    {copy.allCourses} ({courses.length})
                  </span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
