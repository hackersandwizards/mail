import { defineConfig } from "vitest/config";

const timeout = Number(process.env.SCAFFOLDING_TEST_TIMEOUT_MS || 5000);

export default defineConfig({
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
    testTimeout: timeout,
    hookTimeout: timeout,
  },
});
