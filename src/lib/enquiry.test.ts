// @vitest-environment node

import { describe, expect, test, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { enquiry } from "@/db/schema";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import { insertCourse } from "@/__tests__/pg-fixtures";
import { submitEnquiry } from "./enquiry";

const mockResendSend = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() =>
  vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 })),
);
const mockGetClientIp = vi.hoisted(() =>
  vi.fn(() => Promise.resolve("127.0.0.1")),
);

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: mockGetClientIp,
}));

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

const pg = db as unknown as TestDb;

vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    return {
      emails: {
        send: mockResendSend,
      },
    };
  }),
}));

describe("submitEnquiry", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateAll(pg);
    mockResendSend.mockReset();
    process.env.CENTRE_STAFF_NOTIFICATION_EMAILS = "staff@example.com";
  });

  test("creates an Enquiry row with the correct source value", async () => {
    const course = await insertCourse(pg, {
      titleEn: "Diploma in Computer Application",
    });

    await submitEnquiry({
      source: "homepage-hero",
      fullName: "  Jane Doe  ",
      phone: "9876543210",
      course: course.id,
      message: "I want to know more.",
    });

    const rows = await pg.select().from(enquiry);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "Jane Doe",
      phone: "9876543210",
      courseId: course.id,
      message: "I want to know more.",
      source: "homepage-hero",
    });
  });

  test("stores a null courseId when the course id is unknown", async () => {
    await submitEnquiry({
      source: "contact-page",
      fullName: "Jane Doe",
      phone: "9876543210",
      course: "not-a-real-course",
      message: "",
    });

    const [row] = await pg.select().from(enquiry);
    expect(row).toMatchObject({ courseId: null, message: null });
  });

  test("rejects invalid data missing phone server-side", async () => {
    await expect(
      submitEnquiry({
        source: "homepage-hero",
        fullName: "Jane Doe",
        phone: "",
        course: "course_1",
        message: "",
      }),
    ).rejects.toThrow("Enter a valid 10-digit Indian mobile number.");

    expect(await pg.select().from(enquiry)).toHaveLength(0);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  test("triggers exactly one Resend email send call on success", async () => {
    const course = await insertCourse(pg, {
      titleEn: "Diploma in Computer Application",
    });

    await submitEnquiry({
      source: "contact-page",
      fullName: "Jane Doe",
      phone: "9876543210",
      course: course.id,
      message: "",
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });
});
