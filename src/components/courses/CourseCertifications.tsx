import { Award, ShieldCheck, GraduationCap, BadgeCheck, Globe2, Star, FileCheck2, Trophy } from "lucide-react";

const ICONS = [Award, ShieldCheck, GraduationCap, BadgeCheck, Globe2, Star, FileCheck2, Trophy];

export function CourseCertifications({ certifications }: { certifications: string[] }) {
  if (certifications.length === 0) return null;

  return (
    <section className="w-full bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Certifications
        </h2>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground">
          Earn industry-recognized credentials that employers trust and that strengthen your
          resume and professional profile.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {certifications.map((name, idx) => {
            const Icon = ICONS[idx % ICONS.length];
            return (
              <div
                key={name}
                className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm sm:text-base font-semibold text-foreground break-words">
                  {name}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Globally recognized credential that adds credibility to your profile.
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
