// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { truncateAll, type TestDb } from "@/__tests__/pg-test-db";
import {
  insertCourse,
  insertStudentProfile,
  insertUser,
} from "@/__tests__/pg-fixtures";
import * as t from "@/db/schema";
import type { BiodataPdfData } from "@/components/shared/BiodataPdfDocument";
import { GET } from "./route";

const mockAuth = vi.hoisted(() => vi.fn());
const mockRenderToBuffer = vi.hoisted(() =>
  vi.fn().mockResolvedValue(Buffer.from("%PDF-1.3 mock pdf buffer")),
);

vi.mock("@/db", async () => ({
  db: await (await import("@/__tests__/pg-test-db")).createTestDb(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: mockRenderToBuffer,
  StyleSheet: { create: () => ({}) },
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
}));

const pg = db as unknown as TestDb;

const signIn = (userId: string, role: string) =>
  mockAuth.mockResolvedValue({ userId, sessionClaims: { metadata: { role } } });

const download = (candidateId: string) =>
  GET(new NextRequest(`http://localhost/api/biodata/${candidateId}/pdf`), {
    params: Promise.resolve({ candidateId }),
  });

beforeEach(async () => {
  vi.clearAllMocks();
  await truncateAll(pg);
});

describe("GET /api/biodata/[candidateId]/pdf — access control", () => {
  test("student accessing another candidate's PDF is rejected with 403", async () => {
    await insertUser(pg, { id: "user_other", role: "STUDENT" });
    const other = await insertStudentProfile(pg, {
      userId: "user_other",
      fullName: "Other Person",
    });
    signIn("user_self", "STUDENT");

    const response = await download(other.id);

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("Forbidden");
    expect(mockRenderToBuffer).not.toHaveBeenCalled();
  });

  test("a student can download their own PDF", async () => {
    await insertUser(pg, { id: "user_self", role: "STUDENT" });
    const mine = await insertStudentProfile(pg, {
      userId: "user_self",
      fullName: "Me",
    });
    signIn("user_self", "STUDENT");

    const response = await download(mine.id);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
  });

  test("employer CAN download another candidate's PDF", async () => {
    await insertUser(pg, { id: "user_candidate", role: "STUDENT" });
    const candidate = await insertStudentProfile(pg, {
      userId: "user_candidate",
      fullName: "Candidate Name",
      dateOfBirth: new Date("2001-06-15"),
      phone: "1234567890",
      email: "candidate@example.com",
      educationalQualification: "GRADUATE",
      yearOfPassing: 2023,
      address: "Some address",
      languagesKnown: ["English"],
      preferredJobLocation: "Kochi",
      preferredJobType: "FULL_TIME",
      careerObjective: "A career",
    });
    signIn("user_employer", "EMPLOYER");

    const response = await download(candidate.id);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
  });

  test("an unknown candidate is a 404", async () => {
    signIn("user_employer", "EMPLOYER");

    const response = await download("missing");

    expect(response.status).toBe(404);
  });
});

describe("GET /api/biodata/[candidateId]/pdf — content", () => {
  const renderedData = () =>
    (mockRenderToBuffer.mock.calls[0][0] as { props: { data: BiodataPdfData } })
      .props.data;

  test("prints skill labels and course names in the profile's order", async () => {
    // Inserted in the opposite order to the profile's lists, so a lookup that
    // pairs by result position would mismatch them.
    const second = await insertCourse(pg, { titleEn: "Second Course" });
    const first = await insertCourse(pg, { titleEn: "First Course" });
    const [react, excel] = await pg
      .insert(t.skill)
      .values([{ label: "React" }, { label: "Excel" }])
      .returning();
    await insertUser(pg, { id: "user_self", role: "STUDENT" });
    const mine = await insertStudentProfile(pg, {
      userId: "user_self",
      fullName: "Me",
      courseCompletedIds: [first.id, second.id],
      skillIds: [excel.id, react.id],
    });
    signIn("user_self", "STUDENT");

    expect((await download(mine.id)).status).toBe(200);

    expect(renderedData().courseCompletedNames).toEqual([
      "First Course",
      "Second Course",
    ]);
    expect(renderedData().skillLabels).toEqual(["Excel", "React"]);
  });

  test("leaves out courses and skills that no longer exist", async () => {
    const course = await insertCourse(pg, { titleEn: "Kept Course" });
    await insertUser(pg, { id: "user_self", role: "STUDENT" });
    const mine = await insertStudentProfile(pg, {
      userId: "user_self",
      fullName: "Me",
      courseCompletedIds: ["deleted_course", course.id],
      skillIds: ["deleted_skill"],
    });
    signIn("user_self", "STUDENT");

    expect((await download(mine.id)).status).toBe(200);

    expect(renderedData().courseCompletedNames).toEqual(["Kept Course"]);
    expect(renderedData().skillLabels).toEqual([]);
  });
});
