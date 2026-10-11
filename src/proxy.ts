import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { fetchRoleFromApi } from "@/lib/role-fallback";
export { fetchRoleFromApi };

const intlMiddleware = createMiddleware(routing);

export default clerkMiddleware(async (_auth, req: NextRequest) => {
  if (
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname === "/sw.js" ||
    req.nextUrl.pathname === "/robots.txt" ||
    req.nextUrl.pathname === "/sitemap.xml" ||
    req.nextUrl.pathname.startsWith("/icons/") ||
    req.nextUrl.pathname.startsWith("/images/")
  ) {
    return NextResponse.next();
  }
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|robots.txt|sitemap.xml|icons/.*|images/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ico|webmanifest)$).*)",
  ],
};
