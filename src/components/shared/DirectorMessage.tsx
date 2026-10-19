import Image from "next/image";
import { Quote } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

interface DirectorMessageProps {
  t: {
    eyebrow: string;
    quote: string;
    name: string;
    role: string;
  };
}

/** The director's quote with his photo; used on the homepage and About page. */
export function DirectorMessage({ t }: DirectorMessageProps) {
  return (
    <section
      aria-label={t.eyebrow}
      className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8"
    >
      <Reveal y={40}>
        <figure className="relative grid items-center gap-8 overflow-hidden rounded-[32px] bg-linear-to-br from-[#1759CF] to-[#0A2B68] px-6 py-10 text-white shadow-2xl sm:px-12 sm:py-14 md:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] md:gap-12 lg:rounded-[40px] lg:px-16 lg:py-16">
          <div
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border-[28px] border-white/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-tr-[1457px] bg-[#2EB700]/20"
            aria-hidden="true"
          />

          <div className="relative mx-auto aspect-[1082/1454] w-48 overflow-hidden rounded-3xl shadow-xl ring-4 ring-white/15 sm:w-56 md:mx-0 md:w-full">
            <Image
              src="/images/director.webp"
              alt={`${t.name}, ${t.role}`}
              fill
              sizes="(max-width: 768px) 224px, 320px"
              className="object-cover"
            />
          </div>

          <div className="relative">
            <Quote
              className="size-12 fill-white/15 text-white/40 sm:size-16"
              aria-hidden="true"
            />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 sm:text-sm">
              {t.eyebrow}
            </p>
            <blockquote className="mt-4 max-w-4xl text-xl font-medium leading-[1.45] tracking-[-0.02em] sm:text-2xl lg:text-[28px]">
              {t.quote}
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4">
              <span className="h-px w-10 bg-[#2EB700]" aria-hidden="true" />
              <span>
                <span className="block text-base font-bold tracking-tight sm:text-lg">
                  {t.name}
                </span>
                <span className="block text-sm text-white/70">{t.role}</span>
              </span>
            </figcaption>
          </div>
        </figure>
      </Reveal>
    </section>
  );
}
