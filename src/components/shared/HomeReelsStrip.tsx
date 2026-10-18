"use client";

import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { imagekitUrl } from "@/lib/home-videos";
import { useAutoplayInView } from "./useAutoplayInView";

interface HomeReelsStripProps {
  /** ImageKit URLs of portrait (9:16) .mp4 clips. */
  videos: readonly string[];
}

/**
 * A row of portrait clips that play muted on loop. Each clip plays (and
 * downloads) only while it is on screen. Visitors who prefer reduced motion
 * get a still frame with controls instead of autoplay.
 */
export function HomeReelsStrip({ videos }: HomeReelsStripProps) {
  const reduceMotion = useReducedMotion() ?? false;

  if (videos.length === 0) return null;

  return (
    <div
      data-testid="home-reels"
      className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:mt-10 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {videos.map((url, index) => (
        <Reel key={url} url={url} index={index} autoPlay={!reduceMotion} />
      ))}
    </div>
  );
}

function Reel({
  url,
  index,
  autoPlay,
}: {
  url: string;
  index: number;
  autoPlay: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useAutoplayInView(ref, autoPlay);

  return (
    <div className="relative aspect-9/16 w-[72%] shrink-0 snap-center overflow-hidden rounded-2xl border border-white/10 bg-black shadow-xl ring-1 ring-[#0B57D0]/30 sm:w-[42%] sm:rounded-3xl lg:w-auto">
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        controls={!autoPlay}
        poster={imagekitUrl(url, "/ik-thumbnail.jpg?tr=so-1,w-480")}
        aria-label={`G-TEC student video ${index + 1}`}
        className="h-full w-full object-cover"
      >
        <source src={imagekitUrl(url, "?tr=w-480,f-auto,q-60")} />
        <source src={url} type="video/mp4" />
      </video>
    </div>
  );
}
