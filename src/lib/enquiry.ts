"use server";

import { db } from "@/db";
import { enquiry as enquiryTable } from "@/db/schema";
import { sendEnquiryNotification } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export type EnquiryPayload = {
  source: string;
  fullName: string;
  phone: string;
  course: string;
  message: string;
};

const indianMobileRegex = /^[6-9]\d{9}$/;

export async function submitEnquiry(payload: EnquiryPayload): Promise<void> {
  if (!payload.fullName || !payload.fullName.trim()) {
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
      message: payload.message?.trim() || null,
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
}
