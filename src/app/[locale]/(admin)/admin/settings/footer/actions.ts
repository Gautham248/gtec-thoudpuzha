"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function updateFooterSettings(formData: FormData) {
  await run(
    () => api().admin.settings.updateFooter(formData),
    forbidden(formData),
  );
}
