import "server-only";
import { EnvHttpProxyAgent, fetch } from "undici";
import type { Activity, Category } from "../activities";
import { DiscoveryError, distanceMeters, validCenter, type DiscoveryRequest, type SearchCenter } from "../discovery";

type Element = { type: "node" | "way" | "relation"; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
type Result = { activities: Activity[]; center: SearchCenter; locationLabel: string };
const selectors: Record<Category, string[]> = {
  food: ['[amenity~"^(restaurant|fast_food|food_court)$"]'],
  cafe: ['[amenity="cafe"]'],
  boba: ['[cuisine~"bubble_tea|boba",i]', '[name~"boba|bubble tea|milk tea",i][amenity~"^(cafe|restaurant|fast_food)$"]'],
  sports: ['[leisure~"^(pitch|sports_centre|fitness_centre|swimming_pool|stadium)$"]'],
  park: ['[leisure="park"]'],
  outdoors: ['[leisure~"^(nature_reserve|garden)$"]', '[tourism~"^(viewpoint|picnic_site)$"]'],
};
const cache = new Map<string, { until: number; value: Result }>();
const locations = new Map<string, { until: number; center: SearchCenter }>();
const pending = new Map<string, Promise<Result>>();
let recent: number[] = [];
let lastRequest = 0;
const dispatcher = new EnvHttpProxyAgent();
const headers = { "User-Agent": "NeoQuest/0.1 (small activity discovery demo; https://github.com/bumpadumpt/neoquest)", Accept: "application/json" };

function endpoint(value: string | undefined, fallback: string) {
  const url = new URL(value || fallback);
  if (url.protocol !== "https:") throw new DiscoveryError("The discovery provider must use HTTPS.", 503);
  return url;
}
async function request(url: URL, body?: URLSearchParams) {
  // Serialize all public-service requests in this process, including geocoding.
  const delay = Math.max(0, 1100 - (Date.now() - lastRequest));
  if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
  lastRequest = Date.now();
  try {
    const response = await fetch(url, { dispatcher, headers: { ...headers, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) }, method: body ? "POST" : "GET", body: body?.toString(), signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      await response.body?.cancel();
      throw new DiscoveryError(response.status === 429 ? "The community search service is busy. Wait a minute and try again." : "OpenStreetMap discovery is temporarily unavailable. Try demo mode.", response.status === 429 ? 429 : 502);
    }
    return await response.json() as Record<string, unknown>;
  } catch (error) {
    if (error instanceof DiscoveryError) throw error;
    throw new DiscoveryError("Couldn’t connect to the community search service. Try again later or use demo mode.", 502);
  }
}
function boundedSet<T>(map: Map<string, T>, key: string, value: T) {
  if (map.size >= 100) map.delete(map.keys().next().value!);
  map.set(key, value);
}
export function osmCategory(tags: Record<string, string>): Category | null {
  if (/bubble_tea|boba/i.test(tags.cuisine ?? "") || /boba|bubble tea|milk tea/i.test(tags.name ?? "")) return "boba";
  if (tags.amenity === "cafe") return "cafe";
  if (["restaurant", "fast_food", "food_court"].includes(tags.amenity)) return "food";
  if (["pitch", "sports_centre", "fitness_centre", "swimming_pool", "stadium"].includes(tags.leisure)) return "sports";
  if (tags.leisure === "park") return "park";
  if (["nature_reserve", "garden"].includes(tags.leisure) || ["viewpoint", "picnic_site"].includes(tags.tourism)) return "outdoors";
  return null;
}
export function normalizeOsm(element: Element): Activity | null {
  if (!element || typeof element !== "object") return null;
  const tags = Object.fromEntries(Object.entries(element.tags ?? {}).filter(([, value]) => typeof value === "string"));
  const category = osmCategory(tags);
  const center = { lat: element.lat ?? element.center?.lat, lng: element.lon ?? element.center?.lon };
  if (!category || !validCenter(center) || !["node", "way", "relation"].includes(element.type) || !Number.isSafeInteger(element.id) || ["no", "private"].includes(tags.access) || tags.disused === "yes" || tags.abandoned === "yes") return null;
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const address = tags["addr:full"] || [street, tags["addr:city"], tags["addr:postcode"]].filter(Boolean).join(", ") || undefined;
  const kind = (tags.sport || tags.amenity || tags.leisure || tags.tourism || category).replaceAll("_", " ");
  return { id: `osm-${element.type}-${element.id}`, name: tags.name || `Unnamed ${kind}`, category, description: `Mapped ${kind} in OpenStreetMap. Check public access and availability before visiting.`, area: address || "Address not mapped", address, position: [center.lat, center.lng], source: "osm", mapsUrl: `https://www.openstreetmap.org/${element.type}/${element.id}` };
}
export function overpassQuery(center: SearchCenter, radius: number, category: Category | "all") {
  const chosen = category === "all" ? Object.values(selectors).flat() : selectors[category];
  return `[out:json][timeout:15][maxsize:8388608];(${chosen.map((s) => `nwr(around:${Math.min(radius, 5000)},${center.lat},${center.lng})${s};`).join("")});out body center 80;`;
}
async function search(input: DiscoveryRequest): Promise<Result> {
  let center = input.center;
  const label = input.location || "Your search location";
  if (!center) {
    const coords = input.location?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coords) {
      center = { lat: Number(coords[1]), lng: Number(coords[2]) };
      if (!validCenter(center)) throw new DiscoveryError("Enter valid coordinates.", 400);
    } else {
      const key = label.toLowerCase();
      const saved = locations.get(key);
      if (saved && saved.until > Date.now()) center = saved.center;
      else {
        const url = endpoint(process.env.OSM_GEOCODER_URL, "https://photon.komoot.io/api/");
        url.searchParams.set("q", label); url.searchParams.set("limit", "1");
        const data = await request(url);
        const geometry = (data.features as { geometry?: { coordinates?: number[] } }[] | undefined)?.[0]?.geometry?.coordinates;
        const found = { lat: geometry?.[1], lng: geometry?.[0] };
        if (!validCenter(found)) throw new DiscoveryError("Location not found. Try a city, address, or coordinates.", 404);
        center = found;
        boundedSet(locations, key, { until: Date.now() + 86400000, center });
      }
    }
  }
  const data = await request(endpoint(process.env.OSM_OVERPASS_URL, "https://overpass-api.de/api/interpreter"), new URLSearchParams({ data: overpassQuery(center, input.radius, input.category) }));
  if (!Array.isArray(data.elements) || data.remark) throw new DiscoveryError("The community service couldn’t complete the search. Try a smaller radius later.", 502);
  const seen = new Set<string>();
  const activities = data.elements.map((e) => normalizeOsm(e as Element)).filter((a): a is Activity => {
    if (!a || seen.has(a.id) || (input.category !== "all" && a.category !== input.category) || distanceMeters(center!, { lat: a.position[0], lng: a.position[1] }) > input.radius) return false;
    seen.add(a.id); return true;
  }).sort((a, b) => distanceMeters(center!, { lat: a.position[0], lng: a.position[1] }) - distanceMeters(center!, { lat: b.position[0], lng: b.position[1] })).slice(0, 30);
  return { activities, center, locationLabel: label };
}
export async function discoverOsm(input: DiscoveryRequest): Promise<Result> {
  if (input.radius > 5000) throw new DiscoveryError("OpenStreetMap discovery supports up to 5 km. Choose a smaller distance.", 400);
  const key = JSON.stringify(input);
  const saved = cache.get(key);
  if (saved && saved.until > Date.now()) return saved.value;
  const existing = pending.get(key);
  if (existing) return existing;
  recent = recent.filter((t) => Date.now() - t < 60000);
  if (pending.size || recent.length >= 6) throw new DiscoveryError("Please wait before searching again. Community search is limited to six new searches per minute.", 429);
  recent.push(Date.now());
  const task = search(input).then((value) => { boundedSet(cache, key, { value, until: Date.now() + 600000 }); return value; }).finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}
