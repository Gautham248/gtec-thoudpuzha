import { describe, expect, test, vi, beforeEach } from "vitest";
import { NextRequest, NextFetchEvent } from "next/server";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider as _NextIntlClientProvider, useTranslations as _useTranslations } from "next-intl";
import type { Mock } from "vitest";
import middleware from "@/proxy";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import enMessages from "@/lib/i18n/en.json";
import mlMessages from "@/lib/i18n/ml.json";
import fs from "node:fs";
import path from "node:path";

const _mockEvent = { waitUntil: vi.fn() };

const mockAuthResult = vi.hoisted(() => ({
  userId: null as string | null,
  sessionClaims: undefined as { metadata?: { role?: string } } | undefined,
}));

const mockAuth = vi.hoisted(() => vi.fn(() => Promise.resolve(mockAuthResult)));

const mockClerkMiddleware = vi.hoisted(
  () =>
    (
      handler: (
        authFn: () => Promise<typeof mockAuthResult>,
        req: NextRequest,
      ) => Promise<Response | undefined>,
    ) =>
      async (req: NextRequest, _evt?: unknown) => {
        return handler(mockAuth, req);
      },
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkMiddleware: mockClerkMiddleware,
}));

vi.mock("@/lib/i18n/navigation", () => ({
  usePathname: vi.fn(),
}));

function makeRequest(path: string) {
  return new NextRequest(new URL(`https://example.com${path}`));
}

describe("i18n routing middleware", () => {
  beforeEach(() => {
    mockAuthResult.userId = null;
    mockAuthResult.sessionClaims = undefined;
    vi.clearAllMocks();
  });

  test("1. visiting / redirects to /en as the default locale", async () => {
    const req = makeRequest("/");
    const response = await middleware(req, {} as NextFetchEvent);
    expect(response?.status).toBe(307);
    expect(response?.headers.get("Location")).toBe("https://example.com/en");
  });

  test("2. visiting /ml passes through without redirecting to /en", async () => {
    const req = makeRequest("/ml");
    const response = await middleware(req, {} as NextFetchEvent);
    expect(response?.headers.get("Location")).toBeNull();
  });
});

describe("i18n auth proxy regression", () => {
  beforeEach(() => {
    mockAuthResult.userId = null;
    mockAuthResult.sessionClaims = undefined;
    vi.clearAllMocks();
  });

  test("4. unauthenticated /en/portal passes through proxy (auth is resource-based)", async () => {
    const req = makeRequest("/en/portal");
    const response = await middleware(req, {} as NextFetchEvent);
    // Proxy no longer redirects — auth is handled by layouts/pages
    expect(response?.headers.get("Location")).toBeNull();
  });

  test("4b. unauthenticated /ml/admin passes through proxy (auth is resource-based)", async () => {
    const req = makeRequest("/ml/admin");
    const response = await middleware(req, {} as NextFetchEvent);
    // Proxy no longer redirects — auth is handled by layouts/pages
    expect(response?.headers.get("Location")).toBeNull();
  });
});

describe("Dictionary content integrity", () => {
  function checkValidValues(obj: Record<string, unknown>, path: string) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        expect(value, `${path}.${key} is empty`).not.toBe("");
        expect(value, `${path}.${key} equals its key name`).not.toBe(key);
      } else if (typeof value === "object" && value !== null) {
        checkValidValues(value as Record<string, unknown>, `${path}.${key}`);
      }
    }
  }

  test("EN dictionary has no empty values or literal key references", () => {
    checkValidValues(enMessages as unknown as Record<string, unknown>, "en");
  });

  test("ML dictionary has no empty values or literal key references", () => {
    checkValidValues(mlMessages as unknown as Record<string, unknown>, "ml");
  });

  test("EN and ML dictionaries have the same top-level keys", () => {
    const enKeys = new Set(Object.keys(enMessages));
    const mlKeys = new Set(Object.keys(mlMessages));
    const missingInMl = [...enKeys].filter((k) => !mlKeys.has(k));
    const extraInMl = [...mlKeys].filter((k) => !enKeys.has(k));
    expect(missingInMl).toEqual([]);
    expect(extraInMl).toEqual([]);
  });

  test("ML dictionary covers sample user-facing strings with real translations", () => {
    expect(mlMessages.nav?.home).toBe("ഹോം");
    expect(mlMessages.hero?.headline).toContain("കരിയർ");
    expect(mlMessages.enquiry?.submit).toContain("അന്വേഷണം");
    expect(mlMessages.biodata?.save).toContain("ബയോഡാറ്റ");
    expect(mlMessages.footer?.allRightsReserved).toContain("അവകാശങ്ങളും");
  });

  test("EN sample strings are English text", () => {
    expect(enMessages.hero?.headline).toContain("Career");
    expect(enMessages.enquiry?.heading).toContain("Apply");
    expect(enMessages.biodata?.save).toContain("Biodata");
  });
});

