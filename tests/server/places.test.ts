import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const { upstream } = vi.hoisted(() => ({ upstream: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("undici", () => ({ fetch: upstream, EnvHttpProxyAgent: class {} }));
const center = { lat: 37.8716, lng: -122.2727 };
const input = { center, category: "all" as const, radius: 5000 };
const place = {
  id: "fixture-cafe",
  displayName: { text: "Fixture Café" },
  formattedAddress: "Fixture street, Berkeley",
  location: { latitude: 37.872, longitude: -122.273 },
  primaryType: "cafe",
  rating: 4.2,
  googleMapsUri: "https://maps.google.com/?cid=123",
};
const response = (places: unknown[]) =>
  new Response(JSON.stringify({ places }), { status: 200 });
beforeEach(() => {
  vi.resetModules();
  upstream.mockReset();
  vi.stubEnv("GOOGLE_PLACES_API_KEY", "unit-test-only-secret");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("server Places integration", () => {
  it("does not make an upstream call without credentials", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "");
    const { discoverPlaces } = await import("../../lib/server/places");
    await expect(discoverPlaces(input)).rejects.toMatchObject({ status: 503 });
    expect(upstream).not.toHaveBeenCalled();
  });
  it("uses one bounded nearby request, normalizes genuine fields, and skips duplicates or invalid coordinates", async () => {
    upstream.mockResolvedValue(
      response([
        place,
        place,
        { ...place, id: "bad", location: { latitude: 300, longitude: 0 } },
        { ...place, id: "far", location: { latitude: 0, longitude: 0 } },
      ]),
    );
    const { discoverPlaces } = await import("../../lib/server/places");
    const result = await discoverPlaces(input);
    expect(upstream).toHaveBeenCalledTimes(1);
    const [url, options] = upstream.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places:searchNearby");
    expect(options.headers["X-Goog-Api-Key"]).toBe("unit-test-only-secret");
    expect(options.headers["X-Goog-FieldMask"]).toContain("places.rating");
    expect(options.headers["X-Goog-FieldMask"]).not.toMatch(
      /price|openingHours|photos|\*/,
    );
    expect(JSON.parse(options.body)).toMatchObject({
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: { circle: { radius: 5000 } },
    });
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]).toMatchObject({
      name: "Fixture Café",
      category: "cafe",
      address: "Fixture street, Berkeley",
      rating: 4.2,
      source: "google",
    });
    expect(JSON.stringify(result)).not.toContain("unit-test-only-secret");
  });
  it("resolves a manual location before searching and reports location-not-found honestly", async () => {
    upstream
      .mockResolvedValueOnce(
        response([
          {
            displayName: { text: "Berkeley" },
            location: { latitude: center.lat, longitude: center.lng },
          },
        ]),
      )
      .mockResolvedValueOnce(response([place]));
    const { discoverPlaces } = await import("../../lib/server/places");
    await expect(
      discoverPlaces({ location: "Berkeley", category: "cafe", radius: 1000 }),
    ).resolves.toMatchObject({ center, locationLabel: "Berkeley" });
    expect(upstream).toHaveBeenCalledTimes(2);
    expect(JSON.parse(upstream.mock.calls[1][1].body).includedTypes).toEqual([
      "cafe",
    ]);
    upstream.mockResolvedValueOnce(response([]));
    await expect(
      discoverPlaces({
        location: "Missing location",
        category: "all",
        radius: 1000,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("uses explicit coordinates without an extra location lookup", async () => {
    upstream.mockResolvedValue(response([]));
    const { discoverPlaces } = await import("../../lib/server/places");
    await discoverPlaces({
      location: "37.8716, -122.2727",
      category: "park",
      radius: 1000,
    });
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(JSON.parse(upstream.mock.calls[0][1].body).includedTypes).toEqual([
      "park",
    ]);
  });
  it("searches boba by text and excludes biased results beyond the requested radius", async () => {
    upstream.mockResolvedValue(
      response([
        place,
        { ...place, id: "far", location: { latitude: 0, longitude: 0 } },
      ]),
    );
    const { discoverPlaces } = await import("../../lib/server/places");
    const result = await discoverPlaces({ ...input, category: "boba" });
    expect(upstream.mock.calls[0][0]).toContain("searchText");
    expect(JSON.parse(upstream.mock.calls[0][1].body)).toMatchObject({
      textQuery: "bubble tea",
      pageSize: 20,
    });
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].category).toBe("boba");
  });
  it("preserves unknown ratings and omits unsafe URLs and unavailable fields", async () => {
    const { normalizePlace } = await import("../../lib/server/places");
    const activity = normalizePlace({
      ...place,
      rating: undefined,
      formattedAddress: undefined,
      googleMapsUri: "javascript:alert(1)",
      attributions: [
        { provider: "Contributor", providerUri: "https://example.com/" },
      ],
    });
    expect(activity).toMatchObject({
      rating: undefined,
      address: undefined,
      mapsUrl: undefined,
      attributions: [
        { displayName: "Contributor", uri: "https://example.com/" },
      ],
    });
    expect(activity).not.toHaveProperty("price");
    expect(activity).not.toHaveProperty("openingHours");
    expect(normalizePlace({ ...place, rating: 7 })?.rating).toBeUndefined();
  });
  it.each([403, 429, 500])("sanitizes upstream errors (%i)", async (status) => {
    upstream.mockResolvedValue(
      new Response("unit-test-only-secret", { status }),
    );
    const { discoverPlaces } = await import("../../lib/server/places");
    try {
      await discoverPlaces(input);
      throw new Error("Expected failure");
    } catch (error) {
      expect(String(error)).not.toContain("unit-test-only-secret");
      expect(error).toMatchObject({
        status: status === 403 ? 503 : status === 429 ? 429 : 502,
      });
    }
  });
  it("does not expose connection errors", async () => {
    upstream.mockRejectedValue(new Error("unit-test-only-secret"));
    const { discoverPlaces } = await import("../../lib/server/places");
    await expect(discoverPlaces(input)).rejects.toMatchObject({ status: 502 });
  });
  it("coalesces concurrent identical requests but does not retain Places content after completion", async () => {
    let resolve!: (value: Response) => void;
    upstream.mockImplementationOnce(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    const { discoverPlaces } = await import("../../lib/server/places");
    const first = discoverPlaces(input),
      second = discoverPlaces(input);
    resolve(response([place]));
    await Promise.all([first, second]);
    expect(upstream).toHaveBeenCalledTimes(1);
    upstream.mockResolvedValue(response([]));
    await discoverPlaces(input);
    expect(upstream).toHaveBeenCalledTimes(2);
  });
  it("bounds searches per server instance", async () => {
    upstream.mockImplementation(() => Promise.resolve(response([])));
    const { discoverPlaces } = await import("../../lib/server/places");
    for (let i = 0; i < 20; i++) await discoverPlaces(input);
    await expect(discoverPlaces(input)).rejects.toMatchObject({ status: 429 });
    expect(upstream).toHaveBeenCalledTimes(20);
  });
});
