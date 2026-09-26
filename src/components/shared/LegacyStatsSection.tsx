import Image from "next/image";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

interface StatItem {
  number: string;
  label: string;
}

const leftStats: StatItem[] = [
  { number: "25+", label: "years of legacy" },
  { number: "3.2+", label: "millions of students" },
];

const rightStats: StatItem[] = [
  { number: "100+", label: "affiliations" },
  { number: "23+", label: "countries served" },
];

export function LegacyStatsSection() {
  return (
    <section className="relative w-full bg-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* Left Stats Column */}
          <RevealGroup stagger={0.15} className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center gap-10 sm:gap-14 text-center lg:text-right">
            {leftStats.map((stat) => (
              <RevealItem key={stat.label} x={-30} y={0} className="space-y-1">
                <p className="text-5xl sm:text-6xl font-semibold tracking-[-0.06em] text-[#072D6D]">
                  {stat.number}
                </p>
                <p className="text-lg sm:text-xl font-medium tracking-tight text-[#072D6D]/90">
                  {stat.label}
                </p>
              </RevealItem>
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
              <RevealItem key={stat.label} x={30} y={0} className="space-y-1">
                <p className="text-5xl sm:text-6xl font-semibold tracking-[-0.06em] text-[#072D6D]">
                  {stat.number}
                </p>
                <p className="text-lg sm:text-xl font-medium tracking-tight text-[#072D6D]/90">
                  {stat.label}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
