"use client";

import { useEffect, type RefObject } from "react";

/**
 * Plays a (muted) video while at least `threshold` of it is on screen and
 * pauses it when it scrolls away. If the visitor pauses it themselves, it
 * stays paused until they press play again.
 */
export function useAutoplayInView(
  ref: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  threshold = 0.4,
) {
  useEffect(() => {
    const video = ref.current;
    if (!video || !enabled) return;

    let pausingForScroll = false;
    let pausedByVisitor = false;

    const onPause = () => {
      if (!pausingForScroll) pausedByVisitor = true;
      pausingForScroll = false;
    };
    const onPlay = () => {
      pausedByVisitor = false;
    };
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (pausedByVisitor) return;
          // Autoplay can still be refused (e.g. data saver); the poster stays.
          video.play().catch(() => {});
        } else if (!video.paused) {
          pausingForScroll = true;
          video.pause();
        }
      },
      { threshold },
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
    };
  }, [ref, enabled, threshold]);
}
