"use client";

import { UserButton } from "@clerk/nextjs";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn, isRouteActive } from "@/lib/utils";
import type { PortalRoute } from "@/lib/student-routes";

interface PortalBottomNavProps {
  routes: PortalRoute[];
}

export function PortalBottomNav({ routes }: PortalBottomNavProps) {
  const pathname = usePathname();
  const allHrefs = routes.map((r) => r.href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden safe-area-bottom"
      aria-label="Portal navigation"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {routes.map((route) => {
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
              <span className="text-sm leading-tight max-w-full truncate">
                {route.label}
              </span>
            </Link>
          );
        })}
        <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full px-1">
          <UserButton
            appearance={{ elements: { avatarBox: "size-7" } }}
          />
          <span className="text-sm leading-tight text-muted-foreground">
            Account
          </span>
        </div>
      </div>
    </nav>
  );
}
