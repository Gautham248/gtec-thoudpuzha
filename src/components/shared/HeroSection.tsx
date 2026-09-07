import Link from "next/link";
import { MessageCircle, Phone, ArrowRight, ShieldCheck, Award, GraduationCap, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

interface HeroSectionProps {
  t: {
    badge: string;
    headline: string;
    subhead: string;
    applyNow: string;
    whatsappUs: string;
    callNow: string;
  };
}

const trustHighlights = [
  { text: "30+ Years Global Legacy", icon: Award },
  { text: "ISO 9001:2015 Certified", icon: ShieldCheck },
  { text: "100% Placement Assistance", icon: GraduationCap },
  { text: "Globally Recognized", icon: CheckCircle2 },
];

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <div className="flex flex-col justify-center gap-6 sm:gap-8 py-2 sm:py-6 lg:min-h-[520px] lg:py-4">
      {/* Premium Badge with Live Pulse */}
      <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/25 bg-primary/8 px-4 py-2 text-sm font-bold text-primary shadow-2xs backdrop-blur-sm w-fit transition-colors hover:bg-primary/12">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
        <span className="tracking-wider uppercase font-extrabold text-sm">
          {t.badge}
        </span>
      </div>

      {/* Main Impact Headline */}
      <h1 className="max-w-2xl text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.18]">
        {t.headline}
      </h1>

      {/* Subhead narrative */}
      <p className="max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground font-normal">
        {t.subhead}
      </p>

      {/* Action CTA Button Cluster */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
        <Link
          href="#enquiry"
          className={cn(
            buttonVariants({ size: "lg" }),
            "relative w-full sm:w-auto justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-sm sm:text-base px-6 py-3 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 group overflow-hidden"
          )}
        >
          <span>{t.applyNow}</span>
          <ArrowRight className="ml-2 size-4.5 transition-transform group-hover:translate-x-1" />
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        </Link>
        <a
          href={`https://wa.me/${siteConfig.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto justify-center rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-5 py-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          )}
        >
          <MessageCircle className="mr-2 size-4.5" />
          {t.whatsappUs}
        </a>
        <a
          href={`tel:${siteConfig.phoneNumber}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full sm:w-auto justify-center rounded-2xl border-border/80 bg-background/80 hover:bg-muted/80 text-foreground font-bold text-sm sm:text-base px-5 py-3 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          )}
        >
          <Phone className="mr-2 size-4.5 text-muted-foreground" />
          {t.callNow}
        </a>
      </div>

      {/* Trust Highlights Strip */}
      <div className="pt-4 border-t border-border/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {trustHighlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2.5 text-sm font-semibold text-muted-foreground"
              >
                <Icon className="size-4.5 text-primary shrink-0" />
                <span className="truncate">{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

