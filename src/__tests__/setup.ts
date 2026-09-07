import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.example" });
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

afterEach(cleanup);

// shadcn sidebar uses useIsMobile → window.matchMedia
// Guard: only in jsdom environments (not in e.g. edge-runtime tests)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Load en.json for test translation mocks so existing string assertions still work
import enMessages from "@/lib/i18n/en.json";

function lookup(namespace: string, key: string, values?: Record<string, string>): string {
  const ns = (enMessages as unknown as Record<string, Record<string, string>>)[namespace];
  let msg = ns?.[key] ?? key;
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      msg = msg.replace(`{${k}}`, v);
    }
  }
  return msg;
}

vi.mock("next-intl/server", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next-intl/server")>();
  return {
    ...mod,
    getLocale: vi.fn(() => Promise.resolve("en")),
    getTranslations: vi.fn(
      (opts: string | { locale?: string; namespace: string }) => {
        const namespace = typeof opts === "string" ? opts : opts.namespace;
        return Promise.resolve(
          (key: string, values?: Record<string, string>) =>
            lookup(namespace, key, values),
        );
      },
    ),
  };
});

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next-intl")>();
  return {
    ...mod,
    useLocale: vi.fn(() => "en"),
    useTranslations: vi.fn(
      (namespace: string) =>
        (key: string, values?: Record<string, string>) =>
          lookup(namespace, key, values),
    ),
  };
});

vi.mock("next-intl/middleware", () => ({
  default: vi.fn(
    (routing: { locales: string[]; defaultLocale: string }) =>
      (req: { nextUrl: { pathname: string }; url: string }) => {
        const firstSegment = req.nextUrl.pathname.split("/")[1];
        const hasLocale = routing.locales.includes(firstSegment);

        if (!hasLocale) {
          const redirectUrl = new URL(req.url);
          const path = req.nextUrl.pathname;
          redirectUrl.pathname = `/${routing.defaultLocale}${path === "/" ? "" : path}`;
          return new Response(null, {
            status: 307,
            headers: { Location: redirectUrl.toString() },
          });
        }

        return new Response(null, { status: 200 });
      },
  ),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: vi.fn(() => ({ isSignedIn: false, isLoaded: true })),
  UserButton: () => null,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("next/cache", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next/cache")>();
  return {
    ...mod,
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T) => fn,
  };
});
