"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowUpRight, MessageCircle, Phone, Star } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { EASE_OUT } from "@/components/motion/Reveal";
import { EnquiryButton } from "@/components/enquiry/EnquiryModal";

interface HeroSectionProps {
  t: {
    badge?: string;
    headline?: string;
    subhead?: string;
    applyNow?: string;
    whatsappUs?: string;
    callNow?: string;
    yearsLabel?: string;
    ratingLabel?: string;
  };
  /** "Years in operation" from Site Settings, e.g. "25+". */
  years?: string | null;
  /** Google Reviews link from Site Settings; the rating pill links to it. */
  reviewsUrl?: string | null;
}

/** The hero models, shown in turn. */
export const HERO_MODELS = [
  "/images/gtec-hero-model.webp",
  "/images/variant-3-model.webp",
] as const;

/** How long each model stays before the next slides in. */
export const HERO_ROTATE_MS = 10_000;

const MODEL_SIZES = "(max-width: 1024px) 100vw, 760px";

/** Index into a list of `count` items that advances every `ms` while the tab is visible. */
function useRotatingIndex(count: number, ms: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count < 2) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      timer ??= setInterval(() => setIndex((i) => (i + 1) % count), ms);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const onVisibilityChange = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [count, ms]);

  return index;
}

const subscribeNever = () => () => {};

/** Shown in the hero's rating pill. Not stored in the database. */
export const GOOGLE_RATING = "4.9/5";

const copy: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const copyItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

export function HeroSection({ t, years, reviewsUrl }: HeroSectionProps) {
  const modelIndex = useRotatingIndex(HERO_MODELS.length, HERO_ROTATE_MS);
  const model = HERO_MODELS[modelIndex];
  const nextModel = HERO_MODELS[(modelIndex + 1) % HERO_MODELS.length];
  // Fetch the next model only after the first paint, so it never competes
  // with the hero image for bandwidth.
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

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
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 px-4 sm:px-6 lg:min-h-[max(600px,min(calc(100svh-89px),52vw,1000px))] lg:grid-cols-12 lg:gap-8 lg:px-8">
          {/* Left Column: Headings & Call to Actions */}
          <motion.div
            variants={copy}
            initial="hidden"
            animate="show"
            className="relative z-10 flex flex-col items-start gap-5 pt-32 pb-10 sm:pt-36 lg:col-span-7 lg:justify-center lg:gap-6 lg:pt-12 lg:pb-16"
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
              <EnquiryButton
                source="hero"
                className="group flex items-center min-w-0 flex-1 justify-between gap-2 whitespace-nowrap rounded-full bg-[#0B1220] py-1.5 pl-4 pr-1.5 text-[13px] sm:flex-none sm:gap-6 sm:py-2 sm:pl-6 sm:pr-2 font-semibold text-white shadow-xl transition-all hover:bg-black active:scale-[0.98] sm:justify-start sm:text-base"
              >
                <span className="min-w-0 truncate">{t.applyNow}</span>
                <span className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-[#1753DA] text-white shadow-sm transition-transform group-hover:scale-105">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </EnquiryButton>

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
            <div className="absolute bottom-0 right-0 aspect-square w-full lg:h-[96%] lg:w-auto lg:max-w-[140%] xl:-right-[13%] xl:max-w-[156%]">
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
                  stroke="#b60000ff"
                  strokeWidth={205}
                />
                <path
                  d="M5305 -3000 L1690 615"
                  stroke="#b60000ff"
                  strokeWidth={233}
                  strokeLinecap="round"
                />
              </motion.svg>

              {/* Student photo (Figma #1:122): the models take turns, the
                  outgoing one sliding out left as the next slides in from the
                  right. Reduced-motion users get a plain crossfade
                  (MotionProvider's reducedMotion="user" drops the x offset). */}
              <motion.div
                className="absolute inset-0 z-2"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: EASE_OUT }}
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={model}
                    data-hero-model={model}
                    className="absolute inset-0"
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.8, ease: EASE_OUT }}
                  >
                    <Image
                      src={model}
                      alt=""
                      fill
                      sizes={MODEL_SIZES}
                      className="object-contain object-bottom"
                      priority={modelIndex === 0}
                    />
                  </motion.div>
                </AnimatePresence>
                {hydrated && nextModel !== model && (
                  <Image
                    src={nextModel}
                    alt=""
                    fill
                    sizes={MODEL_SIZES}
                    loading="eager"
                    className="invisible"
                    aria-hidden="true"
                  />
                )}
              </motion.div>
            </div>
          </div>
        </div>
        {/* Years + Google rating card, bottom-right over the photo */}
        <motion.div
          className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2 text-right sm:bottom-10 sm:right-10 lg:right-14 lg:bottom-14"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT }}
        >
          {years && (
            <p className="leading-none drop-shadow-lg">
              <span className="block text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                {years}
              </span>
              <span className="mt-1 block text-sm font-light tracking-[-0.02em] text-white/95 sm:text-base lg:text-lg">
                {t.yearsLabel}
              </span>
            </p>
          )}
          {/* <RatingPill label={t.ratingLabel} href={reviewsUrl} /> */}
        </motion.div>
      </section>
    </div>
  );
}

function RatingPill({ label, href }: { label?: string; href?: string | null }) {
  const content = (
    <>
      {GOOGLE_RATING}
      <Star
        className="h-4 w-4 fill-[#FFC107] text-[#FFC107]"
        aria-label="star"
      />
      {label}
    </>
  );
  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0B1220]/85 px-3.5 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm";

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} transition-colors hover:bg-black`}
    >
      {content}
    </a>
  ) : (
    <span className={className}>{content}</span>
  );
}
