import { beforeEach, describe, expect, it, vi } from "vitest";
const { upstream } = vi.hoisted(() => ({ upstream: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("undici", () => ({ fetch: upstream, EnvHttpProxyAgent: class {} }));
const center = { lat: 37.8716, lng: -122.2727 };
const element = { type: "node" as const, id: 1, lat: 37.872, lon: -122.273, tags: { name: "Synthetic Café", amenity: "cafe", "addr:street": "Fixture Street" } };
beforeEach(() => { vi.resetModules(); upstream.mockReset(); });

describe("OpenStreetMap discovery", () => {
  it("searches with no key, normalizes nodes and centers, caches repeat searches, and keeps missing fields honest", async () => {
    upstream.mockResolvedValue(new Response(JSON.stringify({ elements: [element, element, { ...element, type: "way", id: 2, lat: undefined, lon: undefined, center: { lat: 37.872, lon: -122.273 } }, null] })));
    const { discoverOsm } = await import("@/lib/server/osm");
    const input = { center, radius: 1000, category: "cafe" as const };
    const a = await discoverOsm(input);
    const b = await discoverOsm(input);
    expect(a).toEqual(b); expect(upstream).toHaveBeenCalledTimes(1);
    expect(a.activities).toHaveLength(2);
    expect(a.activities[0]).toMatchObject({ source: "osm", category: "cafe", name: "Synthetic Café" });
    expect(a.activities[0].rating).toBeUndefined();
    expect(a.activities[0].mapsUrl).toBe("https://www.openstreetmap.org/node/1");
    const [url, options] = upstream.mock.calls[0];
    expect(String(url)).toBe("https://overpass-api.de/api/interpreter");
    expect(options.headers).not.toHaveProperty("X-Goog-Api-Key");
    const query = new URLSearchParams(options.body).get("data");
    expect(query).toContain("out body center 80");
    expect(query).toContain("around:1000,37.8716,-122.2727");
  });
  it("rejects invalid/private or unsupported places and categorizes mapped sports and boba", async () => {
    const { normalizeOsm } = await import("@/lib/server/osm");
    expect(normalizeOsm({ ...element, tags: { ...element.tags, access: "private" } })).toBeNull();
    expect(normalizeOsm({ ...element, lat: 300 })).toBeNull();
    expect(normalizeOsm({ ...element, tags: { leisure: "pitch", sport: "basketball" } })).toMatchObject({ category: "sports", name: "Unnamed basketball" });
    expect(normalizeOsm({ ...element, tags: { amenity: "cafe", cuisine: "bubble_tea" } })).toMatchObject({ category: "boba" });
  });
  it("rejects an oversized radius before requesting the community service", async () => {
    const { discoverOsm } = await import("@/lib/server/osm");
    await expect(discoverOsm({ center, category: "all", radius: 10000 })).rejects.toMatchObject({ status: 400 });
    expect(upstream).not.toHaveBeenCalled();
  });
  it("coalesces simultaneous requests and rejects different searches while one is active", async () => {
    let resolve!: (v: Response) => void;
    upstream.mockReturnValue(new Promise<Response>((r) => { resolve = r; }));
    const { discoverOsm } = await import("@/lib/server/osm");
    const input = { center, category: "all" as const, radius: 1000 };
    const a = discoverOsm(input), b = discoverOsm(input);
    await expect(discoverOsm({ ...input, category: "park" })).rejects.toMatchObject({ status: 429 });
    resolve(new Response(JSON.stringify({ elements: [] })));
    await Promise.all([a, b]); expect(upstream).toHaveBeenCalledTimes(1);
  });
  it("returns a sanitized provider error for throttling and partial responses", async () => {
    upstream.mockResolvedValue(new Response("internal provider detail", { status: 429 }));
    const { discoverOsm } = await import("@/lib/server/osm");
    await expect(discoverOsm({ center, category: "all", radius: 1000 })).rejects.toMatchObject({ status: 429 });
  });
  it("resolves manually entered locations through Photon", async () => {
    upstream.mockResolvedValueOnce(new Response(JSON.stringify({ features: [{ geometry: { coordinates: [-122.2727, 37.8716] } }] }))).mockResolvedValueOnce(new Response(JSON.stringify({ elements: [element] })));
    const { discoverOsm } = await import("@/lib/server/osm");
    const result = await discoverOsm({ location: "Test City", category: "all", radius: 1000 });
    expect(String(upstream.mock.calls[0][0])).toContain("photon.komoot.io/api/?q=Test+City&limit=1");
    expect(result.center).toEqual(center);
  });
});
