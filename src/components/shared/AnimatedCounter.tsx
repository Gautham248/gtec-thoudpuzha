"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: string;
  className?: string;
  duration?: number;
}

interface ParsedStat {
  isNumeric: boolean;
  num: number;
  prefix: string;
  suffix: string;
  hasCommas: boolean;
  decimalPlaces: number;
  raw: string;
}

export function parseStatValue(val: string): ParsedStat {
  if (!val || typeof val !== "string") {
    return {
      isNumeric: false,
      num: 0,
      prefix: "",
      suffix: "",
      hasCommas: false,
      decimalPlaces: 0,
      raw: val ?? "",
    };
  }

  const match = val.trim().match(/^([^0-9.]*)([0-9,]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) {
    return {
      isNumeric: false,
      num: 0,
      prefix: "",
      suffix: "",
      hasCommas: false,
      decimalPlaces: 0,
      raw: val,
    };
  }

  const prefix = match[1] ?? "";
  const numStr = match[2] ?? "";
  const suffix = match[3] ?? "";
  const hasCommas = numStr.includes(",");
  const cleanNumStr = numStr.replace(/,/g, "");
  const num = parseFloat(cleanNumStr);
  const isDecimal = cleanNumStr.includes(".");
  const decimalPlaces = isDecimal ? cleanNumStr.split(".")[1].length : 0;

  if (isNaN(num)) {
    return {
      isNumeric: false,
      num: 0,
      prefix: "",
      suffix: "",
      hasCommas: false,
      decimalPlaces: 0,
      raw: val,
    };
  }

  return {
    isNumeric: true,
    num,
    prefix,
    suffix,
    hasCommas,
    decimalPlaces,
    raw: val,
  };
}

function formatNumber(
  current: number,
  hasCommas: boolean,
  decimalPlaces: number
): string {
  const rounded =
    decimalPlaces > 0
      ? current.toFixed(decimalPlaces)
      : Math.round(current).toString();
  if (hasCommas) {
    const parts = rounded.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  return rounded;
}

export function AnimatedCounter({
  value,
  className,
  duration = 1600,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const parsed = parseStatValue(value);
  const hasAnimatedRef = useRef(false);

  const [displayValue, setDisplayValue] = useState<string>(value);

  useEffect(() => {
    if (!parsed.isNumeric || hasAnimatedRef.current) {
      return;
    }

    // Respect reduced motion accessibility
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      hasAnimatedRef.current = true;
      return;
    }

    let animationFrameId: number;
    let observer: IntersectionObserver | null = null;

    const startAnimation = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;

      const startTime = performance.now();
      const targetNum = parsed.num;

      const updateCounter = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth cubic ease-out curve (fast start, smooth deceleration)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentNum = targetNum * easeProgress;

        const formatted = formatNumber(
          currentNum,
          parsed.hasCommas,
          parsed.decimalPlaces
        );
        setDisplayValue(`${parsed.prefix}${formatted}${parsed.suffix}`);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(updateCounter);
        } else {
          // Guarantee exact final value on completion
          setDisplayValue(value);
        }
      };

      // Start from 0 immediately on viewport entrance
      const initialFormatted = formatNumber(0, parsed.hasCommas, parsed.decimalPlaces);
      setDisplayValue(`${parsed.prefix}${initialFormatted}${parsed.suffix}`);

      animationFrameId = requestAnimationFrame(updateCounter);
    };

    const targetElement = ref.current;
    if (targetElement && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startAnimation();
              if (observer && targetElement) {
                observer.unobserve(targetElement);
                observer.disconnect();
              }
            }
          });
        },
        { threshold: 0.15 }
      );
      observer.observe(targetElement);
    } else {
      startAnimation();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [
    value,
    duration,
    parsed.isNumeric,
    parsed.num,
    parsed.prefix,
    parsed.suffix,
    parsed.hasCommas,
    parsed.decimalPlaces,
  ]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`.trim()}>
      {displayValue}
    </span>
  );
}
