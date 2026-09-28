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
    setupFiles: ["./src/__tests__/setup.ts"],
    exclude: ["node_modules/**", "tests/e2e/**"],
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
  },
});
