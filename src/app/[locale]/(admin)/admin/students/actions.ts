"use server";

import { api, run, toForbidden as forbidden } from "@/server/action";

import type { CsvRowResult as CsvRow } from "@/server/routers/admin/students";

export type CsvRowResult = CsvRow;

/**
 * Backfill email on a StudentRecord created before email became required
 * for sign-up verification.
 */
export async function updateStudentEmail(formData: FormData) {
  await run(
    () => api().admin.students.updateEmail(formData),
    forbidden(formData),
  );
}

export async function createStudentRecord(formData: FormData) {
  await run(() => api().admin.students.create(formData), forbidden(formData));
}

export async function bulkImportStudents(formData: FormData) {
  return run(
    () => api().admin.students.bulkImport(formData),
    forbidden(formData),
  );
}

/**
 * Wrapper around bulkImportStudents for use as a form action.
 * Form action props must return void | Promise<void>, so this discards
 * the CsvRowResult[] return value that bulkImportStudents produces.
 */
export async function bulkImportStudentsAction(formData: FormData) {
  await bulkImportStudents(formData);
}
