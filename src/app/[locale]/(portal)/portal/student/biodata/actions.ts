"use server";

import { api, run } from "@/server/action";
import type { BiodataFormData as BiodataInput } from "@/server/routers/portal/biodata";
import type { CandidateProfileWithCompletion } from "@/lib/biodata";

export type BiodataFormData = BiodataInput;

export async function saveBiodata(data: BiodataFormData) {
  return run(() => api().portal.biodata.save(data));
}

/**
 * Void-returning version of saveBiodata for use as a Client Component's
 * onSubmit prop. Server Components can't pass inline arrow functions to
 * Client Components (only real Server Actions can cross that boundary), and
 * BiodataForm's onSubmit expects `Promise<void>` (see AGENTS.md rule 15).
 */
export async function submitBiodataForm(data: BiodataFormData): Promise<void> {
  await run(() => api().portal.biodata.submit(data));
}

export type BiodataActionResult = {
  success: boolean;
  isComplete: boolean;
};

export async function getCurrentProfile(): Promise<CandidateProfileWithCompletion | null> {
  return run(() => api().portal.biodata.current());
}
