"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Clock,
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import type { PublicCourse } from "@/lib/courses";
import { getCourseFallbackImage, getMediaUrl } from "@/lib/media";
import { pickLocalizedText, type Locale } from "@/lib/i18n-utils";
import { Button } from "@/components/ui/button";

interface CourseFilterSystemProps {
  courses: PublicCourse[];
  locale: Locale;
}

export type DepartmentKey =
  | "ALL"
  | "Programming"
  | "Web Development"
  | "Data Science & AI"
  | "Design"
  | "Accounting & Finance"
  | "Office & Productivity"
  | "Hardware & Networking"
  | "Language & Communications"
  | "Vocational & Professional";

export type DurationKey =
  | "ALL"
  | "1 Month"
  | "2 Months"
  | "3 Months"
  | "4 Months"
  | "6 Months"
  | "12 Months";

export type LevelKey = "ALL" | "BASIC" | "ADVANCED";

export function getCourseLevel(course: PublicCourse): "BASIC" | "ADVANCED" {
  const title = (course.titleEn || "").toLowerCase();
  const duration = (course.durationText || "").toLowerCase();

  if (
    title.includes("advanced") ||
    title.includes("adse") ||
    title.includes("full stack") ||
    title.includes("data science") ||
    title.includes("machine learning") ||
    title.includes("software engineering") ||
    duration.includes("12 month")
  ) {
    return "ADVANCED";
  }
  return "BASIC";
}

// Categories the title-keyword checks below can't derive on their own. Title matching
// runs first because the seed's broad "IT & Software" category spans several departments
// (Web, Data, Office, Programming) that only the title can tell apart.
const CATEGORY_TO_DEPARTMENT: Record<string, DepartmentKey> = {
  "multimedia & design": "Design",
  "design": "Design",
  "accounting & finance": "Accounting & Finance",
  "language & communications": "Language & Communications",
  "hardware & networking": "Hardware & Networking",
  "vocational & professional": "Vocational & Professional",
};

export function getCourseDepartment(course: PublicCourse): DepartmentKey {
  const title = (course.titleEn || "").toLowerCase();

  if (
    title.includes("web") ||
    title.includes("full stack") ||
    title.includes("react") ||
    title.includes("frontend") ||
    title.includes("backend")
  ) {
    return "Web Development";
  }
  if (
    title.includes("data") ||
    title.includes("python") ||
    title.includes("ai") ||
    title.includes("machine learning")
  ) {
    return "Data Science & AI";
  }
  if (
    title.includes("design") ||
    title.includes("multimedia") ||
    title.includes("video") ||
    title.includes("ui/ux")
  ) {
    return "Design";
  }
  if (
    title.includes("tally") ||
    title.includes("account") ||
    title.includes("finance") ||
    title.includes("gst")
  ) {
    return "Accounting & Finance";
  }
  if (
    title.includes("dca") ||
    title.includes("office") ||
    title.includes("computer application") ||
    title.includes("productivity")
  ) {
    return "Office & Productivity";
  }
  if (
    title.includes("hardware") ||
    title.includes("network") ||
    title.includes("cloud")
  ) {
    return "Hardware & Networking";
  }
  if (
    title.includes("english") ||
    title.includes("ielts") ||
    title.includes("toefl") ||
    title.includes("pte") ||
    title.includes("language") ||
    title.includes("spoken")
  ) {
    return "Language & Communications";
  }
  if (
    title.includes("programming") ||
    title.includes("software") ||
    title.includes("c++") ||
    title.includes("java")
  ) {
    return "Programming";
  }

  // Fall back to the real category relation for courses the keywords can't classify.
  const category = (course.category?.nameEn || "").toLowerCase();
  const mapped = CATEGORY_TO_DEPARTMENT[category];
  if (mapped) return mapped;
  if (category.includes("it") || category.includes("software")) {
    return "Programming";
  }

  // Unknown or uncategorized course — don't silently file it under Programming.
  return "Office & Productivity";
}

