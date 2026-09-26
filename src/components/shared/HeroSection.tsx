"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MessageCircle,
  ArrowUpRight,
  BookOpenCheck,
  Layers,
  ShieldCheck,
  Star,
  CircleArrowRight,
} from "lucide-react";
import { siteConfig } from "@/lib/site";

interface HeroSectionProps {
  t: {
    badge?: string;
    headline?: string;
    subhead?: string;
    applyNow?: string;
    whatsappUs?: string;
    callNow?: string;
  };
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <div className="relative w-full overflow-hidden bg-[#0B57D0] text-white shadow-2xl">
      {/* ── BOLD RED GEOMETRIC ARCS (Figma #1:68, #1:69, #1:70, #1:72) ── */}
      {/* 1. Diagonal Rising Swoosh Behind Center/Body (#1:68) */}
      <div
        className="pointer-events-none absolute left-[15%] sm:left-[17.3%] top-[40%] sm:top-[46.2%] w-[75%] sm:w-[51.7%] aspect-square rounded-tr-[1457px] bg-[#810000] z-0"
        aria-hidden="true"
      />

      {/* 2. Parallel Arc Behind Shoulders (#1:70) */}
      <div
        className="pointer-events-none absolute left-[32%] sm:left-[37.7%] top-[44%] sm:top-[50.6%] w-[65%] sm:w-[45.6%] aspect-square rounded-tr-[1457px] bg-[#810000] z-0"
        aria-hidden="true"
      />

      {/* 3. Top-Right Arc Slicing Through Top Edge & Behind Navbar (#1:69) */}
      <div
        className="pointer-events-none absolute left-[56%] sm:left-[62.0%] -top-[25%] sm:-top-[16.0%] w-[60%] sm:w-[44.3%] aspect-square rounded-tr-[1457px] bg-[#810000] z-0"
        aria-hidden="true"
      />

      {/* 4. Upper Right Fill Arc (#1:72) */}
      <div
        className="pointer-events-none absolute left-[70%] sm:left-[75.4%] top-[2%] sm:top-[7.3%] w-[45%] sm:w-[34.0%] aspect-square rounded-tr-[1457px] bg-[#810000] z-0"
        aria-hidden="true"
      />

      {/* ── SUBTLE GEOMETRIC TRIANGLE PATTERN OVERLAY (#1:73 / image 7) ── */}
      <div
        className="pointer-events-none absolute inset-0 z-1 opacity-25 mix-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url('/images/figma/hero-bg.png')` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-1 bg-[radial-gradient(circle_at_-44%_8%,rgba(0,0,0,0.35)_52%,rgba(0,0,0,0)_100%)]"
        aria-hidden="true"
      />

      {/* ── SOFT LIGHT BEAMS (Figma #1:113, #1:114) ── */}
      <div
        className="pointer-events-none absolute left-[22%] -top-[14%] w-[39%] h-[148%] bg-white/10 blur-[160px] z-1"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[68%] -top-[24%] w-[39%] h-[148%] bg-white/5 blur-[160px] z-1"
        aria-hidden="true"
      />

      {/* ── MAIN HERO CONTENT (Starts with pt for the floating navbar) ── */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 lg:pb-32 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headings & Call to Actions */}
          <div className="lg:col-span-7 flex flex-col items-start gap-4 sm:gap-6 z-10">
            {/* Admission Badge (Figma #1:133) */}
            <div className="inline-flex items-center rounded-[18px] bg-linear-to-r from-[#D1D1D1] via-[#E8E8E8] to-[#DFDFDF] px-3.5 sm:px-4 py-1.5 shadow-sm">
              <span className="text-xs sm:text-sm font-semibold tracking-tight text-black">
                {t.badge || "ADMISSION OPEN FOR 2026-27"}
              </span>
            </div>

