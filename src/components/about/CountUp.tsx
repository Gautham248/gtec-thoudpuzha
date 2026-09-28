"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/**
 * Counts a stat like "25+", "3.2M" or "1,200+" up from zero the first time it
 * scrolls into view. The server renders the real value, so it is correct
 * without JS; on the client it is only reset to zero while still off-screen.
 */
export function CountUp({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduceMotion = useReducedMotion();
  const armed = useRef(false);

  const match = /^([\d.,]+)(.*)$/.exec(value.trim());
  const target = match ? Number(match[1].replace(/,/g, "")) : NaN;
  const suffix = match?.[2] ?? "";
  const decimals = match?.[1].split(".")[1]?.length ?? 0;
  const grouped = match?.[1].includes(",") ?? false;

  const format = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouped,
    }) + suffix;

  // Arm (reset to 0) only if the stat starts below the fold.
  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion || !Number.isFinite(target)) return;
    const rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight) {
      armed.current = true;
      el.textContent = format(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || !armed.current) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (n) => {
        el.textContent = format(n);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- target/format derive from `value`
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
