/**
 * Idempotent upserts of the reference content in ./data.ts into `db`.
 * Run via `npm run db:seed` (./index.ts); tested against an in-memory Postgres.
 */
import { and, eq } from "drizzle-orm";
import type { Database } from "../index";
import * as t from "../schema";
import {
  CATEGORIES,
  COURSES,
  CERTIFICATION_PARTNERS,
  GALLERY_CATEGORIES,
  WHY_CHOOSE_US_CARDS,
  NEWS_EVENTS,
  FLASH_NEWS,
  GALLERY_ITEMS,
  PLACEMENT_SUPPORT_GALLERY_ITEMS,
  SKILLS,
  STUDENT_RECORDS,
  SEED_EMPLOYER,
  SEED_JOB_POSTINGS,
} from "./data";

/** Any Drizzle Postgres database built with our schema (app client or a test one). */
export type SeedDb = Pick<Database, "query" | "insert" | "update" | "delete">;

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function findOrCreateCategoryId(
  db: SeedDb,
  nameEn: string,
  nameMl: string | null,
  sortOrder: number,
): Promise<string> {
  const existing = await db.query.courseCategory.findFirst({
    where: (c, { eq }) => eq(c.nameEn, nameEn),
  });
  if (existing) {
    await db
      .update(t.courseCategory)
      .set({ nameMl, sortOrder })
      .where(eq(t.courseCategory.id, existing.id));
    return existing.id;
  }
  const [created] = await db
    .insert(t.courseCategory)
    .values({ nameEn, nameMl, sortOrder })
    .returning({ id: t.courseCategory.id });
  return created.id;
}

