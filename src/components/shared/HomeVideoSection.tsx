import { PlayCircle } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

interface HomeVideoSectionProps {
  /** Public ImageKit URL of the source .mp4; the section hides itself when unset. */
  videoUrl?: string;
  t: {
    badge: string;
    heading: string;
    subhead: string;
    fallback: string;
  };
}

/**
 * ImageKit transforms a video on the fly from URL parameters: `tr=` for
 * resize / format / quality, and `/ik-thumbnail.jpg` for a still frame.
 */
function imagekitUrl(base: string, suffix: string) {
  return `${base.split("?")[0]}${suffix}`;
}

export function HomeVideoSection({ videoUrl, t }: HomeVideoSectionProps) {
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
            <video
              controls
              playsInline
              preload="none"
              poster={imagekitUrl(videoUrl, "/ik-thumbnail.jpg?tr=so-3")}
              className="aspect-video h-auto w-full bg-black object-cover"
            >
              {/* Browsers try sources in order and skip any that fail, so the untransformed file is the last resort. */}
              <source
                src={imagekitUrl(videoUrl, "?tr=w-720,f-auto,q-60")}
                media="(max-width: 767px)"
              />
              <source src={imagekitUrl(videoUrl, "?tr=f-auto,q-70")} />
              <source src={videoUrl} type="video/mp4" />
              {t.fallback}
            </video>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
