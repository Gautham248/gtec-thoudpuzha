"use client";

import { Home } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import type { PermissionKey } from "@/lib/admin-routes";

interface AdminShellProps {
  isSuperAdmin: boolean;
  permissions: Partial<Record<PermissionKey, boolean>>;
  children: React.ReactNode;
}

export function AdminShell({
  isSuperAdmin,
  permissions,
  children,
}: AdminShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AdminSidebar isSuperAdmin={isSuperAdmin} permissions={permissions} />
      <main className="flex min-h-svh flex-1 flex-col bg-background pb-20 md:pb-0">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 md:hidden bg-background/95 backdrop-blur-md">
          <span className="font-semibold text-base">Admin Portal</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Home className="size-3.5" />
            Website Home
          </Link>
        </div>
        {children}
        <AdminBottomNav isSuperAdmin={isSuperAdmin} permissions={permissions} />
      </main>
    </SidebarProvider>
  );
}
