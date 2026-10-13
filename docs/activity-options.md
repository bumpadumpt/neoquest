# Activity Options layout

`/map/options` adds the screenshot-inspired Activity Options page: neutral background, white cards, image placeholders, a Filters toggle, and a map beside the list. On mobile the map moves above the cards. Pins keep the existing subject/category icons; they are not numbered.

Cards and map pins share selection. **View option** opens that place's map details; selecting a pin highlights its card. The initial demo shows four fictional outdoor/park ideas with illustrative distances. Filtered demo categories show up to four sample ideas, while real discovery shows the returned results. Placeholder rectangles are not venue photographs. No prices, visit durations, group suitability, or ratings are invented to reproduce the screenshot.

The page reuses `/api/discover` and the existing two Google keys. In **Filters**, choose real places, a location/category/radius, then press **Discover Side Quests**. Loading the page makes no Places requests; filtering loaded results and selecting places does not search again. Google Maps displays real results; Leaflet displays the demo. Current location is requested only on its button click.

The same initial search URL options as `/map/embed` are supported: `mode`, `category`, `location`, and `radius`. For example:

```text
https://neoquest-three.vercel.app/map/options
https://neoquest-three.vercel.app/map/options?mode=live&category=boba&radius=1000
```

The appearance matches the reference layout and does not use the embed's `theme`, `accent`, or `controls` settings. The original `/map` and `/map/embed` routes remain available.

After reviewing and merging this feature's PR, wait for Vercel production to deploy. Use the public production URL in a Figma Sites Embed element:

```html
<iframe
  src="https://neoquest-three.vercel.app/map/options"
  title="NeoQuest Activity Options"
  style="width:100%; height:800px; border:0; display:block;"
  allow="geolocation"
></iframe>
```

This page scrolls normally so a smaller iframe can contain all cards. Set the Figma element dimensions to fit the design. Public production avoids Vercel Preview login redirects. For live results on a preview, configure variables in Vercel's Preview environment and allow its specific domain in the Maps browser key. See [Google discovery configuration](discovery.md).
