import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, Home, LayoutDashboard, KeyRound, HelpCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GoBackButton } from "./go-back-button";

export const metadata: Metadata = {
  title: "403 — Forbidden | Access Restricted",
  description: "You do not have permission to access this page.",
};

const REASON_DETAILS: Record<string, { title: string; description: string }> = {
  unauthenticated: {
    title: "Authentication Required",
    description: "You need to log in to an active account before accessing this portal or administrative section.",
  },
  no_role: {
    title: "Account Role Pending",
    description: "Your user account does not currently have an assigned role (Student, Staff, or Employer). Please complete your profile registration.",
  },
  deactivated: {
    title: "Account Deactivated",
    description: "Your staff account has been deactivated by a Super Administrator. Please contact management for access reinstatement.",
  },
  no_permission: {
    title: "Administrative Permission Required",
    description: "Your staff account lacks the specific permission module required to view or edit this resource.",
  },
  role_mismatch: {
    title: "Restricted Area for Account Type",
    description: "This portal section is restricted to a different account role than your currently logged-in profile.",
  },
  forbidden: {
    title: "Insufficient Privileges",
    description: "You do not possess the required administrator credentials to view this page.",
  },
};

interface ForbiddenPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string; from?: string; detail?: string }>;
}

export default async function ForbiddenPage({
  params,
  searchParams,
}: ForbiddenPageProps) {
  const { locale } = await params;
  const { reason, from, detail } = await searchParams;

  const activeReasonKey = reason && REASON_DETAILS[reason] ? reason : "forbidden";
  const mappedReason = REASON_DETAILS[activeReasonKey];

  const displayTitle = mappedReason.title;
  const displayDescription = detail || mappedReason.description;

  const homepageUrl = `/${locale}`;
  const portalUrl = `/${locale}/portal`;
  const loginUrl = `/${locale}/sign-in`;

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,var(--color-destructive)_/_8%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg">
        {/* Main Card */}
        <div className="rounded-2xl border border-border/80 bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
          {/* Animated Shield Badge */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-inner ring-8 ring-destructive/5">
            <ShieldAlert className="size-8 animate-pulse" />
          </div>

          {/* Error Tag & Title */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-sm font-bold tracking-wider text-destructive uppercase">
              HTTP 403 • FORBIDDEN
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Access Restricted
            </h1>
          </div>

          {/* Reason Box */}
          <div className="rounded-xl border border-border/70 bg-muted/50 p-4 text-left space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive uppercase tracking-wider">
              <KeyRound className="size-3.5" />
              <span>Reason for Restriction</span>
            </div>
            <h2 className="text-base font-bold text-foreground">
              {displayTitle}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              {displayDescription}
            </p>
            {from && (
              <div className="pt-2 border-t border-border/60 text-sm text-muted-foreground font-mono truncate">
                Attempted Route: <span className="text-foreground">{from}</span>
              </div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2.5 pt-2">
            <Link
              href={homepageUrl}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto gap-2 justify-center shadow-md transition-all active:scale-[0.99]"
              )}
            >
              <Home className="size-4" />
              <span>Back to Homepage</span>
            </Link>

            <Link
              href={portalUrl}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "w-full sm:w-auto gap-2 justify-center shadow-xs"
              )}
            >
              <LayoutDashboard className="size-4" />
              <span>Go to Portal</span>
            </Link>

            <GoBackButton />
          </div>

          {/* Footer help link */}
          <div className="pt-4 border-t border-border/60 flex items-center justify-between text-sm text-muted-foreground">
            <Link
              href={loginUrl}
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Sign in with another account
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              <HelpCircle className="size-3.5" />
              <span>Need help?</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