export async function runSeed(db: SeedDb) {
  console.log("G-TEC Thodupuzha — Production seed\n");

  /* 1. Course Categories */
  console.log("Seeding course categories...");
  const categoryIdMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const id = await findOrCreateCategoryId(
      db,
      cat.nameEn,
      cat.nameMl,
      CATEGORIES.indexOf(cat) + 1,
    );
    categoryIdMap.set(cat.nameEn, id);
  }
  console.log(`  OK: ${CATEGORIES.length} categories\n`);

  /* 2. Courses */
  console.log("Seeding courses...");
  for (const course of COURSES) {
    const categoryId = categoryIdMap.get(course.categoryName) ?? null;
    const slug = slugFromName(course.titleEn);
    const fields = {
      categoryId,
      titleEn: course.titleEn,
      titleMl: course.titleMl,
      descriptionEn: course.descriptionEn,
      descriptionMl: course.descriptionMl,
      durationText: course.durationText,
      certifications: course.certifications,
      careerOutcomesEn: course.careerOutcomesEn,
      careerOutcomesMl: course.careerOutcomesMl,
      featured: course.featured,
      status: course.status,
    };
    await db
      .insert(t.course)
      .values({ slug, ...fields })
      .onConflictDoUpdate({ target: t.course.slug, set: fields });
  }
  console.log(`  OK: ${COURSES.length} courses\n`);

  /* 3. Certification Partners */
  console.log("Seeding certification partners...");
  for (const partner of CERTIFICATION_PARTNERS) {
    const sortOrder = CERTIFICATION_PARTNERS.indexOf(partner);
    const existing = await db.query.certificationPartner.findFirst({
      where: (p, { eq }) => eq(p.name, partner.name),
    });
    if (existing) {
      await db
        .update(t.certificationPartner)
        .set({ nameMl: partner.nameMl, link: partner.link, sortOrder })
        .where(eq(t.certificationPartner.id, existing.id));
    } else {
      await db.insert(t.certificationPartner).values({
        name: partner.name,
        nameMl: partner.nameMl,
        link: partner.link,
        logoUrl: `cert-partners/${slugFromName(partner.name)}.png`,
        sortOrder,
      });
    }
  }
  console.log(`  OK: ${CERTIFICATION_PARTNERS.length} partners\n`);

  /* 4. Gallery Categories */
  console.log("Seeding gallery categories...");
  for (const gc of GALLERY_CATEGORIES) {
    const fields = {
      nameEn: gc.nameEn,
      nameMl: gc.nameMl,
      sortOrder: GALLERY_CATEGORIES.indexOf(gc),
    };
    await db
      .insert(t.galleryCategory)
      .values({ slug: gc.slug, ...fields })
      .onConflictDoUpdate({ target: t.galleryCategory.slug, set: fields });
  }
  console.log(`  OK: ${GALLERY_CATEGORIES.length} gallery categories\n`);

  /* 5. SiteSettings + At a Glance + Why Choose Us */
  console.log("Seeding site settings...");
  const settingsData = {
    yearsInOperation: "25+",
    studentsTrained: "3.2M+",
    centresWorldwide: "800+",
    affiliations: "100+",
    countries: "23",
    aboutBodyEn:
      "G-TEC Education Thodupuzha is a premier training centre offering industry-relevant courses in IT, multimedia, accounting, language, and professional development. With a commitment to quality education and student success, we have trained thousands of professionals who now work across India and abroad.\n\nOur ISO 9001:2015 certified processes, experienced faculty, and state-of-the-art facilities ensure that every student receives the best possible learning experience. We combine theoretical knowledge with practical, hands-on training to prepare students for real-world challenges.\n\nLocated in the heart of Thodupuzha, our centre serves students from across Idukki district and beyond, providing accessible, affordable, and high-quality education that transforms careers.",
    aboutBodyMl:
      "ഐടി, മൾട്ടിമീഡിയ, അക്കൗണ്ടിംഗ്, ഭാഷ, പ്രൊഫഷണൽ ഡെവലപ്മെന്റ് എന്നീ മേഖലകളിൽ വ്യവസായത്തിന് അനുയോജ്യമായ കോഴ്സുകൾ വാഗ്ദാനം ചെയ്യുന്ന ഒരു മുൻനിര പരിശീലന കേന്ദ്രമാണ് ജി-ടെക് എജ്യുക്കേഷൻ തൊടുപുഴ.",
    address:
      "G-TEC Education, Near Municipal Office, Thodupuzha, Idukki District, Kerala - 685584",
    mapsUrl:
      "https://maps.google.com/?q=G-TEC+Computer+Education,+East+End,+Thodupuzha-Udumbanoor+Rd,+near+De+Paul+Public+School,+Thodupuzha,+Kerala+685585",
    whatsappNumber: "919744221113",
  };

  const existingSettings = await db.query.siteSettings.findFirst({
    with: { whyChooseUsCards: { orderBy: (c, { asc }) => asc(c.sortOrder) } },
  });
  let settingsId: string;
  if (!existingSettings) {
    const [created] = await db
      .insert(t.siteSettings)
      .values(settingsData)
      .returning({ id: t.siteSettings.id });
    settingsId = created.id;
  } else {
    await db
      .update(t.siteSettings)
      .set(settingsData)
      .where(eq(t.siteSettings.id, existingSettings.id));
    settingsId = existingSettings.id;
  }

  /* Sync Why Choose Us cards — replace with seed data */
  for (const card of existingSettings?.whyChooseUsCards ?? []) {
    await db.delete(t.whyChooseUsCard).where(eq(t.whyChooseUsCard.id, card.id));
  }
  for (let i = 0; i < WHY_CHOOSE_US_CARDS.length; i++) {
    const card = WHY_CHOOSE_US_CARDS[i];
    await db.insert(t.whyChooseUsCard).values({
      siteSettingsId: settingsId,
      sortOrder: i,
      icon: card.icon,
      titleEn: card.titleEn,
      titleMl: card.titleMl,
      descriptionEn: card.descriptionEn,
      descriptionMl: card.descriptionMl,
    });
  }
  console.log(
    `  OK: SiteSettings + ${WHY_CHOOSE_US_CARDS.length} Why Choose Us cards\n`,
  );

  /* 6. News & Events */
  console.log("Seeding news & events...");
  for (const ne of NEWS_EVENTS) {
    const fields = {
      titleEn: ne.titleEn,
      titleMl: ne.titleMl,
      bodyEn: ne.bodyEn,
      bodyMl: ne.bodyMl,
      eventDate: ne.type === "EVENT" ? new Date("2025-08-15") : null,
      publishedAt: new Date("2025-07-01"),
    };
    await db
      .insert(t.newsEvent)
      .values({ type: ne.type, slug: ne.slug, ...fields })
      .onConflictDoUpdate({ target: t.newsEvent.slug, set: fields });
  }
  console.log(`  OK: ${NEWS_EVENTS.length} news/events\n`);

  /* 7. Flash News */
  console.log("Seeding flash news...");
  for (const fn of FLASH_NEWS) {
    const fields = {
      textMl: fn.textMl,
      link: fn.link,
      active: fn.active,
      sortOrder: fn.sortOrder,
    };
    const existing = await db.query.flashNewsItem.findFirst({
      where: (f, { eq }) => eq(f.textEn, fn.textEn),
    });
    if (existing) {
      await db
        .update(t.flashNewsItem)
        .set(fields)
        .where(eq(t.flashNewsItem.id, existing.id));
    } else {
      await db.insert(t.flashNewsItem).values({ textEn: fn.textEn, ...fields });
    }
  }
  console.log(`  OK: ${FLASH_NEWS.length} flash news items\n`);

  /* 8. Gallery Items */
  console.log("Seeding gallery items...");
  const allGalleryItems = [...GALLERY_ITEMS, ...PLACEMENT_SUPPORT_GALLERY_ITEMS];
  for (const gi of allGalleryItems) {
    const category = await db.query.galleryCategory.findFirst({
      where: (c, { eq }) => eq(c.slug, gi.categorySlug),
    });
    if (!category) {
      console.warn(`  ⚠ gallery category "${gi.categorySlug}" not found, skipping item`);
      continue;
    }

    const fields = {
      categoryId: category.id,
      mediaType: gi.mediaType,
      captionEn: gi.captionEn,
      captionMl: gi.captionMl,
      sortOrder: gi.sortOrder,
    };
    const existing = await db.query.galleryItem.findFirst({
      where: (i, { eq }) => eq(i.url, gi.url),
    });
    if (existing) {
      await db.update(t.galleryItem).set(fields).where(eq(t.galleryItem.id, existing.id));
    } else {
      await db.insert(t.galleryItem).values({ url: gi.url, ...fields });
    }
  }
  console.log(`  OK: ${allGalleryItems.length} gallery items\n`);

  /* 9. Skills */
  console.log("Seeding skills...");
  for (const skill of SKILLS) {
    await db
      .insert(t.skill)
      .values({ label: skill.label, status: skill.status })
      .onConflictDoUpdate({ target: t.skill.label, set: { status: skill.status } });
  }
  console.log(`  OK: ${SKILLS.length} skills\n`);

  /* 10. Student Records */
  console.log("Seeding student records...");
  for (const sr of STUDENT_RECORDS) {
    const fields = { fullName: sr.fullName, phone: sr.phone, email: sr.email };
    await db
      .insert(t.studentRecord)
      .values({ studentId: sr.studentId, ...fields })
      .onConflictDoUpdate({ target: t.studentRecord.studentId, set: fields });
  }
  console.log(`  OK: ${STUDENT_RECORDS.length} student records\n`);

  /* 11. Job Postings (with seed employer profile) */
  console.log("Seeding job postings...");

  await db
    .insert(t.user)
    .values({ id: SEED_EMPLOYER.userId, role: "EMPLOYER" })
    .onConflictDoNothing({ target: t.user.id });

  const employerFields = {
    companyName: SEED_EMPLOYER.companyName,
    industrySector: SEED_EMPLOYER.industrySector,
    contactPersonName: SEED_EMPLOYER.contactPersonName,
    designation: SEED_EMPLOYER.designation,
    phone: SEED_EMPLOYER.phone,
    email: SEED_EMPLOYER.email,
    companyAddress: SEED_EMPLOYER.companyAddress,
    hasWebsite: true,
    websiteUrl: SEED_EMPLOYER.websiteUrl,
    employeeCountRange: SEED_EMPLOYER.employeeCountRange,
    aboutCompany: SEED_EMPLOYER.aboutCompany,
    status: "APPROVED" as const,
  };
  await db
    .insert(t.employerProfile)
    .values({ id: SEED_EMPLOYER.id, userId: SEED_EMPLOYER.userId, ...employerFields })
    .onConflictDoUpdate({ target: t.employerProfile.userId, set: employerFields });

  const allSkills = await db.query.skill.findMany();
  const skillLabelToId = new Map(allSkills.map((s) => [s.label, s.id]));

  for (const jp of SEED_JOB_POSTINGS) {
    const skillIds = jp.skillLabels
      .map((l) => skillLabelToId.get(l))
      .filter((id): id is string => id != null);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + jp.applicationDeadlineDaysFromNow);

    const fields = {
      department: jp.department,
      salaryMin: jp.salaryMin,
      salaryMax: jp.salaryMax,
      salaryVisibility: jp.salaryVisibility,
      jobType: jp.jobType,
      skillIds,
      applicationDeadline: deadline,
      description: jp.description,
      status: "APPROVED" as const,
    };
    const existing = await db.query.jobPosting.findFirst({
      where: (p, { eq }) =>
        and(eq(p.employerId, SEED_EMPLOYER.id), eq(p.title, jp.title)),
    });
    if (existing) {
      await db
        .update(t.jobPosting)
        .set({ ...fields, deletedAt: null })
        .where(eq(t.jobPosting.id, existing.id));
    } else {
      await db
        .insert(t.jobPosting)
        .values({ employerId: SEED_EMPLOYER.id, title: jp.title, ...fields });
    }
  }
  console.log(`  OK: 1 employer + ${SEED_JOB_POSTINGS.length} job postings\n`);

  console.log("Seed complete.");
}

