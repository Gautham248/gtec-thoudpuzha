// @vitest-environment node
// Server Actions are thin wrappers: an auth failure becomes the redirect the
// action always did, and procedure errors reach the caller unwrapped.
import { beforeEach, describe, expect, test, vi } from "vitest";
import { db } from "@/db";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { form, session } from "@/__tests__/pg-fixtures";
import { createFlashNews } from "@/app/[locale]/(admin)/admin/flash-news/actions";
import { updateFooterSettings } from "@/app/[locale]/(admin)/admin/settings/footer/actions";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(db as unknown as TestDb);
});

describe("action wrappers", () => {
  test("a denied caller is redirected to the form's locale /forbidden", async () => {
    mockAuth.mockResolvedValue(session("student_1", "STUDENT"));

    await expect(
      createFlashNews(form({ textEn: "Hi", locale: "ml" })),
    ).rejects.toThrow("redirect:/ml/forbidden");
  });

  test("a procedure's own error reaches the caller unchanged", async () => {
    mockAuth.mockResolvedValue(session("admin_1", "SUPER_ADMIN"));

    // No SiteSettings row exists in the empty test database.
    await expect(updateFooterSettings(form({}))).rejects.toThrow(
      "Site settings have not been initialized.",
    );
  });
});
