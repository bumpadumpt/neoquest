import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscoveryError } from "../../lib/discovery";
const { discover } = vi.hoisted(() => ({ discover: vi.fn() }));
vi.mock("@/lib/server/places", () => ({ discoverPlaces: discover }));
import { POST } from "../../app/api/discover/route";
const body = { location: "Berkeley", category: "all", radius: 5000 };
beforeEach(() => {
  discover.mockReset();
});
function request(
  value = JSON.stringify(body),
  headers: Record<string, string> = { "Content-Type": "application/json" },
) {
  return new Request("https://neoquest.example/api/discover", {
    method: "POST",
    headers,
    body: value,
  });
}
describe("discovery route", () => {
  it("returns only discovery data and disallows caching", async () => {
    discover.mockResolvedValue({
      activities: [],
      center: { lat: 37.87, lng: -122.27 },
      locationLabel: "Berkeley",
    });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ activities: [] });
  });
  it.each([
    ["{}", { "Content-Type": "application/json" }, 400],
    ["not-json", { "Content-Type": "application/json" }, 400],
    [JSON.stringify(body), { "Content-Type": "text/plain" }, 415],
    [
      JSON.stringify(body),
      { "Content-Type": "application/json", origin: "https://another.example" },
      403,
    ],
    [
      JSON.stringify({ location: "x".repeat(3000) }),
      { "Content-Type": "application/json" },
      413,
    ],
  ] as const)(
    "rejects invalid requests without billing a Places call",
    async (value, headers, status) => {
      expect((await POST(request(value, { ...headers }))).status).toBe(status);
      expect(discover).not.toHaveBeenCalled();
    },
  );
  it("returns actionable missing-configuration and quota errors", async () => {
    discover.mockRejectedValue(
      new DiscoveryError("Live discovery isn’t configured.", 503),
    );
    expect((await POST(request())).status).toBe(503);
    discover.mockRejectedValue(new DiscoveryError("Wait a minute.", 429));
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
  });
  it("does not expose unexpected server errors or secrets", async () => {
    discover.mockRejectedValue(new Error("SECRET-that-must-not-leak"));
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("SECRET-that-must-not-leak");
  });
});
