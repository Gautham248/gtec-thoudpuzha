import Link from "next/link";
import { ArrowRight, PhoneCall, RotateCw, WifiOff } from "lucide-react";
import { siteConfig } from "@/lib/site";

// Served by public/sw.js when a page can't be fetched. Only this HTML is
// guaranteed to be cached, so the page must not depend on images, web fonts
// or client JS: everything below is CSS and inline SVG, and "Try again" is a
// plain link back to the same address.
export default function OfflinePage() {
  return (
    <main className="relative isolate flex min-h-svh w-full items-center justify-center overflow-hidden bg-linear-to-b from-[#1759CF] from-[6.49%] to-[#0A2B68] px-4 py-12 text-white">
      {/* Geometric pattern (inline stand-in for the hero pattern image) */}
      <svg
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="offline-pattern"
            width="80"
            height="92"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-8)"
          >
            <path
              d="M0 23 40 0l40 23M0 69l40-23 40 23M40 46v46M0 23v46M80 23v46"
              fill="none"
              stroke="white"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#offline-pattern)" />
      </svg>

      {/* Burgundy 45° bands, echoing the home hero */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute -bottom-[10%] left-[55%] h-[18vmax] w-[120vmax] origin-left -rotate-45 bg-[#810000]/90" />
        <div className="absolute -bottom-[10%] left-[78%] h-[10vmax] w-[120vmax] origin-left -rotate-45 bg-[#810000]/70" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_-20%_10%,rgba(0,0,0,0.3)_45%,rgba(0,0,0,0)_100%)]"
        aria-hidden="true"
      />

      <div className="w-full max-w-md rounded-[30px] bg-white p-6 text-center text-[#111827] shadow-[0_28px_60px_-16px_rgba(11,18,32,0.5)] sm:p-10">
        <p className="text-sm font-bold tracking-[-0.02em]">
          <span className="text-[#C4161C]">G-TEC</span>{" "}
          <span className="text-[#0B57D0]">Thodupuzha</span>
        </p>

        <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF2FF]">
          <WifiOff className="size-9 text-[#1753DA]" aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
          You&apos;re offline
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4B5563] sm:text-base">
          Please check your internet connection and try again. Some pages may
          still be available from cache.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {/* "?" re-requests the current path, so this works without JS. */}
          <a
            href="?"
            className="group flex items-center justify-between gap-4 rounded-full bg-[#0B1220] py-2 pl-6 pr-2 text-sm font-semibold text-white shadow-xl transition-all hover:bg-black active:scale-[0.98] sm:text-base"
          >
            <span>Try again</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1753DA] transition-transform group-hover:rotate-90">
              <RotateCw className="size-4" aria-hidden="true" />
            </span>
          </a>

          <a
            href={`https://wa.me/${siteConfig.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-4 rounded-full bg-[#2EB700] py-2 pl-6 pr-2 text-sm font-semibold text-white shadow-xl transition-all hover:bg-[#28a100] active:scale-[0.98] sm:text-base"
          >
            <span>WhatsApp Us</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#067914] transition-transform group-hover:scale-105">
              <PhoneCall className="size-4" aria-hidden="true" />
            </span>
          </a>
          <p className="text-xs text-[#6B7280]">
            Reach us on WhatsApp once you&apos;re back online.
          </p>
        </div>

        <Link
          href="/"
          className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B57D0] hover:underline"
        >
          Go to homepage
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </main>
  );
}
