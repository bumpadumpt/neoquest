# Real places on Leaflet, without Google

Visit `/map/open` and click **Discover Side Quests**. This separate real-place finder uses Leaflet with OpenStreetMap tiles and Overpass data, without Google Maps, Google Places, API keys, or Google billing. The existing Google finder and demo remain at their previous routes. A navigation link connects the two finders.

Food, cafés, boba, sports, parks, and outdoor places receive category icons and clickable information panels. Sidebar cards and pins share selection. Boba identification uses mapped cuisine/name tags, so coverage is incomplete. Unnamed mapped facilities are labeled as unnamed rather than invented business names. Addresses display only when mapped. There are no Google ratings, reviews, photos, prices, or opening-hours estimates. Features on ways/relations use their supplied centers, which need not be entrances. Private/no-access and explicitly abandoned/disused features are excluded, but visitors must still check access directly.

Search near Berkeley, allow current-location permission on demand, enter coordinates, or manually enter a city/address. Text locations use Photon's public geocoder (`photon.komoot.io`), rather than Nominatim. Search terms/coordinates go to these community providers only after a submitted search. No autocomplete, background polling, pagination, or searches on map movement are implemented. Filters reuse already loaded results.

## Small development-demo usage

- Overpass (`https://overpass-api.de/api/interpreter`): one bounded query, default 1 km and maximum 5 km, a 15-second query timeout and 64 MiB query memory limit, up to 80 returned OSM elements and 30 displayed activities. The earlier 8 MiB limit could be too small for dense-area searches. These are a limited sample, sorted by distance among the returned elements, not an exhaustive nearest-place index.
- The query returns node coordinates plus way/relation centers (`out body center`). Features with missing coordinates or unsupported categories are skipped. OSM objects are deduplicated by type/id; independently mapped objects may still represent the same venue.
- New searches are limited to six per minute per server process, with one active search at a time. Identical in-flight requests share work. Upstream requests are spaced at least 1.1 seconds apart. Completed results are cached in process for 10 minutes, and geocoded locations for 24 hours, bounded to 100 entries each.
- Public services may throttle or go offline; errors let users retry later or return to sample data. Attribution and source links are retained. Data © OpenStreetMap contributors, under [ODbL](https://www.openstreetmap.org/copyright).
- Provider failures now report which service failed and its HTTP status, and server logs record only that service/status (no locations, query bodies, or provider error text). HTTP 429 means throttling, 502/503/504 can indicate capacity or timeout failures, and 403 means the provider refused the request. These statuses do not alone establish the underlying cause. There are no automatic retries or provider switching after a refusal.
- Follow the [Overpass public-instance guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html), [Photon demo-service policy](https://github.com/komoot/photon#photon-demo-server), and [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/). No tile scraping/prefetch/offline downloading is added.

This is suitable for light prototype testing, not unlimited free production infrastructure. Serverless processes do not share the in-memory cache or limiter. Before broader traffic, add an application-wide cache/rate limiter and use a hosted or self-hosted Overpass/geocoding/tile service with appropriate capacity. Free community infrastructure does not guarantee uptime; Vercel hosting limits still apply.

## Deployment and configuration

Review/merge the feature PR yourself and let the connected Vercel project deploy. The production URL will be `https://neoquest-three.vercel.app/map/open`. No Google key or Google domain restriction is needed on this route. A Next.js server is still required for `/api/discover/osm`; GitHub Pages static exports support demo mode only.

Optional server-only `OSM_OVERPASS_URL` and `OSM_GEOCODER_URL` can select other HTTPS-compatible endpoints. Keep them unset for the defaults. Never expose credentials in these URLs. Endpoint configuration is controlled by the server administrator, not incoming requests. The app uses its existing proxy/TLS configuration and identifies itself with a User-Agent.

For Codex, `overpass-api.de` and `photon.komoot.io` were added to the saved network draft while preserving other destinations. Save/review and publish that environment configuration to apply it. Saving the draft does not immediately grant network access. Initial live connectivity here was blocked by the cloud proxy, so automated tests use synthetic Overpass/Photon responses; that does not verify live service availability. Vercel has its own network environment.

Run `npm run dev` and visit `/map/open`. Checks: `npm run typecheck`, `npm run lint`, `npm run build`, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test` when system Chromium is installed. For a live smoke check, search cafés at 1 km once, click a pin and check the OpenStreetMap source link; then change filters and confirm no new search occurs.
