"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { EASE_OUT } from "@/components/motion/Reveal";

export interface Pillar {
  title: string;
  text: string;
}

interface AboutPillarsProps {
  pillars: Pillar[];
  /** Three photos; the collage rotates them as the active pillar changes. */
  images: [string, string, string];
}

// Collage slots: two stacked tiles on the left, one tall tile on the right.
const SLOTS = [
  "col-start-1 row-start-1 aspect-4/3",
  "col-start-1 row-start-2 aspect-4/3",
  "col-start-2 row-span-2 row-start-1",
] as const;

export function AboutPillars({ pillars, images }: AboutPillarsProps) {
  const [active, setActive] = useState(0);
  const baseId = useId();

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      {/* Expanding list with a vertical indicator line */}
      <ul className="relative border-l border-[#D0D5DD]">
        {pillars.map((pillar, i) => {
          const isActive = i === active;
          const panelId = `${baseId}-panel-${i}`;
          return (
            <li key={pillar.title} className="relative pl-6 sm:pl-8">
              {isActive && (
                <motion.span
                  layoutId={`${baseId}-indicator`}
                  className="absolute -left-px top-0 h-full w-[3px] rounded-full bg-[#0B57D0]"
                  transition={{ type: "spring", stiffness: 420, damping: 38 }}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-expanded={isActive}
                aria-controls={panelId}
                className={`flex w-full items-center gap-2 py-3 text-left text-2xl font-semibold tracking-[-0.04em] transition-colors sm:text-3xl ${
                  isActive
                    ? "text-[#111827]"
                    : "text-[#98A2B3] hover:text-[#475467]"
                }`}
              >
                {pillar.title}
                {isActive ? (
                  <ChevronDown className="size-5 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronRight
                    className="size-5 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    key="panel"
                    id={panelId}
                    className="overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE_OUT }}
                  >
                    <p className="max-w-md pb-5 text-sm leading-relaxed text-[#475467] sm:text-base">
                      {pillar.text}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      {/* Photo collage; images crossfade when the active pillar changes */}
      <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
        {SLOTS.map((slot, s) => {
          const src = images[(s + active) % images.length];
          return (
            <div
              key={slot}
              className={`relative overflow-hidden rounded-[20px] bg-linear-to-br from-[#1759CF] to-[#0A2B68] shadow-lg ${slot}`}
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={src}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: EASE_OUT }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 50vw, 340px"
                    className={
                      src.includes("hero-person")
                        ? "object-contain object-bottom"
                        : "object-cover"
                    }
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
