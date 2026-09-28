"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { EASE_OUT } from "@/components/motion/Reveal";

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

const copy: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const copyItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

export function HeroSection({ t }: HeroSectionProps) {
  return (
    // Dark backing so the hero's rounded bottom corners blend into the next section.
    <div className="w-full bg-[#121926]">
      <section
        aria-label="Admissions"
        className="relative isolate w-full overflow-hidden rounded-b-[28px] bg-[#0B57D0] text-white shadow-2xl sm:rounded-b-[40px] lg:rounded-b-[56px]"
      >
        {/* ── SUBTLE GEOMETRIC TRIANGLE PATTERN OVERLAY (#1:73) ── sits above the bands (z-0) */}
        <div
          className="pointer-events-none absolute inset-0 z-1 bg-cover bg-center opacity-25 mix-blend-overlay"
          style={{ backgroundImage: `url('/images/figma/hero-bg.png')` }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 z-1 bg-[radial-gradient(circle_at_-44%_8%,rgba(0,0,0,0.35)_52%,rgba(0,0,0,0)_100%)]"
          aria-hidden="true"
        />

        {/* ── SOFT LIGHT BEAMS (Figma #1:113, #1:114) ── */}
        <div
          className="pointer-events-none absolute left-[22%] -top-[14%] z-1 h-[148%] w-[39%] bg-white/10 blur-[160px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-[68%] -top-[24%] z-1 h-[148%] w-[39%] bg-white/5 blur-[160px]"
          aria-hidden="true"
        />

        {/* No z-index on the wrappers below, so the bands / photo / copy layer
            against the pattern overlay inside the section's stacking context. */}
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 px-4 sm:px-6 lg:min-h-[max(720px,min(100svh,62vw))] lg:grid-cols-12 lg:gap-8 lg:px-8">
          {/* Left Column: Headings & Call to Actions */}
          <motion.div
            variants={copy}
            initial="hidden"
            animate="show"
            className="relative z-10 flex flex-col items-start gap-5 pt-32 pb-10 sm:pt-36 lg:col-span-7 lg:justify-center lg:gap-6 lg:pt-32 lg:pb-24"
          >
            {/* Admission Badge (Figma #1:133) */}
            <motion.div
              variants={copyItem}
              className="inline-flex items-center rounded-full bg-linear-to-r from-[#9A9A9A] via-[#E8E8E8] to-[#DFDFDF] px-4 py-1.5 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-tight text-black sm:text-sm">
                {t.badge}
              </span>
            </motion.div>

            {/* Main Headline (Figma #1:110, #1:111) */}
            <motion.h1
              variants={copyItem}
              className="text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.06em] text-white sm:text-6xl lg:text-[3.5rem] xl:text-[4.25rem]"
            >
              {t.headline}
            </motion.h1>

            {/* Subhead (Figma #1:112) */}
            <motion.p
              variants={copyItem}
              className="max-w-xl text-base font-light leading-snug tracking-[-0.04em] text-white/95 sm:text-xl lg:text-[1.4rem]"
            >
              {t.subhead}
            </motion.p>

            {/* Gradient Divider Line (Figma #1:116) */}
            <motion.div
              variants={copyItem}
              className="h-px w-full max-w-md bg-linear-to-r from-white/70 via-white/40 to-transparent"
            />

            {/* Action Buttons (Figma #1:100, #1:105) */}
            <motion.div
              variants={copyItem}
              className="flex w-full flex-row items-center gap-2.5 sm:w-auto sm:gap-4"
            >
              <Link
                href="#enquiry"
                className="group flex items-center min-w-0 flex-1 justify-between gap-2 whitespace-nowrap rounded-full bg-[#0B1220] py-1.5 pl-4 pr-1.5 text-[13px] sm:flex-none sm:gap-6 sm:py-2 sm:pl-6 sm:pr-2 font-semibold text-white shadow-xl transition-all hover:bg-black active:scale-[0.98] sm:justify-start sm:text-base"
              >
                <span className="min-w-0 truncate">{t.applyNow}</span>
                <span className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-[#1753DA] text-white shadow-sm transition-transform group-hover:scale-105">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>

              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center min-w-0 flex-1 justify-between gap-2 whitespace-nowrap rounded-full bg-[#2EB700] py-1.5 pl-4 pr-1.5 text-[13px] sm:flex-none sm:gap-6 sm:py-2 sm:pl-6 sm:pr-2 font-semibold text-white shadow-xl transition-all hover:bg-[#28a100] active:scale-[0.98] sm:justify-start sm:text-base"
              >
                <span className="min-w-0 truncate">{t.whatsappUs}</span>
                <span className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-[#067914] text-white shadow-sm transition-transform group-hover:scale-105">
                  <MessageCircle className="h-4 w-4" />
                </span>
              </a>

              <a
                href={`tel:${siteConfig.phoneNumber.replace(/[^0-9+]/g, "")}`}
                className="group flex items-center min-w-0 flex-1 justify-between gap-2 whitespace-nowrap rounded-full bg-white/15 py-1.5 pl-4 pr-1.5 text-[13px] sm:flex-none sm:gap-6 sm:py-2 sm:pl-6 sm:pr-2 font-semibold text-white shadow-xl backdrop-blur-sm transition-all hover:bg-white/25 active:scale-[0.98] sm:justify-start sm:text-base"
              >
                <span className="min-w-0 truncate">{t.callNow}</span>
                <span className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-sm transition-transform group-hover:scale-105">
                  <Phone className="h-4 w-4" />
                </span>
              </a>
            </motion.div>
          </motion.div>

          {/* Right Column: photo pinned to the section floor, bands positioned relative to it */}
          <div className="relative mx-auto aspect-square w-full max-w-[560px] lg:col-span-5 lg:mx-0 lg:aspect-auto lg:max-w-none">
            <div className="absolute bottom-0 right-0 aspect-square w-full lg:w-[140%] xl:-right-[13%] xl:w-[156%]">
              {/* Burgundy 45° bands (Figma #1:68–#1:72). Drawn in the 2000×1203
                  Figma frame's coordinates, offset so the photo box lines up with
                  where it sits in that frame; overflow is clipped by the section. */}
              <motion.svg
                className="pointer-events-none absolute z-0 overflow-visible"
                style={{
                  left: "-9%",
                  top: "-13.8%",
                  width: "189.2%",
                  height: "113.8%",
                }}
                viewBox="0 0 2000 1203"
                aria-hidden="true"
                initial={{ opacity: 0, x: -60, y: 60 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 1, ease: EASE_OUT }}
              >
                <path
                  d="M4935 -3000 L-1065 3000"
                  stroke="#810000"
                  strokeWidth={205}
                />
                <path
                  d="M5305 -3000 L1690 615"
                  stroke="#810000"
                  strokeWidth={233}
                  strokeLinecap="round"
                />
              </motion.svg>

              {/* Student photo (Figma #1:122) */}
              <motion.div
                className="absolute inset-0 z-2"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: EASE_OUT }}
              >
                <Image
                  src="/images/figma/hero-person.png"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 760px"
                  className="object-contain object-bottom"
                  priority
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
