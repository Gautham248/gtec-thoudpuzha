"use client";

import {
  LayoutDashboard,
  Search,
  User,
  FolderOpen,
  Home,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/portal/student-sidebar";
import { PortalBottomNav } from "@/components/portal/portal-bottom-nav";
import type { PortalRoute } from "@/lib/student-routes";

const TOP_STUDENT_ROUTES: PortalRoute[] = [
  { href: "/portal/student",          label: "Dashboard",   icon: LayoutDashboard },
  { href: "/portal/jobs",             label: "Jobs",        icon: Search },
  { href: "/portal/student/biodata",  label: "Biodata",     icon: User },
  { href: "/portal/student/resources",label: "Resources",   icon: FolderOpen },
];

interface StudentShellProps {
  children: React.ReactNode;
}

export function StudentShell({ children }: StudentShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <StudentSidebar />
      <main className="flex min-h-svh flex-1 flex-col bg-background pb-20 md:pb-0">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 md:hidden bg-background/95 backdrop-blur-md">
          <span className="font-semibold text-base">Student Portal</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Home className="size-3.5" />
            Website Home
          </Link>
        </div>
        {children}
        <PortalBottomNav routes={TOP_STUDENT_ROUTES} />
      </main>
    </SidebarProvider>
  );
}
