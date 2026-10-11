// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { db } from "@/db";
import { auditLogEntry, certificationPartner } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { form, session } from "@/__tests__/pg-fixtures";
import {
  createPartner,
  deletePartner,
  movePartner,
  updatePartner,
} from "./actions";

const mockAuth = vi.hoisted(() => vi.fn());
const mockUploadFile = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@/lib/storage", () => ({ uploadFile: mockUploadFile }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const pg = db as unknown as TestDb;

const fakeLogo = (name = "logo.png") =>
  new File([Buffer.from("fake-image-data")], name, { type: "image/png" });

async function seedPartners() {
  return pg
    .insert(certificationPartner)
    .values([
      {
        id: "cp_3",
        name: "Tally",
        logoUrl: "cert-partners/333-tally.png",
        link: "https://tally.com",
        sortOrder: 2,
      },
      {
        id: "cp_1",
        name: "Adobe",
        logoUrl: "cert-partners/111-adobe.png",
        link: "https://adobe.com",
        sortOrder: 0,
      },
      {
        id: "cp_2",
        name: "SAP",
        logoUrl: "cert-partners/222-sap.png",
        link: null,
        sortOrder: 1,
      },
    ])
    .returning();
}

const ordered = () =>
  pg.query.certificationPartner.findMany({
    orderBy: (p, { asc }) => asc(p.sortOrder),
  });

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
  mockAuth.mockResolvedValue(session("staff_1", "CENTRE_STAFF"));
});

describe("CertificationPartnerStrip rendering", () => {
  test("1. renders partners in sortOrder", async () => {
    await seedPartners(); // inserted out of order on purpose

    const { CertificationPartnerStrip } =
      await import("@/components/shared/CertificationPartnerStrip");
    const html = renderToString(
      await CertificationPartnerStrip({
        heading: "Our Certification Partners",
      }),
    );

    expect(html).toContain("Adobe");
    expect(html.indexOf("Adobe")).toBeLessThan(html.indexOf("SAP"));
    expect(html.indexOf("SAP")).toBeLessThan(html.indexOf("Tally"));
  });

  test("2. partner with no link renders as non-clickable logo", async () => {
    await pg
      .insert(certificationPartner)
      .values({
        name: "SAP",
        logoUrl: "cert-partners/222-sap.png",
        link: null,
      });

    const { CertificationPartnerStrip } =
      await import("@/components/shared/CertificationPartnerStrip");
    const html = renderToString(
      await CertificationPartnerStrip({
        heading: "Our Certification Partners",
      }),
    );

    expect(html).toContain('alt="SAP"');
    expect(html).not.toContain('href="https://');
    expect(html).not.toContain("<a");
  });
});

describe("partner actions", () => {
  test("3. reordering partners persists and reflects in order", async () => {
    await seedPartners();

    await movePartner(form({ id: "cp_2", direction: "up", locale: "en" }));

    expect((await ordered()).map((p) => [p.id, p.sortOrder])).toEqual([
      ["cp_2", 0],
      ["cp_1", 1],
      ["cp_3", 2],
    ]);
    const audits = await pg.select().from(auditLogEntry);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "certificationPartner.reorder",
      entityType: "CertificationPartner",
      entityId: "cp_2",
      metadata: { direction: "up", swappedWith: "cp_1" },
    });
  });

  test("moving the first partner up is a no-op", async () => {
    await seedPartners();

    await movePartner(form({ id: "cp_1", direction: "up", locale: "en" }));

    expect((await ordered()).map((p) => p.id)).toEqual([
      "cp_1",
      "cp_2",
      "cp_3",
    ]);
    expect(await pg.select().from(auditLogEntry)).toHaveLength(0);
  });

  test("createPartner uploads the logo and appends to the order", async () => {
    await seedPartners();
    mockUploadFile.mockResolvedValue("cert-partners/new.png");

    await createPartner(
      form({
        locale: "en",
        name: "Oracle",
        link: "https://oracle.com",
        logo: fakeLogo(),
      }),
    );

    const last = (await ordered()).at(-1)!;
    expect(last).toMatchObject({
      name: "Oracle",
      logoUrl: "cert-partners/new.png",
      link: "https://oracle.com",
      sortOrder: 3,
    });
  });

  test("updatePartner keeps the old logo when no new file is given", async () => {
    await seedPartners();

    await updatePartner(
      form({ locale: "en", id: "cp_2", name: "SAP SE", link: "" }),
    );

    const sap = (await ordered()).find((p) => p.id === "cp_2")!;
    expect(sap).toMatchObject({
      name: "SAP SE",
      logoUrl: "cert-partners/222-sap.png",
    });
    expect(mockUploadFile).not.toHaveBeenCalled();
  });

  test("deletePartner removes it and fails loudly for a missing id", async () => {
    await seedPartners();

    await deletePartner(form({ locale: "en", id: "cp_3" }));
    expect((await ordered()).map((p) => p.id)).toEqual(["cp_1", "cp_2"]);

    await expect(
      deletePartner(form({ locale: "en", id: "cp_3" })),
    ).rejects.toThrow("Certification partner not found");
  });
});

describe("CertificationPartnersPage permission gate", () => {
  test("4. /admin/certification-partners is denied to a job_seeker-role user", async () => {
    mockAuth.mockResolvedValue(session("job_seeker_1", "JOB_SEEKER"));

    const { default: Page } = await import("./page");

    await expect(
      Page({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
