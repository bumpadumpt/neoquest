# Side Quest Discovery

Demo mode remains the default and requires no keys. Leaflet/OpenStreetMap displays 12 clearly labeled sample ideas around Berkeley. Real places are optional: choose **Real places**, enter a city/address or use **Use my current location**, select a distance/category, and press **Discover Side Quests**. Results appear in a sidebar and as clickable Google map pins.

The [Google Places display policy](https://developers.google.com/maps/documentation/places/web-service/policies) requires Google Places content mapped through a Google map under the standard terms. Consequently, the Leaflet demo is preserved, and only live results use Google Maps. This map-provider choice was confirmed during implementation.

## Configure Google later

1. In [Google Cloud Console](https://console.cloud.google.com/), create or choose a project and link a billing account. Enable **Places API (New)** and **Maps JavaScript API**. Do not enable the legacy Places API as a substitute.
2. Create **two separate keys** under **APIs & Services → Credentials**:
   - **Server Places key:** restrict API access to **Places API (New)**. Use an IP-address application restriction when your server has stable outbound IP addresses. HTTP-referrer restrictions are for browser keys and are unsuitable for this server request. Configure low API quotas appropriate to your demo.
   - **Browser Maps key:** restrict API access to **Maps JavaScript API** and application access to your website HTTP referrers. For local development allow `http://localhost:3000/*` and `http://127.0.0.1:3000/*`; for deployment allow your actual HTTPS domain. This separate key is public by design. It must not also authorize Places server requests.
3. Copy `.env.example` to `.env.local` and privately enter the appropriate values:

   ```dotenv
   GOOGLE_PLACES_API_KEY=your_server_places_key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_separate_browser_maps_key
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_optional_map_id
   ```

   `.env.local` is ignored by Git. **Never put the server key in a `NEXT_PUBLIC_` variable**, client code, Figma embed, URL, or committed file. The browser key is included in the browser bundle, as required by Maps JavaScript API; restrict it accordingly. An optional map ID enables your own map styling with Advanced Markers; the app otherwise uses Google's documented `DEMO_MAP_ID`.

4. Restart `npm run dev`. For production, set both keys privately in your hosting provider's environment settings **before building**, then rebuild/redeploy. Public Next.js variables are set at build time. Start in demo mode, choose **Real places**, and press **Discover Side Quests** to opt into Google requests. Loading the app or changing filters alone does not call Places.
5. Verify one small search, check names/addresses and clickable pins, and inspect the Cloud Console quota/billing dashboard. Both APIs are separately metered. Ratings are an Enterprise-level Places field; requesting them affects the billed SKU. Budget alerts are notifications, not a hard spending cap; use provider quotas for limits.

For Codex cloud, a `GOOGLE_PLACES_API_KEY` secret requirement and required Google destinations were saved in the environment draft, plus the public Maps variable name. Enter values securely in environment settings, review/save the draft, and publish it to reuse the environment. This does not deploy the website. Server traffic must be allowed to `places.googleapis.com`; the Maps browser SDK also needs `maps.googleapis.com` and `maps.gstatic.com`. The server uses the existing HTTP/HTTPS proxy through Undici's `EnvHttpProxyAgent` and preserves TLS verification. Never copy credential values into setup instructions.

## Hosting

Live discovery requires a **Next.js server or serverless Next.js host**, such as Vercel or a Node server. The app must run `POST /api/discover`; do not use `NEOQUEST_GITHUB_PAGES=true` for live deployment. GitHub Pages hosts static files and cannot execute this endpoint or securely hold the server key. The existing public Pages demo remains available and unchanged by this pull request.

`NEOQUEST_GITHUB_PAGES=true npm run build` still produces a key-free demo export. The real-place button is disabled in that export. Neither merging source changes nor saving the Codex environment automatically republishes the static demo or deploys a Next.js server.

## Request and cost controls

- Google requests run server-side. The client sends only a location or coordinates, category, and radius. It never receives the Places secret.
- One click makes one nearby search (or a Text Search for boba). The result limit is 20, radius is capped at 10 km, and no pagination or place-details requests are made.
- An unresolved city/address needs one additional Text Search to find coordinates. Current-location coordinates, explicit `latitude, longitude`, and subsequent refreshes at the resolved location avoid that lookup.
- Categories filter the current list and pins locally. Click **Discover Side Quests** again to search the selected category, rather than fetching automatically for each filter change.
- Field masks request only identifiers, names, coordinates, addresses, categories, ratings, map links, and provider attributions. Prices, opening hours, reviews, and photos are not fetched or inferred. Missing ratings/addresses are shown as unavailable.
- Concurrent identical searches share their in-flight request. Completed Google place content is not cached on the server or saved in browser storage. Responses use `Cache-Control: no-store`.
- The endpoint validates category, radius, coordinates, body size, content type, and browser origin. It permits at most 20 searches per minute per server instance. This local limit is not a distributed abuse defense: use Google quotas and your host's rate limits before broader public use.
- Changing mode/location while a request is pending discards stale responses. Location permission failures leave manual input available, and errors offer a return to the working demo. No user location is requested until the location button is pressed.

## Validation

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run test:server
npx playwright install chromium
npm test
```

If Chromium is already installed, run `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`. Tests use synthetic fixtures for Places and Google Maps; no genuine keys or paid requests are needed. Real Google credentials were absent during implementation, so live API authorization, billing, and actual Maps SDK rendering still need a manual check after configuration. Demo rendering, the live UI flow with fixtures, input validation, errors, API request shapes, and server-key separation are tested.