const DEPARTMENTS: { key: DepartmentKey; labelEn: string; labelMl: string }[] = [
  { key: "ALL", labelEn: "All Departments", labelMl: "എല്ലാ വിഭാഗങ്ങളും" },
  { key: "Programming", labelEn: "Programming", labelMl: "പ്രോഗ്രാമിംഗ്" },
  { key: "Web Development", labelEn: "Web Development", labelMl: "വെബ് ഡെവലപ്‌മെന്റ്" },
  { key: "Data Science & AI", labelEn: "Data Science & AI", labelMl: "ഡാറ്റ സയൻസ് & AI" },
  { key: "Design", labelEn: "Design & Multimedia", labelMl: "ഡിസൈൻ & മൾട്ടിമീഡിയ" },
  { key: "Accounting & Finance", labelEn: "Accounting & Finance", labelMl: "അക്കൗണ്ടിംഗ് & ഫിനാൻസ്" },
  { key: "Office & Productivity", labelEn: "Office & Productivity", labelMl: "ഓഫീസ് & പ്രൊഡക്ടിവിറ്റി" },
  { key: "Hardware & Networking", labelEn: "Hardware & Networking", labelMl: "ഹാർഡ്‌വെയർ & നെറ്റ്‌വർക്കിംഗ്" },
  { key: "Language & Communications", labelEn: "Language & Communications", labelMl: "ഭാഷ & കമ്മ്യൂണിക്കേഷൻ" },
  { key: "Vocational & Professional", labelEn: "Vocational & Professional", labelMl: "വൊക്കേഷണൽ & പ്രൊഫഷണൽ" },
];

const DURATIONS: { key: DurationKey; labelEn: string; labelMl: string }[] = [
  { key: "ALL", labelEn: "All Durations", labelMl: "എല്ലാ ദൈർഘ്യങ്ങളും" },
  { key: "1 Month", labelEn: "1 Month", labelMl: "1 മാസം" },
  { key: "2 Months", labelEn: "2 Months", labelMl: "2 മാസം" },
  { key: "3 Months", labelEn: "3 Months", labelMl: "3 മാസം" },
  { key: "4 Months", labelEn: "4 Months", labelMl: "4 മാസം" },
  { key: "6 Months", labelEn: "6 Months", labelMl: "6 മാസം" },
  { key: "12 Months", labelEn: "12 Months", labelMl: "12 മാസം" },
];

const LEVELS: { key: LevelKey; labelEn: string; labelMl: string }[] = [
  { key: "ALL", labelEn: "All Levels", labelMl: "എല്ലാ ലെവലുകളും" },
  { key: "BASIC", labelEn: "Basic Courses", labelMl: "ബേസിക് കോഴ്‌സുകൾ" },
  { key: "ADVANCED", labelEn: "Advanced Courses", labelMl: "അഡ്വാൻസ്ഡ് കോഴ്‌സുകൾ" },
];

