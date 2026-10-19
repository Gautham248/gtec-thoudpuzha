import React from "react";
import Link from "next/link";
import { ChevronRight, ArrowUpRight, Award } from "lucide-react";

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

export const defaultPopularCourses: FooterLinkItem[] = [
  { label: "Python Full Stack", href: "/courses" },
  { label: "MERN Stack Development", href: "/courses" },
  { label: "Python Programming", href: "/courses" },
  { label: "Data Analytics", href: "/courses" },
  {
    label: "Artificial Intelligence & ML",
    href: "/courses",
  },
  { label: "UI/UX Design", href: "/courses" },
  { label: "Graphic Design", href: "/courses" },
  { label: "Tally Prime", href: "/courses" },
];

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
    <div className="space-y-4 text-left">
      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-sky-400 inline-block" />
        <span>{title}</span>
      </h3>

      <ul className="space-y-2.5">
        {links.map((link) => {
          if (link.highlight) {
            return (
              <li key={link.label} className="pt-1.5">
                <a
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  data-testid={link.testId}
                  className="group inline-flex items-center justify-between gap-2.5 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-sky-300 shadow-sm transition-all duration-200 hover:bg-sky-500/20 hover:border-sky-400 hover:text-white hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <Award className="size-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>{link.label}</span>
                  </div>
                  <ArrowUpRight className="size-3.5 text-sky-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
                  className="group flex items-center gap-2 text-xs sm:text-sm text-slate-300 transition-all duration-200 hover:text-sky-300 hover:translate-x-1"
                >
                  <ChevronRight className="size-3.5 text-slate-400 transition-transform duration-200 group-hover:text-sky-400 group-hover:translate-x-0.5" />
                  <span className="font-normal">{link.label}</span>
                  <ArrowUpRight className="size-3 text-slate-400 opacity-70 group-hover:opacity-100" />
                </a>
              </li>
            );
          }

          return (
            <li key={link.label}>
              <Link
                href={link.href}
                data-testid={link.testId}
                className="group flex items-center gap-2 text-xs sm:text-sm text-slate-300 transition-all duration-200 hover:text-sky-300 hover:translate-x-1"
              >
                <ChevronRight className="size-3.5 text-slate-400 transition-transform duration-200 group-hover:text-sky-400 group-hover:translate-x-0.5" />
                <span className="font-normal">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FooterLinks() {
  return (
    <>
      <FooterLinksColumn title="Quick Links" links={defaultQuickLinks} />
      <FooterLinksColumn
        title="Popular Courses"
        links={defaultPopularCourses}
      />
      <FooterLinksColumn title="Student & Portal" links={defaultPortalLinks} />
    </>
  );
}
