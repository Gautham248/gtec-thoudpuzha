// Row types inferred from the Drizzle schema. Same names and shapes as the
// `@prisma/client` model types they replace.
import type * as t from "./schema";

export type Course = typeof t.course.$inferSelect;
export type CourseCategory = typeof t.courseCategory.$inferSelect;
export type NewsEvent = typeof t.newsEvent.$inferSelect;
export type GalleryCategory = typeof t.galleryCategory.$inferSelect;
export type GalleryItem = typeof t.galleryItem.$inferSelect;
export type CertificationPartner = typeof t.certificationPartner.$inferSelect;
export type FlashNewsItem = typeof t.flashNewsItem.$inferSelect;
export type SiteSettings = typeof t.siteSettings.$inferSelect;
export type WhyChooseUsCard = typeof t.whyChooseUsCard.$inferSelect;
