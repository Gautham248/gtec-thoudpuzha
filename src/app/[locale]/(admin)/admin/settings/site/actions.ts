"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import type { WhyCardIcon } from "@prisma/client";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

function getString(formData: FormData, name: string): string {
  return (formData.get(name) as string) ?? "";
}

function getNullableString(formData: FormData, name: string): string | null {
  const value = formData.get(name) as string | null;
  return value?.trim() ? value.trim() : null;
}

export async function updateSiteSettings(formData: FormData) {
  const authResult = await requireRole([Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const settings = await prisma.siteSettings.findFirst({
    include: { whyChooseUsCards: { orderBy: { sortOrder: "asc" } } },
  });

  if (!settings) {
    throw new Error("Site settings have not been initialized.");
  }

  const locale = localeFromFormData(formData);

  await prisma.siteSettings.update({
    where: { id: settings.id },
    data: {
      yearsInOperation: getString(formData, "yearsInOperation"),
      studentsTrained: getString(formData, "studentsTrained"),
      centresWorldwide: getString(formData, "centresWorldwide"),
      affiliations: getString(formData, "affiliations"),
      countries: getString(formData, "countries"),
      aboutBodyEn: getString(formData, "aboutBodyEn"),
      aboutBodyMl: getNullableString(formData, "aboutBodyMl"),
      aboutPhotoUrl: getNullableString(formData, "aboutPhotoUrl"),
      address: getNullableString(formData, "address"),
      mapEmbedUrl: getNullableString(formData, "mapEmbedUrl"),
      mapsUrl: getNullableString(formData, "mapsUrl"),
      whatsappNumber: getNullableString(formData, "whatsappNumber"),
      facebookUrl: getNullableString(formData, "facebookUrl"),
      instagramUrl: getNullableString(formData, "instagramUrl"),
      youtubeUrl: getNullableString(formData, "youtubeUrl"),
      linkedinUrl: getNullableString(formData, "linkedinUrl"),
      googleReviewsUrl: getNullableString(formData, "googleReviewsUrl"),
    },
  });

  for (let i = 0; i < settings.whyChooseUsCards.length; i++) {
    const card = settings.whyChooseUsCards[i];
    await prisma.whyChooseUsCard.update({
      where: { id: card.id },
      data: {
        icon: getString(formData, `card_${i}_icon`) as WhyCardIcon,
        titleEn: getString(formData, `card_${i}_titleEn`),
        titleMl: getNullableString(formData, `card_${i}_titleMl`),
        descriptionEn: getString(formData, `card_${i}_descriptionEn`),
        descriptionMl: getNullableString(formData, `card_${i}_descriptionMl`),
      },
    });
  }

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "siteSettings.update",
    entityType: "SiteSettings",
    entityId: settings.id,
    metadata: { locale },
  });

  revalidateTag("site-settings", "max");
  revalidatePath(`/${locale}/admin/settings/site`);
  revalidatePath(`/${locale}`);
}
