"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Roughly five lines at the intro's width; longer text gets a toggle. */
const COLLAPSE_AFTER_CHARS = 420;

export function AboutIntro({
  eyebrow,
  heading,
  body,
  readMore,
  showLess,
}: {
  eyebrow: string;
  heading: string;
  body: string;
  readMore: string;
  showLess: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const paragraphs = body
    .split(/\n\s*\n|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const collapsible = body.length > COLLAPSE_AFTER_CHARS;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#0B57D0]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.05em] text-[#111827] sm:text-4xl">
          {heading}
        </h2>
      </div>

      <div>
        <div
          id={bodyId}
          className={`relative space-y-4 text-base leading-relaxed text-[#475467] sm:text-lg ${
            collapsible && !expanded
              ? "max-h-[8.75em] overflow-hidden mask-[linear-gradient(to_bottom,black_55%,transparent)]"
              : ""
          }`}
        >
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {collapsible && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-controls={bodyId}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B57D0] hover:underline"
          >
            {expanded ? showLess : readMore}
            <ChevronDown
              className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </div>
  );
}
