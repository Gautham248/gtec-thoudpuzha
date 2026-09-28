import Image from "next/image";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import {
  getAtAGlanceStats,
  type SiteSettingsWithCards,
} from "@/lib/site-settings";

interface StatItem {
  value: string;
  label: string;
}

function StatBlock({ stat, x }: { stat: StatItem; x: number }) {
  return (
    <RevealItem x={x} y={0} className="space-y-1">
      <p className="text-5xl sm:text-6xl font-semibold tracking-[-0.06em] text-[#072D6D]">
        <AnimatedCounter value={stat.value} />
      </p>
      <p className="text-lg sm:text-xl font-medium tracking-tight text-[#072D6D]/90">
        {stat.label}
      </p>
    </RevealItem>
  );
}

export function LegacyStatsSection({
  settings,
}: {
  settings: SiteSettingsWithCards;
}) {
  const stats = getAtAGlanceStats(settings).slice(0, 4);
  const leftStats = stats.slice(0, 2);
  const rightStats = stats.slice(2, 4);

  return (
    <section className="relative w-full bg-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* Left Stats Column */}
          <RevealGroup stagger={0.15} className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center gap-10 sm:gap-14 text-center lg:text-right">
            {leftStats.map((stat) => (
              <StatBlock key={stat.label} stat={stat} x={-30} />
            ))}
          </RevealGroup>

          {/* Central Image Column (Figma #1:223) */}
          <Reveal scale={0.94} y={20} duration={0.8} className="lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full max-w-[585px] aspect-4/3 rounded-[32px] sm:rounded-[47px] overflow-hidden shadow-2xl border border-zinc-100">
              <Image
                src="/images/figma/legacy-students-62c433.png"
                alt="G-TEC students in a collaborative learning session"
                fill
                sizes="(max-width: 1024px) 100vw, 585px"
                className="object-cover"
              />
            </div>
          </Reveal>

          {/* Right Stats Column */}
          <RevealGroup stagger={0.15} className="lg:col-span-3 flex flex-col items-center lg:items-start justify-center gap-10 sm:gap-14 text-center lg:text-left">
            {rightStats.map((stat) => (
              <StatBlock key={stat.label} stat={stat} x={30} />
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
