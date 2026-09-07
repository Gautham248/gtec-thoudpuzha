"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    Sentry.captureException(error);
    console.error("[public-error]:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
        {error.digest && (
          <p className="text-sm text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          {t("tryAgain")}
        </button>
      </div>
    </main>
  );
}
