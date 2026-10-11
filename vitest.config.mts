import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Force React development build so React.act is available for
// React Testing Library with React 19.
(process.env as Record<string, string>).NODE_ENV = "development";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "next/server": "next/server.js",
      "next/navigation": "next/navigation.js",
      "next/link": "next/link.js",
    },
  },
  test: {
    environment: "jsdom",
    // Many tests import whole page modules; on a cold, fully parallel run
    // that alone can exceed the 5s default.
    testTimeout: 20_000,
    // First DB access in a PGlite-backed file restores the schema snapshot,
    // which can take several seconds when every worker is busy.
    hookTimeout: 60_000,
    setupFiles: ["./src/__tests__/setup.ts"],
    // Builds the in-memory Postgres schema snapshot once per run (cached in
    // the OS temp dir by schema hash) so PGlite-backed tests start fast.
    globalSetup: ["./src/__tests__/pg-global-setup.ts"],
    exclude: ["node_modules/**", "tests/e2e/**"],
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
  },
});