describe("No hardcoded English UI strings in route groups", () => {
  const ROUTE_GROUP_DIRS = ["(public)", "(portal)"];

  function isTestFile(filePath: string): boolean {
    return filePath.includes(".test.") || filePath.includes(".spec.");
  }

  function getTsxFiles(dir: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") {
        files.push(...getTsxFiles(full));
      } else if (entry.name.endsWith(".tsx") && !isTestFile(full)) {
        files.push(full);
      }
    }
    return files;
  }

  // Patterns that detect hardcoded English UI strings in JSX
  // These catch the most common regression patterns
  const HARDCODED_STRING_PATTERNS = [
    // Inline text after JSX tag: >Some Text<  (multi-word, first word capitalized)
    />[A-Z][a-zA-Z]+ [A-Za-z]/,
    // Nullish coalescing or OR fallback with English text
    /\?\? ["'][A-Za-z]/,
    /\|\| ["'][A-Za-z]/,
    // placeholder / label / title with English text
    /placeholder=["'][A-Z]/,
    /label=["'][A-Z]/,
    // Button/link text in ternary: ? "Text" : "Text"
    /\? ["'][A-Z][a-z]+[^"']*["']\s*:/,
    // English text in specific error/status snippets
    // e.g., applicantCount pluralisation: `${count} applicant`
    /\$\{[^}]+\} ["']/,
  ];

  // Patterns that indicate this file uses translations
  const TRANSLATION_IMPORT_PATTERNS = [
    /useTranslations/,
    /getTranslations/,
  ];

  test("every .tsx file in (public) and (portal) has no hardcoded English UI strings", () => {
    const appDir = path.resolve(
      __dirname, "..", "app", "[locale]",
    );

    const allFiles: string[] = [];
    for (const group of ROUTE_GROUP_DIRS) {
      allFiles.push(
        ...getTsxFiles(path.join(appDir, group)),
      );
    }

    const offenders: { file: string; matched: string }[] = [];
    const falsePositives: string[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8");

      // Skip files that already use translations
      const usesTranslations = TRANSLATION_IMPORT_PATTERNS.some((p) =>
        p.test(content),
      );
      if (usesTranslations) continue;

      // Layout files and error files are structural — allow them
      const baseName = path.basename(file);
      if (baseName === "layout.tsx" || baseName === "error.tsx" || baseName === "loading.tsx" || baseName === "not-found.tsx") continue;

      // Check each pattern
      for (const pattern of HARDCODED_STRING_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          offenders.push({ file, matched: matches[0] });
          break;
        }
      }
    }

    // Known false positives get special-cased here
    const KNOWN_EXCEPTIONS = [
      // These pages are structural delegators that receive translated props
      "resources/assignments/page.tsx",
      "resources/past-papers/page.tsx",
      "resources/lectures/page.tsx",
    ];

    const realOffenders = offenders.filter(
      (o) => !KNOWN_EXCEPTIONS.some((ex) => o.file.endsWith(ex)),
    );

    // If there are false positives we need to investigate, log them
    if (offenders.length !== realOffenders.length) {
      falsePositives.push(
        ...offenders
          .filter((o) => KNOWN_EXCEPTIONS.some((ex) => o.file.endsWith(ex)))
          .map((o) => `${o.file}: ${o.matched}`),
      );
    }

    if (falsePositives.length > 0) {
      console.log(
        "Known structural files (receiving translated props, excluded):",
        falsePositives,
      );
    }

    if (realOffenders.length > 0) {
      const msg = realOffenders
        .map((o) => `  ${o.file.replace(appDir, "")}: matched "${o.matched}"`)
        .join("\n");
      expect(realOffenders, `Found hardcoded English UI strings without t():\n${msg}`).toEqual([]);
    }
  });
});

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("3. toggles /en/courses to /ml/courses", async () => {
    const { useLocale } = await import("next-intl");
    const { usePathname } = await import("@/lib/i18n/navigation");

    (useLocale as Mock).mockReturnValue("en");
    (usePathname as Mock).mockReturnValue("/courses");

    const html = renderToString(<LanguageSwitcher />);
    expect(html).toContain('href="/ml/courses"');
    expect(html).toContain('hrefLang="ml"');
  });

  test("3b. toggles /ml/courses/abc to /en/courses/abc", async () => {
    const { useLocale } = await import("next-intl");
    const { usePathname } = await import("@/lib/i18n/navigation");

    (useLocale as Mock).mockReturnValue("ml");
    (usePathname as Mock).mockReturnValue("/courses/abc");

    const html = renderToString(<LanguageSwitcher />);
    expect(html).toContain('href="/en/courses/abc"');
    expect(html).toContain('hrefLang="en"');
  });
});
