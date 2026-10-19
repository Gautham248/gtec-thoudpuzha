"use client";

import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { imagekitUrl } from "@/lib/home-videos";
import { useAutoplayInView } from "./useAutoplayInView";

/**
 * The landscape intro video. Plays muted on loop, with no controls overlay,
 * while it is on screen and pauses when scrolled away. Visitors who prefer
 * reduced motion get no autoplay, and controls instead.
 */
export function HomeMainVideo({
  url,
  fallback,
}: {
  url: string;
  fallback: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  useAutoplayInView(ref, !reduceMotion);

  return (
    <video
      ref={ref}
      // No controls overlay while it autoplays; reduced-motion visitors
      // (no autoplay) still get controls so they can start it themselves.
      controls={reduceMotion}
      muted
      loop
      playsInline
      preload="none"
      poster={imagekitUrl(url, "/ik-thumbnail.jpg?tr=so-3")}
      className="aspect-video h-auto w-full bg-black object-cover"
    >
      {/* Browsers try sources in order and skip any that fail, so the untransformed file is the last resort. */}
      <source
        src={imagekitUrl(url, "?tr=w-720,f-auto,q-60")}
        media="(max-width: 767px)"
      />
      <source src={imagekitUrl(url, "?tr=f-auto,q-70")} />
      <source src={url} type="video/mp4" />
      {fallback}
    </video>
  );
}
