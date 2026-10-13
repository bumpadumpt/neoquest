# Running and testing the first prototype

This first prototype focuses on a working map. It contains a home page and a Berkeley `/map` page with 12 clearly marked sample activities, four category filters, clickable Leaflet markers, and a linked activity list. It uses Next.js, React, TypeScript, Tailwind CSS, Leaflet, and OpenStreetMap. There is no authentication, Firebase, Google API integration, recommendation algorithm, or backend service.

## Local preview

Use Node.js 22+ and npm:

```bash
git clone https://github.com/bumpadumpt/neoquest.git
cd neoquest
git switch feature/neoquest-map-prototype
npm ci
npm run dev
```

Open `http://localhost:3000` for the home page or `http://localhost:3000/map` for the prototype. No `.env` file or API key is needed. To preview another checked-out branch, simply use that branch's files.

The development server listens on `0.0.0.0`. In a remote workspace with port forwarding, forward port 3000 and use the URL provided by your workspace. Codex cloud onboarding has no browser preview for its loopback addresses; running the repository locally is the simplest way to preview it there.

For a production preview:

```bash
npm run build
npm start
```

## Checks

```bash
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm test
```

The browser tests run against a production server on port 3173, so build first. Tests cover home-to-map navigation, sample disclosure, all four filters, marker and sidebar popup selection, recentering, tile error handling, and horizontal overflow at desktop and mobile widths. Public tile requests are mocked in these tests so automation does not repeatedly load community-funded map tiles. These tests do not verify live tile availability.

If Chromium is already installed, you can avoid downloading another browser:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

For a manual smoke test, open `/map`, confirm streets and visible attribution load, click an activity pin, choose each filter, select a sidebar card, drag the map, zoom once, and use **Back to Berkeley**. Repeat at a narrow mobile width. All ideas should be labeled as samples; no login or payment prompt should appear.

## OpenStreetMap tile usage

The standard raster tile endpoint `https://tile.openstreetmap.org/{z}/{x}/{y}.png` is appropriate for this small, manually viewed development demo. Follow the [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/). This community-funded service has no availability guarantee.

- Keep the visible **© OpenStreetMap contributors** attribution and its copyright link.
- The browser sends its normal User-Agent and Referer and honors HTTP cache headers. Do not deploy with a `no-referrer` policy, strip Referer in a proxy, or bypass the browser cache.
- The map requests tiles for the viewed area with a small Leaflet buffer. There is no prefetch, offline download, tile scraping, or server-side tile proxy. Do not add those features using this endpoint.
- Automated interaction tests mock tiles. Do not run automated bots that pan and zoom against the public service.
- For a public launch or heavier usage, choose a suitable hosted or self-hosted OSM tile provider and update the `TileLayer` URL and attribution together in `components/activity-map.tsx`.

Internet access to `tile.openstreetmap.org` is required for real tiles. If the browser cannot load them, the page shows a notice and retains sample markers and the activity list. A provider-side block can also return an error image; that requires checking the provider policy and network, rather than an API key.

In the current Codex cloud, a tile request with TLS verification and the prototype's own User-Agent succeeds, but Chromium reports `ERR_CERT_AUTHORITY_INVALID` for the cloud HTTPS proxy. Browser interaction tests use mocked tiles. Live browser rendering must therefore be checked locally or in an environment with a correctly trusted proxy; TLS verification was not disabled.

## Project layout

- `app/page.tsx`: simple home page.
- `app/map/page.tsx`: map route.
- `components/explorer.tsx`: category selection and sidebar state.
- `components/activity-map.tsx`: Leaflet map, tiles, markers, and popups. Dynamically loaded in the browser to avoid Leaflet's server-rendering limitations.
- `lib/activities.ts`: typed sample data and four categories.
- `app/globals.css`: responsive visual styling and Leaflet overrides.
- `tests/map.spec.ts`: desktop/mobile browser checks.

The locations and activities in `lib/activities.ts` are illustrative, even when they refer to real Berkeley neighborhoods. They are not exact venue entrances or verified business listings.
