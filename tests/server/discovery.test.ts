import { describe, expect, it } from "vitest";
import { distanceMeters, parseDiscoveryRequest } from "../../lib/discovery";

describe("discovery input", () => {
  it("accepts trimmed locations and validated coordinates", () => {
    expect(parseDiscoveryRequest({ location: "  Berkeley  " })).toEqual({
      location: "Berkeley",
      radius: 3000,
      category: "all",
    });
    expect(
      parseDiscoveryRequest({
        center: { lat: 37.87, lng: -122.27 },
        radius: 1000,
        category: "boba",
      }),
    ).toEqual({
      center: { lat: 37.87, lng: -122.27 },
      radius: 1000,
      category: "boba",
    });
  });
  it.each([
    null,
    [],
    {},
    { location: " " },
    { location: "x".repeat(201) },
    { location: "Berkeley", category: "unknown" },
    { center: { lat: 91, lng: 0 } },
    { center: { lat: 0, lng: -181 } },
    { center: { lat: "37", lng: 0 } },
    { center: { lat: NaN, lng: 0 } },
    { location: "Berkeley", radius: 10001 },
    { location: "Berkeley", radius: 0 },
    { location: "Berkeley", radius: "1000" },
  ])("rejects invalid input %j", (value) => {
    expect(() => parseDiscoveryRequest(value)).toThrow();
  });
  it("measures distance across the antimeridian", () => {
    expect(
      distanceMeters({ lat: 0, lng: 179.99 }, { lat: 0, lng: -179.99 }),
    ).toBeCloseTo(2223.9, 0);
    expect(
      distanceMeters(
        { lat: 37.87, lng: -122.27 },
        { lat: 37.87, lng: -122.27 },
      ),
    ).toBe(0);
  });
});
