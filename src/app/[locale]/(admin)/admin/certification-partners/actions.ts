"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { certificationPartner } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

export async function createPartner(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const name = formData.get("name") as string;
  const nameMl = (formData.get("nameMl") as string) || null;
  const link = (formData.get("link") as string) || null;
  const logoFile = formData.get("logo") as File | null;

  if (!name) throw new Error("Name is required");
  if (!logoFile || logoFile.size === 0)
    throw new Error("Logo file is required");

  const logoUrl = await uploadFile(logoFile, "cert-partners");

  const [maxOrder] = await db
    .select({ sortOrder: max(certificationPartner.sortOrder) })
    .from(certificationPartner);

  const [partner] = await db
    .insert(certificationPartner)
    .values({
      name,
      nameMl,
      logoUrl,
      link,
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
    })
    .returning();

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "certificationPartner.create",
    entityType: "CertificationPartner",
    entityId: partner.id,
    metadata: { name, nameMl, link },
  });

  revalidatePath(
    `/${localeFromFormData(formData)}/admin/certification-partners`,
  );
  revalidateTag("cert-partners", "max");
}

export async function updatePartner(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const nameMl = (formData.get("nameMl") as string) || null;
  const link = (formData.get("link") as string) || null;
  const logoFile = formData.get("logo") as File | null;

  if (!name) throw new Error("Name is required");

  let logoUrl: string | undefined;
  if (logoFile && logoFile.size > 0) {
    logoUrl = await uploadFile(logoFile, "cert-partners");
  }

  const partner = expectRow(
    await db
      .update(certificationPartner)
      .set({ name, nameMl, link, ...(logoUrl ? { logoUrl } : {}) })
      .where(eq(certificationPartner.id, id))
      .returning(),
    "Certification partner",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "certificationPartner.update",
    entityType: "CertificationPartner",
    entityId: partner.id,
    metadata: { name, nameMl, link, logoUpdated: !!logoUrl },
  });

  revalidatePath(
    `/${localeFromFormData(formData)}/admin/certification-partners`,
  );
  revalidateTag("cert-partners", "max");
}

export async function deletePartner(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;

  expectRow(
    await db
      .delete(certificationPartner)
      .where(eq(certificationPartner.id, id))
      .returning({ id: certificationPartner.id }),
    "Certification partner",
  );

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "certificationPartner.delete",
    entityType: "CertificationPartner",
    entityId: id,
  });

  revalidatePath(
    `/${localeFromFormData(formData)}/admin/certification-partners`,
  );
  revalidateTag("cert-partners", "max");
}

export async function movePartner(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const id = formData.get("id") as string;
  const direction = formData.get("direction") as "up" | "down";

  const partners = await db.query.certificationPartner.findMany({
    orderBy: (p, { asc }) => asc(p.sortOrder),
  });

  const index = partners.findIndex((p) => p.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= partners.length) return;

  const current = partners[index];
  const swap = partners[swapIndex];

  await db.transaction(async (tx) => {
    await tx
      .update(certificationPartner)
      .set({ sortOrder: swap.sortOrder })
      .where(eq(certificationPartner.id, current.id));
    await tx
      .update(certificationPartner)
      .set({ sortOrder: current.sortOrder })
      .where(eq(certificationPartner.id, swap.id));
  });

  await logAdminAction({
    actorUserId: authResult.userId!,
    actorRole: authResult.role,
    action: "certificationPartner.reorder",
    entityType: "CertificationPartner",
    entityId: current.id,
    metadata: { direction, swappedWith: swap.id },
  });

  revalidatePath(
    `/${localeFromFormData(formData)}/admin/certification-partners`,
  );
  revalidateTag("cert-partners", "max");
}
