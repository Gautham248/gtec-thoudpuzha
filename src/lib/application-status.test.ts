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

  test("an unviewed application can only be rejected", () => {
    expect(APPLICATION_TRANSITIONS.APPLIED).toEqual(["REJECTED"]);
  });

  test("no path reaches SHORTLISTED or HIRED without passing VIEWED", () => {
    // Walk every status reachable from APPLIED while skipping VIEWED.
    const reachable = new Set<string>();
    const queue = ["APPLIED" as const];
    while (queue.length > 0) {
      for (const next of APPLICATION_TRANSITIONS[queue.shift()!]) {
        if (next === "VIEWED" || reachable.has(next)) continue;
        reachable.add(next);
        queue.push(next as never);
      }
    }
    expect(reachable.has("SHORTLISTED")).toBe(false);
    expect(reachable.has("HIRED")).toBe(false);
  });

  test("a viewed application can be shortlisted and then hired", () => {
    expect(canTransition("VIEWED", "SHORTLISTED")).toBe(true);
    expect(canTransition("SHORTLISTED", "HIRED")).toBe(true);
  });

  test("covers every status in the enum", () => {
    expect(Object.keys(APPLICATION_TRANSITIONS).sort()).toEqual(
      [...applicationStatus.enumValues].sort(),
    );
  });
});
