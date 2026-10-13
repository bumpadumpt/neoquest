"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { Compass, LocateFixed, SlidersHorizontal } from "lucide-react";
import { categories } from "@/lib/activities";
import { parseMapEmbedOptions, type MapEmbedOptions } from "@/lib/map-embed-options";
import { useActivityDiscovery } from "@/lib/use-activity-discovery";

const ActivityMap = dynamic(() => import("./activity-map"), { ssr: false });
const GoogleActivityMap = dynamic(() => import("./google-activity-map"), { ssr: false });

export function MapEmbed({ liveSupported }: { liveSupported: boolean }) {
  const params = useSearchParams();
  const options = parseMapEmbedOptions(params);
  if (!liveSupported) options.mode = "demo";
  // A URL change resets the search and cancels the previous request on unmount.
  return <EmbedContent key={params.toString()} options={options} liveSupported={liveSupported} />;
}

function EmbedContent({ options, liveSupported }: { options: MapEmbedOptions; liveSupported: boolean }) {
  const [showControls, setShowControls] = useState(options.controls);
  const {
    mode, category, selection, resetKey, location, radius, center, activities,
    liveResults, searched, busy, locating, error, onSelect, chooseMode,
    chooseCategory, useCurrentLocation, discover, cancelSearch, setLocation,
    setRadius, setSelection, setResetKey,
  } = useActivityDiscovery(options);
  const foreground = (() => {
    const rgb = options.accent.slice(1).match(/../g)!.map((v) => parseInt(v, 16) / 255);
    return rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 0.55 ? "#111111" : "#ffffff";
  })();
  return (
    <main className={`map-embed embed-${options.theme}`} style={{ "--embed-accent": options.accent, "--embed-on-accent": foreground } as CSSProperties} aria-label="NeoQuest map embed">
      {showControls && (
        <section className="embed-controls" id="embed-controls" aria-label="Map search controls">
          <div className="embed-mode" aria-label="Discovery mode">
            <button aria-pressed={mode === "demo"} onClick={() => chooseMode("demo")}>Demo mode</button>
            <button aria-pressed={mode === "live"} disabled={!liveSupported} onClick={() => chooseMode("live")}>Real places</button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void discover(); }}>
            <label className="embed-location">Search near
              <input value={location} maxLength={200} onChange={(e) => { cancelSearch(); setLocation(e.target.value); }} placeholder="City, address or coordinates" />
            </label>
            <label>Category
              <select aria-label="Category" value={category} onChange={(e) => chooseCategory(e.target.value as typeof category)}>
                <option value="all">All ideas</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <label>Distance
              <select aria-label="Distance" value={radius} onChange={(e) => { cancelSearch(); setRadius(Number(e.target.value)); }}>
                <option value={1000}>1 km</option><option value={3000}>3 km</option><option value={5000}>5 km</option><option value={10000}>10 km</option>
              </select>
            </label>
            <button className="embed-location-button" type="button" disabled={locating} onClick={useCurrentLocation} aria-label="Use my current location"><LocateFixed size={18} /></button>
            <button className="embed-discover" type="submit" disabled={busy || locating}>{busy ? "Discovering…" : "Discover Side Quests"}</button>
          </form>
          {!liveSupported && <p>This static preview supports demo mode. Real places need a server deployment.</p>}
        </section>
      )}
      {error && <div className="embed-error" role="alert"><p>{error}</p>{mode === "live" && <button onClick={() => chooseMode("demo")}>Return to demo mode</button>}</div>}
      <section className="map-pane embed-map" aria-label="Interactive map" aria-busy={busy}>
        {mode === "demo" ? (
          <ActivityMap activities={activities} selection={selection} onSelect={onSelect} resetKey={resetKey} center={center} />
        ) : liveResults.length ? (
          <GoogleActivityMap activities={activities} selection={selection} onSelect={onSelect} resetKey={resetKey} center={center} />
        ) : (
          <div className="map-loading embed-placeholder">
            <Compass size={28} />
            <p>{busy ? "Finding nearby side quests…" : searched ? "No places found. Try another category, distance or location." : "Ready to discover nearby places."}</p>
            {!showControls && <button className="embed-discover" disabled={busy || locating} onClick={() => void discover()}>Discover Side Quests</button>}
          </div>
        )}
        <div className="embed-map-actions">
          <button aria-label={showControls ? "Hide search controls" : "Show search controls"} aria-expanded={showControls} aria-controls="embed-controls" onClick={() => setShowControls((v) => !v)}><SlidersHorizontal size={18} /><span>Search controls</span></button>
          <button aria-label="Recenter on search location" onClick={() => { setSelection(null); setResetKey((v) => v + 1); }}><LocateFixed size={18} /></button>
          {selection && <button onClick={() => setSelection(null)}>Close place details</button>}
        </div>
        {mode === "live" && !showControls && liveResults.length > 0 && <button className="embed-refresh embed-discover" disabled={busy} onClick={() => void discover()}>{busy ? "Discovering…" : "Discover Side Quests"}</button>}
      </section>
      <footer className="embed-status" aria-live="polite">
        <span>{mode === "demo" ? "Fictional sample activities · Berkeley" : "Places from Google · Ratings only when provided"}</span>
        <span>{busy ? "Discovering…" : `${activities.length} ${mode === "demo" ? "sample pins" : "places"}`}</span>
      </footer>
    </main>
  );
}
