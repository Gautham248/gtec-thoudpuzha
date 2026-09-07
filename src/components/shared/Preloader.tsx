"use client";

import { useEffect, useState } from "react";

export function Preloader() {
  const [show, setShow] = useState(() => {
    try {
      const hasSeen = sessionStorage.getItem("gtec_ps");
      if (hasSeen) return false;
      sessionStorage.setItem("gtec_ps", "1");
    } catch {
      // SessionStorage might be unavailable or restricted
    }
    return true;
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) return;

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 600);

    const removeTimer = setTimeout(() => {
      setShow(false);
    }, 1000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      id="gtec-preloader"
      role="status"
      aria-label="Loading"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0b2d5e] font-sans transition-opacity duration-400 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ffbf00]">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0b2d5e"
            strokeWidth="2"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
          </svg>
        </div>
        <span className="text-3xl font-bold tracking-tight text-white">
          GTEC
        </span>
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-[#5b86b9]">
          Thodupuzha
        </span>
      </div>
    </div>
  );
}