            {/* Main Headlines (Figma #1:110, #1:111) */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.06em] text-white leading-[1.05]">
                Build Skills
              </h1>
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.06em] text-white leading-[1.05]">
                Build Your Career
              </h2>
            </div>

            {/* Subhead (Figma #1:112) */}
            <p className="max-w-lg text-base sm:text-xl lg:text-2xl font-light tracking-[-0.04em] text-white/95 leading-snug">
              {t.subhead || "Industry-focused training for the careers of tomorrow."}
            </p>

            {/* Gradient Divider Line (Figma #1:116) */}
            <div className="h-[1px] w-64 sm:w-80 bg-linear-to-r from-transparent via-white/80 to-transparent my-0.5" />

            {/* Action Buttons (Figma #1:100, #1:105) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto pt-1">
              {/* Find my course button */}
              <Link
                href="/courses"
                className="group flex items-center justify-between sm:justify-start gap-4 rounded-[78px] bg-[#0B1220] hover:bg-black pl-6 pr-2 py-2 text-sm sm:text-base font-semibold text-white shadow-xl transition-all active:scale-[0.98]"
              >
                <span>Find my course</span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1753DA] text-white shadow-sm transition-transform group-hover:scale-105">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>

              {/* Whatsapp Us button */}
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between sm:justify-start gap-4 rounded-[78px] bg-[#2EB700] hover:bg-[#28a100] pl-6 pr-2 py-2 text-sm sm:text-base font-semibold text-white shadow-xl transition-all active:scale-[0.98]"
              >
                <span>{t.whatsappUs || "Whatsapp Us"}</span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#067914] text-white shadow-sm transition-transform group-hover:scale-105">
                  <MessageCircle className="h-4 w-4" />
                </span>
              </a>
            </div>

            {/* Key Feature Trust Badges (Figma #1:126, #1:127, #1:128) */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs sm:text-sm font-normal text-white/90">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="h-4 w-4 text-white" />
                <span>24 /7 Placement Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-white" />
                <span>100+ Affiliations</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-white" />
                <span>ISO 9001:2015 Certified</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image & Overlays (Figma #1:122, #1:123, #1:121, #1:117) */}
          <div className="lg:col-span-5 relative flex items-center justify-center mt-6 lg:mt-0">
            <div className="relative w-full max-w-[420px] lg:max-w-[540px] aspect-4/5 sm:aspect-square flex items-center justify-center">
              {/* Instructor / Student Image (Mrs. Jyoti) */}
              <div className="relative h-full w-full z-10">
                <Image
                  src="/images/figma/hero-person.png"
                  alt="Student at GTEC"
                  fill
                  sizes="(max-width: 768px) 100vw, 540px"
                  className="object-contain object-bottom drop-shadow-2xl"
                  priority
                />
              </div>

              {/* Floating Instructor / Placement Tag (Figma #1:123) */}
              <div className="absolute left-2 sm:left-4 bottom-20 sm:bottom-28 z-20 rounded-xl bg-white/20 backdrop-blur-md px-3.5 py-2.5 shadow-lg border border-white/30 flex items-center gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-white tracking-tight leading-tight">
                    Mrs. Jyoti
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/85 tracking-tight">
                    Senior developer at google
                  </p>
                </div>
                <CircleArrowRight className="h-5 w-5 text-white/90 shrink-0" />
              </div>

              {/* 25+ Years Stat (Figma #1:121) */}
              <div className="absolute right-0 sm:right-2 top-8 sm:top-12 z-20 text-right">
                <p className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.06em] text-white leading-none">
                  25+
                </p>
                <p className="text-xs sm:text-sm font-normal tracking-tight text-white/90">
                  years of empowering careers
                </p>
              </div>

              {/* 4.9/5 Google Rating Badge (Figma #1:117) */}
              <div className="absolute right-2 sm:right-4 bottom-4 sm:bottom-6 z-20 inline-flex items-center gap-2 rounded-xl bg-[#121926] px-3.5 py-2 shadow-xl border border-white/10">
                <span className="text-xs sm:text-sm font-medium tracking-tight text-white">
                  4.9/5 rating on google
                </span>
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
