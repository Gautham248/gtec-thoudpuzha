"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

export async function updateSiteSettings(formData: FormData) {
  await run(
    () => api().admin.settings.updateSite(formData),
    forbidden(formData),
  );
}