export function CourseFilterSystem({ courses, locale }: CourseFilterSystemProps) {
  const isMl = locale === "ml";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentKey>("ALL");
  const [selectedDuration, setSelectedDuration] = useState<DurationKey>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>("ALL");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Check if any filter is active
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedDepartment !== "ALL" ||
    selectedDuration !== "ALL" ||
    selectedLevel !== "ALL";

  const activeFiltersCount =
    (selectedDepartment !== "ALL" ? 1 : 0) +
    (selectedDuration !== "ALL" ? 1 : 0) +
    (selectedLevel !== "ALL" ? 1 : 0) +
    (searchQuery.trim() !== "" ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("ALL");
    setSelectedDuration("ALL");
    setSelectedLevel("ALL");
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleEn = (course.titleEn || "").toLowerCase();
        const titleMl = (course.titleMl || "").toLowerCase();
        const descEn = (course.descriptionEn || "").toLowerCase();
        const outcomes = (course.careerOutcomesEn || "").toLowerCase();
        const certs = (course.certifications || []).join(" ").toLowerCase();

        const matchesSearch =
          titleEn.includes(q) ||
          titleMl.includes(q) ||
          descEn.includes(q) ||
          outcomes.includes(q) ||
          certs.includes(q);

        if (!matchesSearch) return false;
      }

      // 2. Department
      if (selectedDepartment !== "ALL") {
        const dept = getCourseDepartment(course);
        if (dept !== selectedDepartment) return false;
      }

      // 3. Duration
      if (selectedDuration !== "ALL") {
        const d = (course.durationText || "").toLowerCase();
        const target = selectedDuration.toLowerCase();
        // Check if durationText matches e.g. "6 months" or "6 Months"
        const numPart = selectedDuration.split(" ")[0]; // "6"
        if (!d.includes(numPart) && !d.includes(target)) {
          return false;
        }
      }

      // 4. Level
      if (selectedLevel !== "ALL") {
        const level = getCourseLevel(course);
        if (level !== selectedLevel) return false;
      }

      return true;
    });
  }, [courses, searchQuery, selectedDepartment, selectedDuration, selectedLevel]);

  return (
    <div className="w-full space-y-8">
      {/* ── Filter Controls Container ── */}
      <div className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-5 sm:p-6 shadow-lg transition-all">
        {/* Search Bar + Mobile Filter Toggle Button */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-4 border-b border-border/50">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isMl ? "കോഴ്‌സ്, സ്കിൽസ് തിരയുക..." : "Search courses, skills, certifications..."}
              className="w-full rounded-xl border border-border/80 bg-background/90 pl-10 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Desktop Filter Counter & Clear Button */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {isMl
                ? `${filteredCourses.length} കോഴ്‌സുകൾ ലഭ്യമാണ്`
                : `Showing ${filteredCourses.length} of ${courses.length} courses`}
            </span>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="md:hidden inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-muted"
            >
              <SlidersHorizontal className="size-3.5 text-primary" />
              <span>{isMl ? "ഫിൽട്ടറുകൾ" : "Filters"}</span>
              {activeFiltersCount > 0 && (
                <span className="size-5 rounded-full bg-primary text-[11px] font-black text-primary-foreground flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Clear Filters Button (Desktop) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/15 transition-colors"
              >
                <RotateCcw className="size-3.5" />
                <span>{isMl ? "ഫിൽട്ടർ ഒഴിവാക്കുക" : "Clear Filters"}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Dropdown Filters (Desktop & Expandable on Mobile) ── */}
        <div
          className={`${
            isMobileFiltersOpen ? "block" : "hidden md:grid"
          } grid-cols-1 md:grid-cols-3 gap-4 pt-4`}
        >
          {/* 1. Department Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="size-3.5 text-primary" />
              <span>{isMl ? "വിഭാഗം" : "Department"}</span>
            </label>
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value as DepartmentKey)}
                className="w-full appearance-none rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 pr-10 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.key} value={dept.key}>
                    {isMl ? dept.labelMl : dept.labelEn}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
          </div>

          {/* 2. Course Duration Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-amber-500" />
              <span>{isMl ? "ദൈർഘ്യം" : "Duration"}</span>
            </label>
            <div className="relative">
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value as DurationKey)}
                className="w-full appearance-none rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 pr-10 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                {DURATIONS.map((dur) => (
                  <option key={dur.key} value={dur.key}>
                    {isMl ? dur.labelMl : dur.labelEn}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
          </div>

          {/* 3. Course Level Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-purple-500" />
              <span>{isMl ? "ലെവൽ" : "Course Level"}</span>
            </label>
            <div className="relative">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as LevelKey)}
                className="w-full appearance-none rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 pr-10 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl.key} value={lvl.key}>
                    {isMl ? lvl.labelMl : lvl.labelEn}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
          </div>

          {/* Mobile Clear Button */}
          {hasActiveFilters && (
            <div className="md:hidden pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="w-full rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 font-bold text-xs"
              >
                <RotateCcw className="size-3.5 mr-2" />
                <span>{isMl ? "എല്ലാ ഫിൽട്ടറുകളും റീസെറ്റ് ചെയ്യുക" : "Reset All Filters"}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Active Filter Badges Strip ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Active Filters:</span>

          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <span>Keyword: &quot;{searchQuery}&quot;</span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="hover:opacity-75"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {selectedDepartment !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <span>Dept: {selectedDepartment}</span>
              <button
                type="button"
                onClick={() => setSelectedDepartment("ALL")}
                className="hover:opacity-75"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {selectedDuration !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>Duration: {selectedDuration}</span>
              <button
                type="button"
                onClick={() => setSelectedDuration("ALL")}
                className="hover:opacity-75"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {selectedLevel !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
              <span>Level: {selectedLevel === "BASIC" ? "Basic" : "Advanced"}</span>
              <button
                type="button"
                onClick={() => setSelectedLevel("ALL")}
                className="hover:opacity-75"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Courses Grid ── */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const title = pickLocalizedText(
              { en: course.titleEn, ml: course.titleMl },
              locale,
            );
            const description = pickLocalizedText(
              { en: course.descriptionEn, ml: course.descriptionMl },
              locale,
            );

            const department = getCourseDepartment(course);
            const level = getCourseLevel(course);

            const imageUrl = course.coverImageUrl
              ? getMediaUrl(course.coverImageUrl)
              : getCourseFallbackImage(course.slug, course.category?.nameEn);

            // Skills / Career outcomes tags
            const rawSkills = course.careerOutcomesEn
              ? course.careerOutcomesEn.split(",").map((s) => s.trim()).filter(Boolean)
              : [];

            return (
              <div
                key={course.id || course.slug}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/50 overflow-hidden"
              >
                <div>
                  {/* Image Banner */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />

                    {/* Top Level and Duration Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                      {/* Level Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold shadow-sm backdrop-blur-md ${
                          level === "ADVANCED"
                            ? "bg-purple-600/90 text-white"
                            : "bg-emerald-600/90 text-white"
                        }`}
                      >
                        <Sparkles className="size-3" />
                        <span>{level === "ADVANCED" ? "Advanced" : "Basic"}</span>
                      </span>

                      {/* Duration Badge */}
                      {course.durationText && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                          <Clock className="size-3 text-amber-400" />
                          <span>{course.durationText}</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Category Tag */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-background/90 text-foreground backdrop-blur-md px-2.5 py-1 text-xs font-bold shadow-xs truncate">
                        <GraduationCap className="size-3 text-primary shrink-0" />
                        <span className="truncate">{department}</span>
                      </span>

                      {course.certifications && course.certifications.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/90 text-primary-foreground backdrop-blur-md px-2 py-1 text-[11px] font-bold shadow-xs shrink-0">
                          <Award className="size-3" />
                          <span>Certified</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="block group-hover:text-primary transition-colors"
                    >
                      <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug line-clamp-2">
                        {title}
                      </h3>
                    </Link>

                    {description && (
                      <p className="mt-2.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {description}
                      </p>
                    )}

                    {/* Skills Covered Pills */}
                    {rawSkills.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/40">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {isMl ? "സ്കിൽസ് / കരിയർ:" : "Key Skills / Roles:"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {rawSkills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-5 sm:p-6 pt-0 mt-2">
                  <div className="flex items-center gap-2.5 pt-4 border-t border-border/50">
                    <Link
                      href={`/courses/${course.slug}#enquiry`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-xs transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-95"
                    >
                      <span>{isMl ? "ഇപ്പോൾ ചേരുക" : "Enroll Now"}</span>
                      <ArrowRight className="size-3.5" />
                    </Link>

                    <Link
                      href={`/courses/${course.slug}`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground transition-all duration-200 hover:bg-muted hover:border-primary/40 active:scale-95"
                    >
                      <BookOpen className="size-3.5 text-muted-foreground" />
                      <span>{isMl ? "വിശദാംശങ്ങൾ" : "View Details"}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-10 sm:p-14 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <Filter className="size-7" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            {isMl ? "കോഴ്‌സുകൾ ഒന്നും കണ്ടെത്തിയില്ല" : "No courses found"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {isMl
              ? "നിങ്ങൾ തിരഞ്ഞെടുത്ത ഫിൽട്ടറുകളുമായി പൊരുത്തപ്പെടുന്ന കോഴ്‌സുകൾ ലഭ്യമല്ല. ദയവായി ഫിൽട്ടറുകൾ റീസെറ്റ് ചെയ്യുക."
              : "No courses match your selected combination of department, duration, or level filters. Try clearing or changing your filters."}
          </p>
          <div className="mt-6">
            <Button
              type="button"
              onClick={resetFilters}
              className="rounded-xl font-bold px-5 py-2.5 gap-2"
            >
              <RotateCcw className="size-4" />
              <span>{isMl ? "എല്ലാ ഫിൽട്ടറുകളും ഒഴിവാക്കുക" : "Clear All Filters"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
