// @vitest-environment node

import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { createPartner as _createPartner, updatePartner as _updatePartner, deletePartner as _deletePartner, movePartner } from "./actions";

/* ─── Hoisted mocks ─── */

const mockAuth = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockAggregate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockAuditCreate = vi.hoisted(() => vi.fn());
const mockUploadFile = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));

vi.mock("@/lib/db", () => ({
  prisma: {
    certificationPartner: {
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
      findMany: mockFindMany,
      aggregate: mockAggregate,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    auditLogEntry: { create: mockAuditCreate },
  },
}));

vi.mock("@/lib/audit", () => ({ logAdminAction: mockAuditCreate }));

vi.mock("@/lib/storage", () => ({ uploadFile: mockUploadFile }));

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath, revalidateTag: vi.fn() }));

/* ─── Helpers ─── */

function setMockAuth(userId: string, role: string) {
  mockAuth.mockResolvedValue({
    userId,
    sessionClaims: { metadata: { role } },
  });
}

function _fakeFile(name: string, type: string): File {
  return new File([Buffer.from("fake-image-data")], name, { type });
}

function createFormData(
  overrides: Record<string, string | File>,
): FormData {
  const fd = new FormData();
  fd.append("locale", "en");
  for (const [key, value] of Object.entries(overrides)) {
    fd.append(key, value);
  }
  return fd;
}

/* ─── Mock data ─── */

const partnersInOrder = [
  {
    id: "cp_1",
    name: "Adobe",
    nameMl: null,
    logoUrl: "cert-partners/111-adobe.png",
    link: "https://adobe.com",
    sortOrder: 0,
    createdAt: new Date(),
  },
  {
    id: "cp_2",
    name: "SAP",
    nameMl: null,
    logoUrl: "cert-partners/222-sap.png",
    link: null,
    sortOrder: 1,
    createdAt: new Date(),
  },
  {
    id: "cp_3",
    name: "Tally",
    nameMl: null,
    logoUrl: "cert-partners/333-tally.png",
    link: "https://tally.com",
    sortOrder: 2,
    createdAt: new Date(),
  },
];

/* ─── Tests ─── */

describe("CertificationPartnerStrip rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("1. renders partners in sortOrder", async () => {
    mockFindMany.mockResolvedValue(partnersInOrder);

    const { CertificationPartnerStrip } = await import(
      "@/components/shared/CertificationPartnerStrip"
    );
    const element = await CertificationPartnerStrip({ heading: "Our Certification Partners" });
    const html = renderToString(element);

    const adobeIdx = html.indexOf("Adobe");
    const sapIdx = html.indexOf("SAP");
    const tallyIdx = html.indexOf("Tally");
    expect(adobeIdx).toBeLessThan(sapIdx);
    expect(sapIdx).toBeLessThan(tallyIdx);
  });

  test("2. partner with no link renders as non-clickable logo", async () => {
    mockFindMany.mockResolvedValue(
      partnersInOrder.filter((p) => p.id === "cp_2"),
    );

    const { CertificationPartnerStrip } = await import(
      "@/components/shared/CertificationPartnerStrip"
    );
    const element = await CertificationPartnerStrip({ heading: "Our Certification Partners" });
    const html = renderToString(element);

    // No <a> tag for SAP (no link)
    expect(html).not.toContain('href="https://');
    // Logo img still renders
    expect(html).toContain('alt="SAP"');
    // Rendered as a <span> wrapper, not an <a>
    expect(html).not.toContain('<a');
  });
});

describe("movePartner — reordering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockReset();
    mockUpdate.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("3. reordering partners persists and reflects in order", async () => {
    setMockAuth("staff_1", "CENTRE_STAFF");

    mockFindMany.mockResolvedValue(partnersInOrder);

    mockUpdate
      .mockResolvedValueOnce({ ...partnersInOrder[0], sortOrder: partnersInOrder[1].sortOrder })
      .mockResolvedValueOnce({ ...partnersInOrder[1], sortOrder: partnersInOrder[0].sortOrder });

    await movePartner(
      createFormData({ id: "cp_2", direction: "up", locale: "en" }),
    );

    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "cp_2" },
      data: { sortOrder: 0 },
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "cp_1" },
      data: { sortOrder: 1 },
    });

    expect(mockAuditCreate).toHaveBeenCalledTimes(1);
    expect(mockAuditCreate).toHaveBeenCalledWith({
      actorUserId: "staff_1",
      actorRole: "CENTRE_STAFF",
      action: "certificationPartner.reorder",
      entityType: "CertificationPartner",
      entityId: "cp_2",
      metadata: { direction: "up", swappedWith: "cp_1" },
    });
  });
});

describe("CertificationPartnersPage permission gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  test("4. /admin/certification-partners is denied to a job_seeker-role user", async () => {
    setMockAuth("job_seeker_1", "JOB_SEEKER");

    const { default: Page } = await import("./page");

    await expect(
      Page({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
