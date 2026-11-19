import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("Worker", () => {
  it("answers 404 to a path it does not serve", async () => {
    const response = await exports.default.fetch("https://example.com/");

    expect(response.status).toBe(404);
  });
});
