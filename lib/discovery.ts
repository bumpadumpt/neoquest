import { categories, type Category } from "./activities";

export type SearchCenter = { lat: number; lng: number };
export type DiscoveryRequest = {
  location?: string;
  center?: SearchCenter;
  category: Category | "all";
  radius: number;
};
export class DiscoveryError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function validCenter(value: unknown): value is SearchCenter {
  if (!value || typeof value !== "object") return false;
  const center = value as SearchCenter;
  return (
    typeof center.lat === "number" &&
    Number.isFinite(center.lat) &&
    Math.abs(center.lat) <= 90 &&
    typeof center.lng === "number" &&
    Number.isFinite(center.lng) &&
    Math.abs(center.lng) <= 180
  );
}
export function parseDiscoveryRequest(value: unknown): DiscoveryRequest {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new DiscoveryError(
      "Enter a location or use your current location.",
      400,
    );
  const body = value as Record<string, unknown>;
  const category = body.category ?? "all";
  if (category !== "all" && !categories.some((c) => c.id === category))
    throw new DiscoveryError("Choose a supported activity category.", 400);
  const radius = body.radius ?? 3000;
  if (
    typeof radius !== "number" ||
    !Number.isFinite(radius) ||
    radius < 500 ||
    radius > 10000
  )
    throw new DiscoveryError(
      "Search distance must be between 500 and 10,000 meters.",
      400,
    );
  if (body.center !== undefined) {
    if (!validCenter(body.center))
      throw new DiscoveryError(
        "Enter valid latitude and longitude coordinates.",
        400,
      );
    return {
      center: body.center,
      category: category as Category | "all",
      radius,
    };
  }
  if (
    typeof body.location !== "string" ||
    !body.location.trim() ||
    body.location.trim().length > 200
  )
    throw new DiscoveryError(
      "Enter a city or address (up to 200 characters).",
      400,
    );
  return {
    location: body.location.trim(),
    category: category as Category | "all",
    radius,
  };
}
export function distanceMeters(a: SearchCenter, b: SearchCenter) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const h =
    Math.sin(radians(b.lat - a.lat) / 2) ** 2 +
    Math.cos(radians(a.lat)) *
      Math.cos(radians(b.lat)) *
      Math.sin(radians(b.lng - a.lng) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
