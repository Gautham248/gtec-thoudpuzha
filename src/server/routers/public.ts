import { z } from "zod";
import { db } from "@/db";
import { enquiry as enquiryTable, skill } from "@/db/schema";
import { sendEnquiryNotification } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { publicProcedure, router } from "@/server/trpc";

export type SkillDto = {
  id: string;
  label: string;
  status: string;
  createdAt: Date;
};

const skillColumns = {
  id: true,
  label: true,
  status: true,
  createdAt: true,
} as const;

// Missing fields read as "", so the procedure's own messages decide what the
// visitor sees.
const field = z
  .string()
  .nullish()
  .transform((v) => v ?? "");

export const enquiryInput = z.object({
  source: field,
  fullName: field,
  phone: field,
  course: field,
  message: field,
});

export type EnquiryPayload = z.input<typeof enquiryInput>;

const indianMobileRegex = /^[6-9]\d{9}$/;

export const skillsRouter = router({
  approved: publicProcedure.query(async (): Promise<SkillDto[]> =>
    db.query.skill.findMany({
      where: (s, { eq }) => eq(s.status, "APPROVED"),
      orderBy: (s, { asc }) => asc(s.label),
      columns: skillColumns,
    }),
  ),

  byIds: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ input: ids }): Promise<SkillDto[]> => {
      if (ids.length === 0) return [];
      return db.query.skill.findMany({
        where: (s, { inArray }) => inArray(s.id, ids),
        columns: skillColumns,
      });
    }),

  /** Suggests a new skill; it stays PENDING until staff approve it. */
  createPending: publicProcedure
    .input(z.string())
    .mutation(async ({ input: label }): Promise<SkillDto> => {
      const [created] = await db
        .insert(skill)
        .values({ label, status: "PENDING" })
        .returning({
          id: skill.id,
          label: skill.label,
          status: skill.status,
          createdAt: skill.createdAt,
        });
      return created;
    }),
});

export const enquiryRouter = router({
  submit: publicProcedure
    .input(enquiryInput)
    .mutation(async ({ input: payload }): Promise<void> => {
      if (!payload.fullName.trim()) {
        throw new Error("Full name is required.");
      }

      if (!payload.phone || !indianMobileRegex.test(payload.phone)) {
        throw new Error("Enter a valid 10-digit Indian mobile number.");
      }

      if (!payload.course) {
        throw new Error("Please select a course.");
      }

      if (!payload.source) {
        throw new Error("Source is required.");
      }

      // Rate-limit: 5 per minute per IP
      const ip = await getClientIp();
      const rateCheck = checkRateLimit(`enquiry:${ip}`);
      if (!rateCheck.allowed) {
        throw new Error("Too many enquiries. Please try again later.");
      }

      const course = await db.query.course.findFirst({
        where: (c, { eq }) => eq(c.id, payload.course),
      });

      const [enquiry] = await db
        .insert(enquiryTable)
        .values({
          name: payload.fullName.trim(),
          phone: payload.phone,
          courseId: course?.id ?? null,
          message: payload.message.trim() || null,
          source: payload.source,
        })
        .returning();

      await sendEnquiryNotification({
        name: enquiry.name,
        phone: enquiry.phone,
        course: course?.titleEn ?? payload.course,
        message: enquiry.message,
        source: enquiry.source,
      });
    }),
});
