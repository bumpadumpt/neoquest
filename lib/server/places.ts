import "server-only";
import { EnvHttpProxyAgent, fetch } from "undici";
import type { Activity, Category } from "../activities";
import {
  DiscoveryError,
  distanceMeters,
  validCenter,
  type DiscoveryRequest,
  type SearchCenter,
} from "../discovery";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  types?: string[];
  rating?: number;
  googleMapsUri?: string;
  attributions?: { provider?: string; providerUri?: string }[];
};
export type DiscoveryResult = {
  activities: Activity[];
  center: SearchCenter;
  locationLabel: string;
};
const fields =
  "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.rating,places.googleMapsUri,places.attributions";
const includedTypes: Record<Exclude<Category, "boba"> | "all", string[]> = {
  all: [
    "restaurant",
    "cafe",
    "park",
    "sports_complex",
    "athletic_field",
    "hiking_area",
  ],
  food: ["restaurant"],
  cafe: ["cafe"],
  sports: ["sports_complex", "athletic_field", "gym"],
  park: ["park"],
  outdoors: ["hiking_area", "campground"],
};
const inFlight = new Map<string, Promise<DiscoveryResult>>();
let recentSearches: number[] = [];
let dispatcher: EnvHttpProxyAgent | undefined;

async function googleRequest(
  method: "searchNearby" | "searchText",
  body: object,
  key: string,
  fieldMask: string,
) {
  let response;
  try {
    dispatcher ??= new EnvHttpProxyAgent();
    response = await fetch(
      `https://places.googleapis.com/v1/places:${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(body),
        dispatcher,
        signal: AbortSignal.timeout(12000),
      },
    );
  } catch {
    throw new DiscoveryError(
      "Place search couldn’t connect. Try again later or use demo mode.",
      502,
    );
  }
  if (!response.ok) {
    // Never forward upstream error bodies: they may include credentials or request details.
    await response.body?.cancel();
    if (response.status === 429)
      throw new DiscoveryError(
        "Google’s search quota was reached. Try later or use demo mode.",
        429,
      );
    if ([401, 403].includes(response.status))
      throw new DiscoveryError(
        "Live search isn’t configured correctly. Check the server key, enabled Places API, and billing, or use demo mode.",
        503,
      );
    throw new DiscoveryError(
      "The places provider couldn’t complete this search. Try demo mode or search again later.",
      502,
    );
  }
  try {
    return (await response.json()) as { places?: GooglePlace[] };
  } catch {
    throw new DiscoveryError(
      "The places provider returned an unreadable response.",
      502,
    );
  }
}

function placeCategory(place: GooglePlace): Category {
  const types = [place.primaryType, ...(place.types ?? [])];
  if (
    types.includes("bubble_tea_shop") ||
    /boba|bubble tea|milk tea/i.test(place.displayName?.text ?? "")
  )
    return "boba";
  if (types.includes("park")) return "park";
  if (
    types.some((type) =>
      ["sports_complex", "athletic_field", "gym", "stadium"].includes(
        type ?? "",
      ),
    )
  )
    return "sports";
  if (types.some((type) => ["hiking_area", "campground"].includes(type ?? "")))
    return "outdoors";
  if (types.includes("cafe") || types.includes("coffee_shop")) return "cafe";
  return "food";
}
function publicUrl(value?: string) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function normalizePlace(
  place: GooglePlace,
  category?: Category,
): Activity | null {
  const center = {
    lat: place.location?.latitude,
    lng: place.location?.longitude,
  };
  if (!place.id || !place.displayName?.text || !validCenter(center))
    return null;
  return {
    id: place.id,
    name: place.displayName.text,
    category: category ?? placeCategory(place),
    description:
      "Explore this nearby place. Check details and availability with the venue before heading out.",
    area: place.formattedAddress ?? "Address not provided",
    address: place.formattedAddress,
    position: [center.lat, center.lng],
    source: "google",
    rating:
      typeof place.rating === "number" &&
      Number.isFinite(place.rating) &&
      place.rating >= 0 &&
      place.rating <= 5
        ? place.rating
        : undefined,
    mapsUrl: publicUrl(place.googleMapsUri),
    attributions: place.attributions
      ?.filter((a) => typeof a.provider === "string")
      .map((a) => ({
        displayName: a.provider!,
        uri: publicUrl(a.providerUri),
      })),
  };
}
async function runSearch(
  input: DiscoveryRequest,
  key: string,
): Promise<DiscoveryResult> {
  let center = input.center;
  let locationLabel = input.location ?? "Your search location";
  if (!center) {
    const coordinates = input.location?.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
    );
    if (coordinates) {
      center = { lat: Number(coordinates[1]), lng: Number(coordinates[2]) };
      if (!validCenter(center))
        throw new DiscoveryError(
          "Enter valid latitude and longitude coordinates.",
          400,
        );
    } else {
      const result = await googleRequest(
        "searchText",
        { textQuery: input.location, pageSize: 1 },
        key,
        "places.location,places.displayName",
      );
      const location = result.places?.[0];
      center = {
        lat: location?.location?.latitude as number,
        lng: location?.location?.longitude as number,
      };
      if (!validCenter(center))
        throw new DiscoveryError(
          "That location wasn’t found. Try a more specific city or address.",
          404,
        );
      locationLabel = location?.displayName?.text ?? locationLabel;
    }
  }
  const result =
    input.category === "boba"
      ? await googleRequest(
          "searchText",
          {
            textQuery: "bubble tea",
            locationBias: {
              circle: {
                center: { latitude: center.lat, longitude: center.lng },
                radius: input.radius,
              },
            },
            pageSize: 20,
          },
          key,
          fields,
        )
      : await googleRequest(
          "searchNearby",
          {
            includedTypes: includedTypes[input.category],
            maxResultCount: 20,
            rankPreference: "DISTANCE",
            locationRestriction: {
              circle: {
                center: { latitude: center.lat, longitude: center.lng },
                radius: input.radius,
              },
            },
          },
          key,
          fields,
        );
  const seen = new Set<string>();
  const activities = (Array.isArray(result.places) ? result.places : [])
    .map((place) =>
      normalizePlace(
        place,
        input.category === "all" ? undefined : input.category,
      ),
    )
    .filter((place): place is Activity => {
      if (
        !place ||
        seen.has(place.id) ||
        distanceMeters(center!, {
          lat: place.position[0],
          lng: place.position[1],
        }) > input.radius
      )
        return false;
      seen.add(place.id);
      return true;
    })
    .sort(
      (a, b) =>
        distanceMeters(center!, { lat: a.position[0], lng: a.position[1] }) -
        distanceMeters(center!, { lat: b.position[0], lng: b.position[1] }),
    );
  return { activities, center, locationLabel };
}
export async function discoverPlaces(
  input: DiscoveryRequest,
): Promise<DiscoveryResult> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key)
    throw new DiscoveryError(
      "Live discovery isn’t configured yet. Add the server-side GOOGLE_PLACES_API_KEY, or keep exploring in demo mode.",
      503,
    );
  const requestKey = JSON.stringify(input);
  const existing = inFlight.get(requestKey);
  if (existing) return existing;
  const now = Date.now();
  recentSearches = recentSearches.filter((time) => now - time < 60000);
  if (recentSearches.length >= 20)
    throw new DiscoveryError(
      "Too many searches right now. Wait a minute or use demo mode.",
      429,
    );
  recentSearches.push(now);
  // Coalesce simultaneous identical searches; no place content is cached after completion.
  const pending = runSearch(input, key).finally(() => {
    inFlight.delete(requestKey);
  });
  inFlight.set(requestKey, pending);
  return pending;
}
