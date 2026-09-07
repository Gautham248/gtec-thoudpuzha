"use client";

import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Users,
  Home,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EmployerSidebar } from "@/components/portal/employer-sidebar";
import { PortalBottomNav } from "@/components/portal/portal-bottom-nav";
import type { PortalRoute } from "@/lib/student-routes";

const TOP_EMPLOYER_ROUTES: PortalRoute[] = [
  { href: "/portal/employer",             label: "Dashboard",      icon: LayoutDashboard },
  { href: "/portal/employer/profile",     label: "Profile",        icon: Building2 },
  { href: "/portal/employer/post-vacancy",label: "Post Vacancy",   icon: PlusCircle },
  { href: "/portal/employer/candidates",  label: "Candidates",     icon: Users },
];

interface EmployerShellProps {
  children: React.ReactNode;
}

export function EmployerShell({ children }: EmployerShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <EmployerSidebar />
      <main className="flex min-h-svh flex-1 flex-col bg-background pb-20 md:pb-0">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 md:hidden bg-background/95 backdrop-blur-md">
          <span className="font-semibold text-base">Employer Portal</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Home className="size-3.5" />
            Website Home
          </Link>
        </div>
        {children}
        <PortalBottomNav routes={TOP_EMPLOYER_ROUTES} />
      </main>
    </SidebarProvider>
  );
}
