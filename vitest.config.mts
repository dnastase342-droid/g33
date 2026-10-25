import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 60_000,
    // Starting the embedded Postgres can take >10 s on slower machines.
    hookTimeout: 60_000,
    // Each worker loads an embedded Postgres (~600 MB); keep it to one.
    fileParallelism: false,
    // PGlite needs the V8 baseline WASM compiler on some machines (see src/lib/db).
    execArgv: ["--liftoff-only"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
});
