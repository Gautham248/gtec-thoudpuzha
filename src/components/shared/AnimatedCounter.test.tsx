import { describe, expect, test } from "vitest";
import { renderToString } from "react-dom/server";
import { AnimatedCounter, parseStatValue } from "./AnimatedCounter";

describe("parseStatValue", () => {
  test("parses integers with suffix like 25+", () => {
    const result = parseStatValue("25+");
    expect(result.isNumeric).toBe(true);
    expect(result.num).toBe(25);
    expect(result.suffix).toBe("+");
    expect(result.prefix).toBe("");
  });

  test("parses numbers with commas like 10,000+", () => {
    const result = parseStatValue("10,000+");
    expect(result.isNumeric).toBe(true);
    expect(result.num).toBe(10000);
    expect(result.hasCommas).toBe(true);
    expect(result.suffix).toBe("+");
  });

  test("parses numbers with K+ suffix like 50K+", () => {
    const result = parseStatValue("50K+");
    expect(result.isNumeric).toBe(true);
    expect(result.num).toBe(50);
    expect(result.suffix).toBe("K+");
  });

  test("parses percentages like 99%", () => {
    const result = parseStatValue("99%");
    expect(result.isNumeric).toBe(true);
    expect(result.num).toBe(99);
    expect(result.suffix).toBe("%");
  });

  test("parses numbers with million suffix like 5M+", () => {
    const result = parseStatValue("5M+");
    expect(result.isNumeric).toBe(true);
    expect(result.num).toBe(5);
    expect(result.suffix).toBe("M+");
  });

  test("parses plain numbers like 30", () => {
    const result = parseStatValue("30");
    expect(result.isNumeric).toBe(true);
    expect(result.num).toBe(30);
    expect(result.suffix).toBe("");
  });

  test("handles non-numeric strings gracefully", () => {
    const result = parseStatValue("N/A");
    expect(result.isNumeric).toBe(false);
    expect(result.raw).toBe("N/A");
  });
});

describe("AnimatedCounter", () => {
  test("renders initial static value in SSR with tabular-nums", () => {
    const html = renderToString(<AnimatedCounter value="500+" className="text-xl" />);
    expect(html).toContain("500+");
    expect(html).toContain("tabular-nums");
    expect(html).toContain("text-xl");
  });
});
