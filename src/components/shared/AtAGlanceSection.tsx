import { Building2, GraduationCap, Globe, Award, Users, Sparkles } from "lucide-react";
import { getAtAGlanceStats, type SiteSettingsWithCards } from "@/lib/site-settings";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";

const statIcons: Record<number, React.ComponentType<{ className?: string }>> = {
  0: Building2,
  1: GraduationCap,
  2: Globe,
  3: Award,
  4: Users,
};

interface AtAGlanceSectionProps {
  settings: SiteSettingsWithCards;
  heading: string;
}

export function AtAGlanceSection({ settings, heading }: AtAGlanceSectionProps) {
  const stats = getAtAGlanceStats(settings);

  return (
    <section aria-labelledby="at-a-glance-heading" className="relative border-y border-border/60 bg-muted/25 py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary mb-3.5">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Proven Track Record</span>
          </div>
          <h2
            id="at-a-glance-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground"
          >
            {heading}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-5" role="list">
          {stats.map((stat, i) => {
            const Icon = statIcons[i] ?? Award;
            return (
              <div
                key={stat.label}
                role="listitem"
                className="group relative flex flex-col items-center rounded-2xl border border-border/70 bg-card/90 backdrop-blur-md p-5 sm:p-6 text-center shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="mb-3.5 flex size-12 sm:size-13 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary/40">
                  <Icon className="size-5 sm:size-6" />
                </div>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  <AnimatedCounter value={stat.value} />
                </span>
                <span className="mt-1.5 text-sm font-semibold text-muted-foreground leading-snug">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

