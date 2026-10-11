"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, Role } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentRecord } from "@/db/schema";
import { expectRow } from "@/db/helpers";
import { logAdminAction } from "@/lib/audit";

function localeFromFormData(formData: FormData): string {
  return (formData.get("locale") as string) || "en";
}

function isValidEmail(email: string): boolean {
  // Deliberately simple — good enough to catch typos, not RFC-exhaustive.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Backfill email on a StudentRecord created before email became required
 * for sign-up verification (see 04_AUTH_DEBUGGING_LOG.md — the switch away
 * from phone OTP). Records created via the old form/CSV format have no
 * email on file and can't complete sign-up until one is added here.
 */
export async function updateStudentEmail(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const recordId = (formData.get("recordId") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!recordId || !email) {
    throw new Error("recordId and email are required");
  }
  if (!isValidEmail(email)) {
    throw new Error(`"${email}" is not a valid email address`);
  }

  const record = expectRow(
    await db
      .update(studentRecord)
      .set({ email })
      .where(eq(studentRecord.id, recordId))
      .returning(),
    "Student record",
  );

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "studentRecord.updateEmail",
    entityType: "StudentRecord",
    entityId: record.id,
    metadata: { studentId: record.studentId, email },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/students`);
}

export async function createStudentRecord(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const studentId = (formData.get("studentId") as string)?.trim();
  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!studentId || !fullName || !phone || !email) {
    throw new Error("studentId, fullName, phone, and email are required");
  }

  if (!isValidEmail(email)) {
    throw new Error(`"${email}" is not a valid email address`);
  }

  const existing = await db.query.studentRecord.findFirst({
    where: (r, { eq }) => eq(r.studentId, studentId),
    columns: { id: true },
  });
  if (existing) {
    throw new Error(`Student ID "${studentId}" already exists`);
  }

  const [record] = await db
    .insert(studentRecord)
    .values({ studentId, fullName, phone, email })
    .returning();

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "studentRecord.create",
    entityType: "StudentRecord",
    entityId: record.id,
    metadata: { studentId, fullName, phone, email },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/students`);
}

export interface CsvRowResult {
  row: number;
  studentId: string;
  success: boolean;
  error?: string;
}

export async function bulkImportStudents(formData: FormData) {
  const authResult = await requireRole([Role.CENTRE_STAFF, Role.SUPER_ADMIN]);
  if (!authResult.authorized) {
    redirect(`/${localeFromFormData(formData)}/forbidden`);
  }

  const csvContent = formData.get("csv") as string;
  if (!csvContent) {
    throw new Error("CSV content is required");
  }

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Skip header row if first line looks like a header
  const startIndex =
    lines.length > 0 && lines[0].toLowerCase().includes("studentid") ? 1 : 0;

  const results: CsvRowResult[] = [];
  let createdCount = 0;

  for (let i = startIndex; i < lines.length; i++) {
    const rowNumber = i + 1;
    const parts = parseCsvLine(lines[i]);

    if (parts.length < 4) {
      results.push({
        row: rowNumber,
        studentId: parts[0] ?? "",
        success: false,
        error: "Invalid row: expected studentId,fullName,phone,email",
      });
      continue;
    }

    const [studentId, fullName, phone, email] = parts.map((p) => p.trim());

    if (!studentId || !fullName || !phone || !email) {
      results.push({
        row: rowNumber,
        studentId: studentId ?? "",
        success: false,
        error: "Missing required field(s)",
      });
      continue;
    }

    if (!isValidEmail(email)) {
      results.push({
        row: rowNumber,
        studentId,
        success: false,
        error: `"${email}" is not a valid email address`,
      });
      continue;
    }

    try {
      const existing = await db.query.studentRecord.findFirst({
        where: (r, { eq }) => eq(r.studentId, studentId),
        columns: { id: true },
      });
      if (existing) {
        results.push({
          row: rowNumber,
          studentId,
          success: false,
          error: `Duplicate studentId "${studentId}"`,
        });
        continue;
      }

      await db
        .insert(studentRecord)
        .values({ studentId, fullName, phone, email });

      results.push({ row: rowNumber, studentId, success: true });
      createdCount++;
    } catch (err) {
      results.push({
        row: rowNumber,
        studentId,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const totalRows = lines.length - startIndex;
  const failedCount = results.filter((r) => !r.success).length;
  const existingCount = results.filter(
    (r) => !r.success && r.error?.startsWith("Duplicate"),
  ).length;

  await logAdminAction({
    actorUserId: authResult.userId,
    actorRole: authResult.role,
    action: "studentRecord.bulkImport",
    entityType: "StudentRecord",
    entityId: "bulk",
    metadata: {
      totalRows,
      createdCount,
      failedCount,
      existingCount,
      results: results.map((r) => ({
        row: r.row,
        studentId: r.studentId,
        success: r.success,
        error: r.error,
      })),
    },
  });

  revalidatePath(`/${localeFromFormData(formData)}/admin/students`);

  return results;
}

/**
 * Wrapper around bulkImportStudents for use as a form action.
 * Form action props must return void | Promise<void>, so this discards
 * the CsvRowResult[] return value that bulkImportStudents produces.
 */
export async function bulkImportStudentsAction(formData: FormData) {
  await bulkImportStudents(formData);
}

/** Simple CSV line parser that handles quoted fields. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}
