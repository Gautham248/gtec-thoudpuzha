import {
  BookOpen,
  Users,
  Laptop,
  Award,
  Target,
  Building2,
  Sparkles,
} from "lucide-react";
import type { WhyChooseFeature } from "@/lib/course-detail-helpers";

interface WhyChooseGtecProps {
  features: WhyChooseFeature[];
  locale: string;
}

export function WhyChooseGtec({ features, locale }: WhyChooseGtecProps) {
  const isMl = locale === "ml";
  const title = isMl ? "എന്തുകൊണ്ട് ജി-ടെക് തൊടുപുഴ?" : "Why Choose G-TEC EDUCATION?";
  const subtitle = isMl
    ? "25+ വർഷത്തെ വിശ്വാസ്യതയും 800+ കേന്ദ്രങ്ങളും അടങ്ങുന്ന ആഗോള ശൃംഖല"
    : "Kerala's trusted premier training institute with 25+ years of excellence, 800+ centres worldwide & 100% placement support";

  const getIcon = (iconName: WhyChooseFeature["iconName"]) => {
    switch (iconName) {
      case "book":
        return <BookOpen className="size-5 text-primary" />;
      case "users":
        return <Users className="size-5 text-primary" />;
      case "laptop":
        return <Laptop className="size-5 text-primary" />;
      case "award":
        return <Award className="size-5 text-amber-500" />;
      case "target":
        return <Target className="size-5 text-emerald-600 dark:text-emerald-400" />;
      case "building":
        return <Building2 className="size-5 text-primary" />;
      default:
        return <Sparkles className="size-5 text-primary" />;
    }
  };

  return (
    <section className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-8 lg:p-10 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-5 mb-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
          <Building2 className="size-5" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* 6 Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
          >
            <div className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted transition-transform duration-300 group-hover:scale-110">
                {getIcon(feature.iconName)}
              </div>
              <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
