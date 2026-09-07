"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

function getNullableString(formData: FormData, name: string): string | null {
  const value = formData.get(name) as string | null;
  return value?.trim() ? value.trim() : null;
}

export async function validateUrlOrNull(
  value: string | null,
  fieldName: string,
): Promise<string | null> {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // WhatsApp allows phone numbers or wa.me / api.whatsapp.com URLs
  if (fieldName === "WhatsApp") {
    const isPhone = /^(\+?[0-9\s-]{7,20})$/.test(trimmed);
    if (isPhone) return trimmed;
    try {
      const url = new URL(trimmed);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return trimmed;
      }
    } catch {
      throw new Error(
        "Invalid WhatsApp format. Enter a valid phone number (e.g. +919544229992) or wa.me link.",
      );
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`Invalid protocol for ${fieldName}. Must be http:// or https://`);
    }
    return trimmed;
  } catch {
    throw new Error(`Invalid URL for ${fieldName}. Must be a valid web URL starting with https://`);
  }
}

export async function updateFooterSettings(formData: FormData) {
  const authResult = await requireRole([Role.SUPER_ADMIN]);
  const locale = localeFromFormData(formData);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const settings = await prisma.siteSettings.findFirst();

  if (!settings) {
    throw new Error("Site settings have not been initialized.");
  }

  const address = getNullableString(formData, "address");
  const rawMapsUrl = getNullableString(formData, "mapsUrl");
  const rawInstagramUrl = getNullableString(formData, "instagramUrl");
  const rawFacebookUrl = getNullableString(formData, "facebookUrl");
  const rawWhatsappNumber = getNullableString(formData, "whatsappNumber");
  const rawGoogleReviewsUrl = getNullableString(formData, "googleReviewsUrl");
  const rawMapEmbedUrl = getNullableString(formData, "mapEmbedUrl");
  const rawYoutubeUrl = getNullableString(formData, "youtubeUrl");
  const rawLinkedinUrl = getNullableString(formData, "linkedinUrl");

  const mapsUrl = await validateUrlOrNull(rawMapsUrl, "Google Maps URL");
  const instagramUrl = await validateUrlOrNull(rawInstagramUrl, "Instagram URL");
  const facebookUrl = await validateUrlOrNull(rawFacebookUrl, "Facebook URL");
  const whatsappNumber = await validateUrlOrNull(rawWhatsappNumber, "WhatsApp");
  const googleReviewsUrl = await validateUrlOrNull(rawGoogleReviewsUrl, "Google Reviews URL");
  const mapEmbedUrl = await validateUrlOrNull(rawMapEmbedUrl, "Google Maps Embed URL");
  const youtubeUrl = await validateUrlOrNull(rawYoutubeUrl, "YouTube URL");
  const linkedinUrl = await validateUrlOrNull(rawLinkedinUrl, "LinkedIn URL");

  await prisma.siteSettings.update({
    where: { id: settings.id },
    data: {
      address,
      mapsUrl,
      instagramUrl,
      facebookUrl,
      whatsappNumber,
      googleReviewsUrl,
      mapEmbedUrl,
      youtubeUrl,
      linkedinUrl,
    },
  });

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "siteSettings.footerUpdate",
    entityType: "SiteSettings",
    entityId: settings.id,
    metadata: {
      locale,
      addressUpdated: !!address,
      mapsUrlUpdated: !!mapsUrl,
      instagramUrlUpdated: !!instagramUrl,
      facebookUrlUpdated: !!facebookUrl,
      whatsappNumberUpdated: !!whatsappNumber,
      googleReviewsUrlUpdated: !!googleReviewsUrl,
    },
  });

  revalidateTag("site-settings", "max");
  revalidatePath(`/${locale}/admin/settings/footer`);
  revalidatePath(`/${locale}/admin/settings/site`);
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/contact`);
}
