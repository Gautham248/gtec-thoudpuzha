import Image from "next/image";
import { getLocalizedAbout, type Locale, type SiteSettingsWithCards } from "@/lib/site-settings";
import { Award, Laptop, Users2, Sparkles } from "lucide-react";

interface AboutSectionProps {
  settings: SiteSettingsWithCards;
  locale: Locale;
  heading: string;
  photoPlaceholder: string;
}

export async function AboutSection({ settings, locale, heading, photoPlaceholder }: AboutSectionProps) {
  const about = getLocalizedAbout(settings, locale);

  const pillars = [
    { title: "Practical Lab Sessions", desc: "Hands-on projects with live industry scenarios", icon: Laptop },
    { title: "Certified Expert Faculty", desc: "Mentors with real-world technical expertise", icon: Users2 },
    { title: "Global Certification", desc: "Internationally accepted credentials & diplomas", icon: Award },
  ];

  return (
    <section aria-labelledby="about-heading" className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Visual Presentation / Photo Container */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Decorative backdrop glow */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-primary/20 to-amber-500/20 blur-xl opacity-70" aria-hidden="true" />

              {about.photoUrl ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
                  <Image
                    src={about.photoUrl}
                    alt="G-TEC Thodupuzha centre"
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
              ) : (
                <div className="relative flex aspect-[4/3] flex-col items-center justify-center rounded-3xl border border-border/80 bg-gradient-to-br from-muted/80 to-muted/40 p-8 text-center shadow-lg">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                    <Award className="size-7" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">{photoPlaceholder}</p>
                </div>
              )}

              {/* Floating Excellence Pill Badge */}
              <div className="absolute -bottom-5 -right-3 sm:-right-5 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-4 sm:p-5 shadow-xl flex items-center gap-3.5">
                <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Award className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">30+ Years Legacy</p>
                  <p className="text-sm font-medium text-muted-foreground">Excellence in IT Training</p>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative Content & Value Pillars */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary mb-3.5 w-fit">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Who We Are</span>
            </div>

            <h2
              id="about-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-[1.2]"
            >
              {heading}
            </h2>

            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
              {about.body}
            </p>

            {/* Value Pillars Mini-List */}
            <div className="mt-7 grid gap-3.5 sm:grid-cols-3 pt-5 border-t border-border/60">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div key={idx} className="flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-muted/25 p-3.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{pillar.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

