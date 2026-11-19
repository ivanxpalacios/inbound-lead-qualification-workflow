import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Runs every test inside workerd (the Workers runtime), with the Worker
// built from the same wrangler.jsonc that `wrangler dev` and deploys use.
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
  ],
});
