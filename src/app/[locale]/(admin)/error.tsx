"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[admin-error]:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-sm">
          An error occurred in the admin panel. Please try again.
        </p>
        {error.digest && (
          <p className="text-sm text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
