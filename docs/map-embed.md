# Map embed for Figma Sites

The separate `/map/embed` page contains only a map, optional compact search controls, clickable place details, and a small source/status disclosure. The full `/map` website stays available. Both layouts share the same discovery logic and server endpoint.

The default is a Leaflet demo with fictional Berkeley activities. Real mode uses Google Maps and server-side Places API (New). Loading either mode makes **no Places requests**. Click **Discover Side Quests** to search; filtering displayed pins, selecting pins, panning, and toggling controls do not call Places. Google Maps loads only after a successful real search returns places. Search and map loads are separately metered.

## Customize the URL

Use your deployed site's origin followed by `/map/embed`. Query parameters set initial options:

| Parameter | Values | Default |
| --- | --- | --- |
| `mode` | `demo`, `live` | `demo` |
| `category` | `all`, `food`, `cafe`, `boba`, `sports`, `park`, `outdoors` | `all` |
| `location` | URL-encoded city, address, or `latitude, longitude` (200 characters maximum) | `Berkeley, CA` |
| `radius` | `1000`, `3000`, `5000`, `10000` (meters) | `5000` |
| `controls` | `visible`, `hidden` | `visible` |
| `theme` | `light`, `dark` (controls and surrounding UI) | `light` |
| `accent` | Six-digit hex color without `#`, e.g. `336699` | `294434` |

Unsupported options safely fall back to defaults. Never put API keys in the URL. Theme/accent style the controls; Google map styling still uses the configured map ID and marker colors indicate categories. Location and radius apply when you submit discovery; category filters also affect existing demo pins immediately. Demo locations remain illustrative Berkeley samples.

Examples after deploying:

- Compact boba demo: `https://neoquest-three.vercel.app/map/embed?category=boba&controls=hidden`
- Real café search ready to submit: `https://neoquest-three.vercel.app/map/embed?mode=live&category=cafe&location=Berkeley%2C%20CA&radius=1000&accent=336699`
- Dark controls: `https://neoquest-three.vercel.app/map/embed?theme=dark&accent=9ac59e`

Hidden controls can always be reopened with **Search controls**. In live mode, a discovery button remains available even when the toolbar is hidden. No automatic search or location-permission request occurs on iframe load.

## Add to Figma Sites

Select an Embed element and paste the URL into its URL field, or use this HTML:

```html
<iframe
  src="https://neoquest-three.vercel.app/map/embed?category=boba&amp;controls=hidden"
  title="NeoQuest activity map"
  width="100%"
  height="600"
  style="border:0; display:block;"
  allow="geolocation"
  loading="lazy"
></iframe>
```

Use a frame at least 360 px high with hidden controls; 600 px or more is a comfortable starting point when controls are visible, especially on mobile. The map fits the iframe and updates its size when the controls open or the frame changes. Attribution and sample/provider disclosures remain visible. Test in Figma Sites Preview and the published site. Ordinary Figma Design prototypes are not a live website host.

Figma controls outside the iframe do not automatically control its map. This version uses its own compact controls and initial URL preferences; it does not add a `postMessage` bridge or implement the team's external preference/list UI. A future Sites code component can update the embed URL after a submitted search, but the user must still initiate live discovery inside the embed. Provider quota and data-display rules still apply.

Current location needs HTTPS, browser permission, and geolocation permission through every parent iframe. `allow="geolocation"` helps only when Figma/the parent site's permissions policy also permits it. Manual location input remains available.

## Deploy and test

Review and merge the feature PR yourself to update your connected Vercel production deployment. Before merging, use its Vercel Preview deployment if the repository integration creates one. Preview and Production must each have the two variables from [the discovery setup guide](discovery.md). Allow the exact Vercel hostname in the browser Maps key; do not allow every `*.vercel.app` website. Vercel previews may require login; use an accessible deployment when embedding for teammates. Do not change authentication settings automatically.

Google requests originate from the Vercel app, so the map key should allow that app's hostname; the Figma parent hostname is not a substitute. No additional API or key is needed for this route. The existing optional GitHub Pages export supports the demo embed only.

Locally use the existing `npm run dev` command and visit `/map/embed`. Run `npm run build`, `npm run test:server`, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` when system Chromium is available. Automated tests use synthetic Google/Places fixtures and intercepted tiles; they do not consume paid API requests or prove live provider authorization.
