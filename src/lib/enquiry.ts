"use server";

import { api, run } from "@/server/action";
import type { EnquiryPayload as Payload } from "@/server/routers/public";

export type EnquiryPayload = Payload;

export async function submitEnquiry(payload: EnquiryPayload): Promise<void> {
  await run(() => api().public.enquiry.submit(payload));
}
