import { Award, Users, BookOpen, Briefcase, Globe, Headphones, Sparkles } from "lucide-react";
import { getLocalizedWhyCards, type Locale, type SiteSettingsWithCards } from "@/lib/site-settings";
import type { WhyCardIcon } from "@prisma/client";

const iconMap: Record<WhyCardIcon, React.ComponentType<{ className?: string }>> = {
  AWARD: Award,
  USERS: Users,
  BOOK_OPEN: BookOpen,
  BRIEFCASE: Briefcase,
  GLOBE: Globe,
  HEADPHONES: Headphones,
};

interface WhyChooseUsSectionProps {
  settings: SiteSettingsWithCards;
  locale: Locale;
  heading: string;
}

export function WhyChooseUsSection({ settings, locale, heading }: WhyChooseUsSectionProps) {
  const cards = getLocalizedWhyCards(settings, locale);

  return (
    <section aria-labelledby="why-choose-us-heading" className="relative bg-muted/30 py-16 sm:py-20 lg:py-24 border-y border-border/60 overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary mb-3.5">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>The G-TEC Advantage</span>
          </div>
          <h2
            id="why-choose-us-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground"
          >
            {heading}
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, idx) => {
            const Icon = iconMap[card.icon];
            return (
              <div
                key={card.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card/95 backdrop-blur-sm p-7 sm:p-8 shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary/40">
                      <Icon className="size-6.5" />
                    </div>
                    <span className="text-sm font-black tracking-widest text-muted-foreground/50 font-mono">
                      0{idx + 1}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg sm:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>

                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground font-normal">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40 flex items-center gap-1.5 text-sm font-bold text-primary opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
                  <span>Student Centric Standard</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

