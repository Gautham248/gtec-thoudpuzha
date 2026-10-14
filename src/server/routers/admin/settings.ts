import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings, whyChooseUsCard } from "@/db/schema";
import type { WhyCardIcon } from "@/db/types";
import { logAdminAction } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";
import { validateUrlOrNull } from "@/lib/url-validation";
import {
  file,
  form,
  locale,
  looseForm,
  optionalTrimmed,
  text,
} from "@/server/form";
import { router, superAdminProcedure } from "@/server/trpc";

/** Contact and social links, as both settings forms post them. */
const linkFields = {
  mapsUrl: optionalTrimmed(),
  instagramUrl: optionalTrimmed(),
  facebookUrl: optionalTrimmed(),
  whatsappNumber: optionalTrimmed(),
  googleReviewsUrl: optionalTrimmed(),
  mapEmbedUrl: optionalTrimmed(),
  youtubeUrl: optionalTrimmed(),
  linkedinUrl: optionalTrimmed(),
};

/**
 * `mapEmbedUrl` is rendered into an <iframe src> and the rest into <a href>,
 * so both writers of these columns validate every one of them.
 */
async function validateLinks(
  input: Record<keyof typeof linkFields, string | null>,
) {
  return {
    mapsUrl: await validateUrlOrNull(input.mapsUrl, "Google Maps URL"),
    instagramUrl: await validateUrlOrNull(input.instagramUrl, "Instagram URL"),
    facebookUrl: await validateUrlOrNull(input.facebookUrl, "Facebook URL"),
    whatsappNumber: await validateUrlOrNull(input.whatsappNumber, "WhatsApp"),
    googleReviewsUrl: await validateUrlOrNull(
      input.googleReviewsUrl,
      "Google Reviews URL",
    ),
    mapEmbedUrl: await validateUrlOrNull(
      input.mapEmbedUrl,
      "Google Maps Embed URL",
    ),
    youtubeUrl: await validateUrlOrNull(input.youtubeUrl, "YouTube URL"),
    linkedinUrl: await validateUrlOrNull(input.linkedinUrl, "LinkedIn URL"),
  };
}

const str = (value: unknown) => (typeof value === "string" ? value : "");
const nullableStr = (value: unknown) =>
  typeof value === "string" ? value.trim() || null : null;

export const settingsRouter = router({
  updateFooter: superAdminProcedure
    .input(
      form({ locale: locale(), address: optionalTrimmed(), ...linkFields }),
    )
    .mutation(async ({ ctx, input }) => {
      const { locale, address } = input;
      const settings = await db.query.siteSettings.findFirst();

      if (!settings) {
        throw new Error("Site settings have not been initialized.");
      }

      const links = await validateLinks(input);

      await db
        .update(siteSettings)
        .set({ address, ...links })
        .where(eq(siteSettings.id, settings.id));

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "siteSettings.footerUpdate",
        entityType: "SiteSettings",
        entityId: settings.id,
        metadata: {
          locale,
          addressUpdated: !!address,
          mapsUrlUpdated: !!links.mapsUrl,
          instagramUrlUpdated: !!links.instagramUrl,
          facebookUrlUpdated: !!links.facebookUrl,
          whatsappNumberUpdated: !!links.whatsappNumber,
          googleReviewsUrlUpdated: !!links.googleReviewsUrl,
        },
      });

      revalidateTag("site-settings", "max");
      revalidatePath(`/${locale}/admin/settings/footer`);
      revalidatePath(`/${locale}/admin/settings/site`);
      revalidatePath(`/${locale}`);
      revalidatePath(`/${locale}/contact`);
    }),

  /**
   * The site settings page. Each "Why choose us" card posts its fields as
   * card_{index}_{field}, so the form schema keeps fields it doesn't name.
   */
  updateSite: superAdminProcedure
    .input(
      looseForm({
        locale: locale(),
        yearsInOperation: text(),
        studentsTrained: text(),
        centresWorldwide: text(),
        affiliations: text(),
        countries: text(),
        aboutBodyEn: text(),
        aboutBodyMl: optionalTrimmed(),
        aboutPhotoUrl: optionalTrimmed(),
        aboutPhotoFile: file(),
        address: optionalTrimmed(),
        ...linkFields,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { locale } = input;
      const settings = await db.query.siteSettings.findFirst({
        with: {
          whyChooseUsCards: { orderBy: (c, { asc }) => asc(c.sortOrder) },
        },
      });

      if (!settings) {
        throw new Error("Site settings have not been initialized.");
      }

      let aboutPhotoUrl = input.aboutPhotoUrl;
      const aboutPhotoFile = input.aboutPhotoFile;
      if (
        aboutPhotoFile &&
        aboutPhotoFile.size > 0 &&
        typeof aboutPhotoFile.arrayBuffer === "function"
      ) {
        try {
          const key = await uploadFile(aboutPhotoFile, "about");
          aboutPhotoUrl = `/api/media/${key}`;
        } catch (err) {
          console.error(
            "[site-settings] Failed to upload about photo file:",
            err,
          );
        }
      }

      const links = await validateLinks(input);

      await db
        .update(siteSettings)
        .set({
          yearsInOperation: input.yearsInOperation,
          studentsTrained: input.studentsTrained,
          centresWorldwide: input.centresWorldwide,
          affiliations: input.affiliations,
          countries: input.countries,
          aboutBodyEn: input.aboutBodyEn,
          aboutBodyMl: input.aboutBodyMl,
          aboutPhotoUrl,
          address: input.address,
          ...links,
        })
        .where(eq(siteSettings.id, settings.id));

      for (let i = 0; i < settings.whyChooseUsCards.length; i++) {
        const card = settings.whyChooseUsCards[i];
        const field = (name: string) => input[`card_${i}_${name}`];
        await db
          .update(whyChooseUsCard)
          .set({
            icon: str(field("icon")) as WhyCardIcon,
            titleEn: str(field("titleEn")),
            titleMl: nullableStr(field("titleMl")),
            descriptionEn: str(field("descriptionEn")),
            descriptionMl: nullableStr(field("descriptionMl")),
          })
          .where(eq(whyChooseUsCard.id, card.id));
      }

      await logAdminAction({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: "siteSettings.update",
        entityType: "SiteSettings",
        entityId: settings.id,
        metadata: { locale },
      });

      revalidateTag("site-settings", "max");
      revalidatePath(`/${locale}/admin/settings/site`);
      revalidatePath(`/${locale}`);
    }),
});
