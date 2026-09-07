"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import {
  ADMIN_ROUTES,
  isRouteVisible,
  type PermissionKey,
} from "@/lib/admin-routes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn, isRouteActive } from "@/lib/utils";

interface AdminBottomNavProps {
  isSuperAdmin: boolean;
  permissions: Partial<Record<PermissionKey, boolean>>;
}

export function AdminBottomNav({
  isSuperAdmin,
  permissions,
}: AdminBottomNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visibleRoutes = ADMIN_ROUTES.filter((route) =>
    isRouteVisible(route, isSuperAdmin, permissions),
  );
  const allHrefs = visibleRoutes.map((r) => r.href);

  // Preferred primary routes for the bottom bar
  const preferredHrefs = ["/admin", "/admin/students", "/admin/courses", "/admin/enquiries"];
  const primaryRoutes = visibleRoutes
    .filter((r) => preferredHrefs.includes(r.href))
    .slice(0, 4);

  // Fallback if preferred ones aren't available due to permissions
  if (primaryRoutes.length < 4) {
    const remaining = visibleRoutes.filter((r) => !primaryRoutes.includes(r));
    primaryRoutes.push(...remaining.slice(0, 4 - primaryRoutes.length));
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden safe-area-bottom"
      aria-label="Admin mobile navigation"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {primaryRoutes.map((route) => {
          const active = isRouteActive(route.href, pathname, allHrefs);
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-1 text-sm",
                "text-muted-foreground transition-colors hover:text-foreground",
                active && "font-semibold text-primary",
              )}
            >
              <route.icon className="size-5 shrink-0" />
              <span className="truncate max-w-full text-sm leading-tight">
                {route.label}
              </span>
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-1 text-sm",
              "text-muted-foreground transition-colors hover:text-foreground",
              visibleRoutes.some(
                (r) => !primaryRoutes.includes(r) && isRouteActive(r.href, pathname, allHrefs),
              ) && "font-semibold text-primary",
            )}
          >
            <Menu className="size-5 shrink-0" />
            <span className="truncate max-w-full text-sm leading-tight">
              More
            </span>
          </SheetTrigger>

          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-4">
            <SheetHeader className="pb-2 text-left border-b mb-3">
              <SheetTitle>Admin Navigation</SheetTitle>
            </SheetHeader>

            <div className="grid grid-cols-1 gap-1 py-2">
              {visibleRoutes.map((route) => {
                const active = isRouteActive(route.href, pathname, allHrefs);
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground",
                    )}
                  >
                    <route.icon className="size-5 shrink-0" />
                    <span>{route.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 border-t pt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
                <span className="text-sm font-medium">Account Settings</span>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
