"use client";

import { MotionConfig, motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Trigger slightly before an element is fully on screen, and only once, so
// content never re-hides while the user scrolls back up.
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

/** Honours the OS "reduce motion" setting for every animation beneath it. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Starting offset in px; the element settles at 0. */
  x?: number;
  y?: number;
  scale?: number;
  delay?: number;
  duration?: number;
  /** Fraction of the element that must be visible before it animates. */
  amount?: number;
}

/**
 * Fades a block in the first time it scrolls into view. Renders its own
 * wrapper div, so never put transform utilities (hover:translate, scale…) on
 * it directly — framer's inline transform would override them.
 */
export function Reveal({
  children,
  className,
  x = 0,
  y = 28,
  scale = 1,
  delay = 0,
  duration = 0.6,
  amount = 0.2,
}: RevealProps) {
  return (
    <motion.div
      data-reveal=""
      className={className}
      initial={{ opacity: 0, x, y, scale }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ ...VIEWPORT, amount }}
      transition={{ duration, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  amount?: number;
}

/** Container that staggers its <RevealItem> descendants into view. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  amount = 0.15,
}: RevealGroupProps) {
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ ...VIEWPORT, amount }}
    >
      {children}
    </motion.div>
  );
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  x?: number;
  y?: number;
  scale?: number;
}

export function RevealItem({
  children,
  className,
  x = 0,
  y = 24,
  scale = 1,
}: RevealItemProps) {
  const variants: Variants = {
    hidden: { opacity: 0, x, y, scale },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: 0.55, ease: EASE_OUT },
    },
  };

  return (
    <motion.div data-reveal="" className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

/** Keeps revealed content visible for visitors without JavaScript. */
export function RevealNoScript() {
  return (
    <noscript>
      <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
    </noscript>
  );
}
