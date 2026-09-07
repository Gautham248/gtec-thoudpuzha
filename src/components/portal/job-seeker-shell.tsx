"use client";

import {
  LayoutDashboard,
  Search,
  User,
  FileText,
  Home,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { JobSeekerSidebar } from "@/components/portal/job-seeker-sidebar";
import { PortalBottomNav } from "@/components/portal/portal-bottom-nav";
import type { PortalRoute } from "@/lib/student-routes";

const TOP_JOB_SEEKER_ROUTES: PortalRoute[] = [
  { href: "/portal/job-seeker",           label: "Dashboard",       icon: LayoutDashboard },
  { href: "/portal/jobs",                 label: "Jobs",            icon: Search },
  { href: "/portal/student/biodata",      label: "Biodata",         icon: User },
  { href: "/portal/student/applications", label: "Applications",    icon: FileText },
];

interface JobSeekerShellProps {
  children: React.ReactNode;
}

export function JobSeekerShell({ children }: JobSeekerShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <JobSeekerSidebar />
      <main className="flex min-h-svh flex-1 flex-col bg-background pb-20 md:pb-0">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 md:hidden bg-background/95 backdrop-blur-md">
          <span className="font-semibold text-base">Job Seeker Portal</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Home className="size-3.5" />
            Website Home
          </Link>
        </div>
        {children}
        <PortalBottomNav routes={TOP_JOB_SEEKER_ROUTES} />
      </main>
    </SidebarProvider>
  );
}
