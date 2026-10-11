"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { logAdminAction } from "@/lib/audit";
import { validateUrlOrNull } from "@/lib/url-validation";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

function getNullableString(formData: FormData, name: string): string | null {
  const value = formData.get(name) as string | null;
  return value?.trim() ? value.trim() : null;
}

export async function updateFooterSettings(formData: FormData) {
  const authResult = await requireRole([Role.SUPER_ADMIN]);
  const locale = localeFromFormData(formData);

  if (!authResult.authorized) {
    redirect(`/${locale}/forbidden`);
  }

  const settings = await db.query.siteSettings.findFirst();

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
  const instagramUrl = await validateUrlOrNull(
    rawInstagramUrl,
    "Instagram URL",
  );
  const facebookUrl = await validateUrlOrNull(rawFacebookUrl, "Facebook URL");
  const whatsappNumber = await validateUrlOrNull(rawWhatsappNumber, "WhatsApp");
  const googleReviewsUrl = await validateUrlOrNull(
    rawGoogleReviewsUrl,
    "Google Reviews URL",
  );
  const mapEmbedUrl = await validateUrlOrNull(
    rawMapEmbedUrl,
    "Google Maps Embed URL",
  );
  const youtubeUrl = await validateUrlOrNull(rawYoutubeUrl, "YouTube URL");
  const linkedinUrl = await validateUrlOrNull(rawLinkedinUrl, "LinkedIn URL");

  await db
    .update(siteSettings)
    .set({
      address,
      mapsUrl,
      instagramUrl,
      facebookUrl,
      whatsappNumber,
      googleReviewsUrl,
      mapEmbedUrl,
      youtubeUrl,
      linkedinUrl,
    })
    .where(eq(siteSettings.id, settings.id));

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
