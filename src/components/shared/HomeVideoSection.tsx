import { PlayCircle } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { HomeReelsStrip } from "@/components/shared/HomeReelsStrip";
import { HomeMainVideo } from "@/components/shared/HomeMainVideo";

interface HomeVideoSectionProps {
  /** Public ImageKit URL of the source .mp4; the section hides itself when unset. */
  videoUrl?: string;
  /** Portrait clips shown as an autoplaying strip under the main video. */
  reels?: readonly string[];
  t: {
    badge: string;
    heading: string;
    subhead: string;
    fallback: string;
  };
}

export function HomeVideoSection({
  videoUrl,
  reels = [],
  t,
}: HomeVideoSectionProps) {
  if (!videoUrl) return null;

  return (
    // Same dark band as the hero backing and category strip, so the three read as one block.
    <section
      aria-label={t.heading}
      className="relative z-20 w-full bg-[#121926] px-4 pt-14 pb-4 sm:px-6 sm:pt-20 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-white/90">
            <PlayCircle className="size-3.5 text-[#7FB2FF]" />
            <span>{t.badge}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {t.heading}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            {t.subhead}
          </p>
        </Reveal>

        <Reveal y={40} scale={0.97} amount={0.3}>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl ring-1 ring-[#0B57D0]/30 sm:rounded-3xl">
            <HomeMainVideo url={videoUrl} fallback={t.fallback} />
          </div>
        </Reveal>

        <HomeReelsStrip videos={reels} />
      </div>
    </section>
  );
}
