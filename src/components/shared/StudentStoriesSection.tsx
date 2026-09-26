"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Story {
  id: string;
  name: string;
  role: string;
}

const defaultStories: Story[] = [
  {
    id: "1",
    name: "Mrs. Jyoti",
    role: "Senior developer at google",
  },
];

export function StudentStoriesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevStory = () => {
    setCurrentIndex((prev) => (prev === 0 ? defaultStories.length - 1 : prev - 1));
  };

  const nextStory = () => {
    setCurrentIndex((prev) => (prev === defaultStories.length - 1 ? 0 : prev + 1));
  };

  const current = defaultStories[currentIndex];
  const prev = defaultStories[(currentIndex - 1 + defaultStories.length) % defaultStories.length];
  const next = defaultStories[(currentIndex + 1) % defaultStories.length];

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        {/* Subtitle (Figma #1:149) */}
        <p className="text-base sm:text-xl font-semibold tracking-[-0.05em] text-[#B4B4B4]">
          Why Choose Us
        </p>

        {/* Heading (Figma #1:146) */}
        <h2 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-[-0.05em] text-[#111827]">
          Hear from our students
        </h2>

        {/* Showcase Stage (Figma #1:151, #1:159, #1:167) */}
        <div className="relative mt-12 sm:mt-16 flex items-center justify-center min-h-[360px] sm:min-h-[440px]">
          {/* Left Preview Card (Figma #1:159) */}
          <div
            onClick={prevStory}
            className="hidden lg:flex absolute left-0 w-[300px] xl:w-[380px] h-[260px] rounded-[25px] bg-[#F0F0F0] opacity-40 hover:opacity-75 transition-all cursor-pointer items-center justify-center p-6 -translate-x-12 scale-90 border border-zinc-200"
          >
            <div className="-rotate-[12.34deg] h-[75px] w-[75px] relative shrink-0">
              <Image
                src="/images/figma/testimonial-frame13.svg"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <div className="absolute bottom-4 right-4 text-right">
              <p className="text-xs font-semibold text-[#3E1515]">{prev.name}</p>
              <p className="text-[10px] text-[#3E1515]/80">{prev.role}</p>
            </div>
          </div>

          {/* Center Main Card (Figma #1:151) */}
          <div className="relative z-10 w-full max-w-[770px] min-h-[320px] sm:min-h-[380px] rounded-[34px] bg-[#F0F0F0] p-6 sm:p-10 shadow-xl border border-transparent bg-clip-padding flex flex-col justify-between items-center text-center transition-all ring-1 ring-[#093EA0]/40">
            {/* Play Icon (Figma #1:152, Frame 12 asset) */}
            <div className="my-auto flex flex-col items-center gap-4">
              <div className="-rotate-[12.34deg] h-20 w-20 sm:h-24 sm:w-24 relative shrink-0">
                <Image
                  src="/images/figma/testimonial-frame12.svg"
                  alt="Play student story"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Bottom Floating Tag (Figma #1:156) */}
            <div className="w-full flex items-center justify-between pt-4 border-t border-zinc-200/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevStory}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-700 hover:bg-zinc-100 shadow-xs"
                  aria-label="Previous story"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextStory}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-700 hover:bg-zinc-100 shadow-xs"
                  aria-label="Next story"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-xl bg-white/70 px-4 py-2 text-right shadow-xs border border-white/60">
                <p className="text-sm sm:text-base font-semibold text-[#3E1515]">
                  {current.name}
                </p>
                <p className="text-xs text-[#3E1515]/80">
                  {current.role}
                </p>
              </div>
            </div>
          </div>

          {/* Right Preview Card (Figma #1:167) */}
          <div
            onClick={nextStory}
            className="hidden lg:flex absolute right-0 w-[300px] xl:w-[380px] h-[260px] rounded-[25px] bg-[#F0F0F0] opacity-40 hover:opacity-75 transition-all cursor-pointer items-center justify-center p-6 translate-x-12 scale-90 border border-zinc-200"
          >
            <div className="-rotate-[12.34deg] h-[75px] w-[75px] relative shrink-0">
              <Image
                src="/images/figma/testimonial-frame13.svg"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <div className="absolute bottom-4 right-4 text-right">
              <p className="text-xs font-semibold text-[#3E1515]">{next.name}</p>
              <p className="text-[10px] text-[#3E1515]/80">{next.role}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
