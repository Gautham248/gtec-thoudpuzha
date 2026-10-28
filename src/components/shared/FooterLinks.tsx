import React from "react";
import { Link } from "@/lib/i18n/navigation";
import { ArrowUpRight, Award } from "lucide-react";
import type { NavCourse } from "@/lib/nav-courses";

export interface FooterLinkItem {
  label: string;
  href: string;
  external?: boolean;
  highlight?: boolean;
  testId?: string;
}

export const defaultQuickLinks: FooterLinkItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Courses", href: "/courses" },
  { label: "Gallery", href: "/gallery" },
  { label: "Placement", href: "/placement" },
  { label: "News & Updates", href: "/news" },
  { label: "Contact Us", href: "/contact" },
];

/** At most this many courses in the footer's Popular Courses column. */
export const FOOTER_COURSE_LIMIT = 8;

/**
 * Popular Courses links from the published course list the header also uses
 * (already featured first, then newest). Falls back to a single link to the
 * course list when there are none.
 */
export function popularCourseLinks(
  courses: NavCourse[],
  locale: string,
): FooterLinkItem[] {
  const isMl = locale === "ml";
  if (courses.length === 0) {
    return [
      {
        label: isMl ? "എല്ലാ കോഴ്സുകളും കാണുക" : "View all courses",
        href: "/courses",
      },
    ];
  }
  return courses.slice(0, FOOTER_COURSE_LIMIT).map((course) => ({
    label: isMl && course.titleMl ? course.titleMl : course.titleEn,
    href: `/courses/${course.slug}`,
  }));
}

export const defaultPortalLinks: FooterLinkItem[] = [
  { label: "Student Login", href: "/portal/sign-in" },
  { label: "Academic Resources", href: "/portal/student" },
  { label: "Job Vacancies", href: "/portal/jobs" },
  { label: "My Results", href: "/portal/student" },
  { label: "Employer Login", href: "/portal/sign-in" },
  { label: "Post a Vacancy", href: "/portal/employer/post-vacancy" },
  {
    label: "Verify Certificate",
    href: "https://gtecadmin.com",
    external: true,
    highlight: true,
    testId: "verify-certificate-link",
  },
];

interface FooterLinksColumnProps {
  title: string;
  links: FooterLinkItem[];
}

export function FooterLinksColumn({ title, links }: FooterLinksColumnProps) {
  return (
    <div className="text-left">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
        {title}
      </h3>

      <ul className="mt-5 space-y-3">
        {links.map((link) => {
          if (link.highlight) {
            return (
              <li key={link.label} className="pt-2">
                <a
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  data-testid={link.testId}
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-sky-300 transition-colors hover:text-white"
                >
                  <Award className="size-4" aria-hidden="true" />
                  <span>{link.label}</span>
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </li>
            );
          }

          if (link.external) {
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={link.testId}
                  className="inline-flex items-center gap-1 text-[15px] text-white/70 transition-colors hover:text-white"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight
                    className="size-3 opacity-60"
                    aria-hidden="true"
                  />
                </a>
              </li>
            );
          }

          return (
            <li key={link.label}>
              <Link
                href={link.href}
                data-testid={link.testId}
                className="text-[15px] text-white/70 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
