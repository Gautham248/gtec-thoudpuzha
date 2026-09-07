import Image from "next/image";
import { getCertificationPartners } from "@/lib/certification-partners";
import type { PublicCertificationPartner } from "@/lib/certification-partners";
import { getMediaUrl } from "@/lib/media";
import { ShieldCheck } from "lucide-react";

export async function CertificationPartnerStrip({
  heading,
  partners: providedPartners,
}: {
  heading: string;
  partners?: PublicCertificationPartner[];
}) {
  const partners = providedPartners ?? (await getCertificationPartners());

  if (partners.length === 0) return null;

  return (
    <section
      aria-label="Certification partners"
      className="relative border-y border-border/60 bg-muted/20 py-16 sm:py-20 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary mb-3">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Authorized Alliances</span>
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
            {heading}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            Globally recognized curriculum backed by multinational technology giants and certification bodies.
          </p>
        </div>
         
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6">
          {partners.map((partner) => {
            const img = (
              <Image
                src={getMediaUrl(partner.logoUrl)}
                alt={partner.name}
                width={140}
                height={50}
                style={{ width: "auto" }}
                className="h-9 sm:h-11 w-auto max-w-[130px] sm:max-w-[150px] object-contain opacity-75 grayscale contrast-125 transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105"
              />
            );

            return partner.link ? (
              <a
                key={partner.id}
                href={partner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-16 sm:h-20 items-center justify-center rounded-2xl border border-border/80 bg-card/80 px-5 sm:px-7 py-3 shadow-2xs backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-md hover:-translate-y-0.5"
                title={partner.name}
              >
                {img}
              </a>
            ) : (
              <div
                key={partner.id}
                className="group flex h-16 sm:h-20 items-center justify-center rounded-2xl border border-border/80 bg-card/80 px-5 sm:px-7 py-3 shadow-2xs backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-md hover:-translate-y-0.5"
                title={partner.name}
              >
                {img}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

