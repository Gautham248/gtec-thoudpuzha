import { prisma } from "@/lib/db";

export interface PublicCertificationPartner {
  id: string;
  name: string;
  logoUrl: string;
  link: string | null;
}

export async function getCertificationPartners(): Promise<
  PublicCertificationPartner[]
> {
  try {
    const partners = await prisma.certificationPartner.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return partners.map((p) => ({
      id: p.id,
      name: p.name,
      logoUrl: p.logoUrl,
      link: p.link,
    }));
  } catch {
    return [];
  }
}
