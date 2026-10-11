import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  createStudentRecord,
  bulkImportStudents,
  updateStudentEmail,
} from "./actions";
import { db } from "@/db";
import { getInsertedRows } from "@/__tests__/drizzle-mock";

const mockAuth = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockAuditCreate = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    studentRecord: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      create: mockCreate,
      update: mockUpdate,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    auditLogEntry: {
      create: mockAuditCreate,
    },
  },
}));

const auditEntries = () => getInsertedRows(db, "auditLogEntry");

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("createStudentRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockFindUnique.mockReset();
    mockCreate.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("1. single-entry creation succeeds with valid data", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "sr_1",
      studentId: "GTEC001",
      fullName: "John Doe",
      phone: "9876543210",
      email: "john@example.com",
      linkedUserId: null,
      createdAt: new Date(),
    });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });

    const formData = new FormData();
    formData.append("studentId", "GTEC001");
    formData.append("fullName", "John Doe");
    formData.append("phone", "9876543210");
    formData.append("email", "john@example.com");
    formData.append("locale", "en");

    await createStudentRecord(formData);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { studentId: "GTEC001" },
    });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        studentId: "GTEC001",
        fullName: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
      },
    });
    expect(auditEntries()).toHaveLength(1);
    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "studentRecord.create",
        entityType: "StudentRecord",
        entityId: "sr_1",
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/students");
  });

  test("throws on duplicate studentId", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockFindUnique.mockResolvedValue({
      id: "sr_existing",
      studentId: "GTEC001",
      fullName: "Existing",
      phone: "0000000000",
    });

    const formData = new FormData();
    formData.append("studentId", "GTEC001");
    formData.append("fullName", "John Doe");
    formData.append("phone", "9876543210");
    formData.append("email", "john@example.com");

    await expect(createStudentRecord(formData)).rejects.toThrow(
      'Student ID "GTEC001" already exists',
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("rejects when email is missing", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockFindUnique.mockResolvedValue(null);

    const formData = new FormData();
    formData.append("studentId", "GTEC001");
    formData.append("fullName", "John Doe");
    formData.append("phone", "9876543210");

    await expect(createStudentRecord(formData)).rejects.toThrow(
      "studentId, fullName, phone, and email are required",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("rejects an invalid email format", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockFindUnique.mockResolvedValue(null);

    const formData = new FormData();
    formData.append("studentId", "GTEC001");
    formData.append("fullName", "John Doe");
    formData.append("phone", "9876543210");
    formData.append("email", "not-an-email");

    await expect(createStudentRecord(formData)).rejects.toThrow(
      '"not-an-email" is not a valid email address',
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("bulkImportStudents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockFindUnique.mockReset();
    mockCreate.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("2. CSV bulk import with 5 valid rows creates 5 StudentRecord rows", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    mockFindUnique.mockResolvedValue(null);
    let createCallCount = 0;
    mockCreate.mockImplementation(
      ({ data }: { data: { studentId: string; fullName: string } }) => {
        createCallCount++;
        return Promise.resolve({
          id: `sr_${createCallCount}`,
          ...data,
          linkedUserId: null,
          createdAt: new Date(),
        });
      },
    );
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });

    const csv = [
      "studentId,fullName,phone,email",
      "GTEC001,Alice,1111111111,alice@example.com",
      "GTEC002,Bob,2222222222,bob@example.com",
      "GTEC003,Carol,3333333333,carol@example.com",
      "GTEC004,Dave,4444444444,dave@example.com",
      "GTEC005,Eve,5555555555,eve@example.com",
    ].join("\n");

    const formData = new FormData();
    formData.append("csv", csv);
    formData.append("locale", "en");

    const results = await bulkImportStudents(formData);

    expect(results).toHaveLength(5);
    results.forEach((r) => expect(r.success).toBe(true));
    expect(mockCreate).toHaveBeenCalledTimes(5);
    expect(auditEntries()).toHaveLength(1);
    expect(auditEntries()).toContainEqual(
      expect.objectContaining({
        actorUserId: "staff_1",
        actorRole: "CENTRE_STAFF",
        action: "studentRecord.bulkImport",
        entityType: "StudentRecord",
        entityId: "bulk",
      }),
    );
  });

  test("3. CSV bulk with one duplicate and four valid rows creates 4 and reports duplicate", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    // GTEC003 already exists; all others are new
    mockFindUnique.mockImplementation(
      ({ where }: { where: { studentId: string } }) => {
        if (where.studentId === "GTEC003") {
          return Promise.resolve({
            id: "sr_existing",
            studentId: "GTEC003",
            fullName: "Existing Carol",
            phone: "3333333333",
          });
        }
        return Promise.resolve(null);
      },
    );

    let createCallCount = 0;
    mockCreate.mockImplementation(
      ({ data }: { data: { studentId: string } }) => {
        createCallCount++;
        return Promise.resolve({
          id: `sr_${createCallCount}`,
          ...data,
          linkedUserId: null,
          createdAt: new Date(),
        });
      },
    );
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });

    const csv = [
      "studentId,fullName,phone,email",
      "GTEC001,Alice,1111111111,alice@example.com",
      "GTEC002,Bob,2222222222,bob@example.com",
      "GTEC003,Carol,3333333333,carol@example.com",
      "GTEC004,Dave,4444444444,dave@example.com",
      "GTEC005,Eve,5555555555,eve@example.com",
    ].join("\n");

    const formData = new FormData();
    formData.append("csv", csv);
    formData.append("locale", "en");

    const results = await bulkImportStudents(formData);

    expect(results).toHaveLength(5);

    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    expect(successes).toHaveLength(4);
    expect(failures).toHaveLength(1);
    expect(failures[0].studentId).toBe("GTEC003");
    expect(failures[0].error).toContain("Duplicate");

    expect(mockCreate).toHaveBeenCalledTimes(4);
  });
});

describe("updateStudentEmail — backfill for records created before email was required", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockUpdate.mockReset();
    mockAuditCreate.mockReset();
    mockRevalidatePath.mockReset();
    mockUserFindUnique.mockResolvedValue({ deactivatedAt: null });
  });

  test("updates the record's email and logs the admin action", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });
    mockUpdate.mockResolvedValue({ id: "sr_1", studentId: "GTEC-TEST-001" });
    mockAuditCreate.mockResolvedValue({ id: "audit_1" });

    const formData = new FormData();
    formData.append("recordId", "sr_1");
    formData.append("email", "student@example.com");
    formData.append("locale", "en");

    await updateStudentEmail(formData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "sr_1" },
      data: { email: "student@example.com" },
    });
    expect(auditEntries()).toContainEqual(
      expect.objectContaining({ action: "studentRecord.updateEmail" }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/students");
  });

  test("rejects an invalid email", async () => {
    mockAuth.mockResolvedValue({
      userId: "staff_1",
      sessionClaims: { metadata: { role: "CENTRE_STAFF" } },
    });

    const formData = new FormData();
    formData.append("recordId", "sr_1");
    formData.append("email", "bad");

    await expect(updateStudentEmail(formData)).rejects.toThrow(
      '"bad" is not a valid email address',
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("StudentsPage permission gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockFindUnique.mockReset();
    mockFindMany.mockReset();
    mockCreate.mockReset();
    mockRedirect.mockReset();
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  test("4. /admin/students is denied to an employer-role user (403)", async () => {
    mockAuth.mockResolvedValue({
      userId: "employer_1",
      sessionClaims: { metadata: { role: "EMPLOYER" } },
    });

    const { default: StudentsPage } = await import("./page");

    await expect(
      StudentsPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/en/forbidden");
  });
});
