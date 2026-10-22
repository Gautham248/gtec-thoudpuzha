import { describe, expect, test } from "vitest";
import { applicationStatus } from "@/db/schema";
import { APPLICATION_TRANSITIONS, canTransition } from "./application-status";

describe("application status transitions", () => {
  test("REJECTED and HIRED are final", () => {
    for (const to of applicationStatus.enumValues) {
      expect(canTransition("REJECTED", to)).toBe(false);
      expect(canTransition("HIRED", to)).toBe(false);
    }
  });

  test("no status can be moved to APPLIED or VIEWED by hand", () => {
    for (const from of applicationStatus.enumValues) {
      expect(canTransition(from, "APPLIED")).toBe(false);
      expect(canTransition(from, "VIEWED")).toBe(false);
    }
  });

  test("HIRED is reachable only after the profile was viewed", () => {
    expect(canTransition("APPLIED", "HIRED")).toBe(false);
    expect(canTransition("VIEWED", "HIRED")).toBe(true);
    expect(canTransition("SHORTLISTED", "HIRED")).toBe(true);
  });

  test("covers every status in the enum", () => {
    expect(Object.keys(APPLICATION_TRANSITIONS).sort()).toEqual(
      [...applicationStatus.enumValues].sort(),
    );
  });
});
