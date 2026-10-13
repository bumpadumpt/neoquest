"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Star } from "lucide-react";
import { categories, type Activity } from "@/lib/activities";
import { distanceMeters } from "@/lib/discovery";
import { parseMapEmbedOptions, type MapEmbedOptions } from "@/lib/map-embed-options";
import { useActivityDiscovery } from "@/lib/use-activity-discovery";

const ActivityMap = dynamic(() => import("./activity-map"), { ssr: false });
const GoogleActivityMap = dynamic(() => import("./google-activity-map"), { ssr: false });
const outdoorDemoIds = ["picnic", "sunset", "campus", "walk"];

export function ActivityOptions({ liveSupported }: { liveSupported: boolean }) {
  const params = useSearchParams();
  const options = parseMapEmbedOptions(params);
  if (!liveSupported) options.mode = "demo";
  return <OptionsContent key={params.toString()} options={options} liveSupported={liveSupported} />;
}

function OptionsContent({ options, liveSupported }: { options: MapEmbedOptions; liveSupported: boolean }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const d = useActivityDiscovery(options);
  const places: Activity[] = d.mode === "demo"
    ? d.category === "all" ? outdoorDemoIds.flatMap((id) => d.activities.filter((a) => a.id === id)) : d.activities.slice(0, 4)
    : d.activities;
  const selected = places.find((p) => p.id === d.selection?.id);
  return (
    <main className="options-page">
      <div className="options-shell">
        <Link className="options-brand" href="/">neoquest</Link>
        <Link className="options-back" href="/map"><ArrowLeft size={12} /> Back to activities</Link>
        <h1>Activity Options</h1>
        <p className="options-subtitle">Here are some options that could make a great side quest.</p>
        <button className="options-filter-toggle" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} aria-controls="options-filters">Filters</button>
        {filtersOpen && <section id="options-filters" className="options-filters" aria-label="Activity search filters">
          <div className="options-mode">
            <button aria-pressed={d.mode === "demo"} onClick={() => d.chooseMode("demo")}>Demo mode</button>
            <button aria-pressed={d.mode === "live"} disabled={!liveSupported} onClick={() => d.chooseMode("live")}>Real places</button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void d.discover(); }}>
            <label>Search near<input value={d.location} maxLength={200} onChange={(e) => { d.cancelSearch(); d.setLocation(e.target.value); }} /></label>
            <label>Category<select aria-label="Category" value={d.category} onChange={(e) => d.chooseCategory(e.target.value as typeof d.category)}><option value="all">All ideas</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
            <label>Distance<select aria-label="Distance" value={d.radius} onChange={(e) => { d.cancelSearch(); d.setRadius(Number(e.target.value)); }}><option value={1000}>1 km</option><option value={3000}>3 km</option><option value={5000}>5 km</option><option value={10000}>10 km</option></select></label>
            <button type="submit" className="options-search" disabled={d.busy || d.locating}>{d.busy ? "Discovering…" : "Discover Side Quests"}</button>
            <button type="button" disabled={d.locating} onClick={d.useCurrentLocation}>Use my current location</button>
          </form>
        </section>}
        <p className="options-disclosure">{d.mode === "demo" ? "Demo · Fictional sample ideas and illustrative distances, not verified businesses." : "Places from Google · Ratings shown only when provided."}</p>
        {d.error && <div className="options-error" role="alert">{d.error} <button onClick={() => d.chooseMode("demo")}>Return to demo mode</button></div>}
        <div className="options-summary"><span role="status">{places.length} {d.mode === "demo" ? "sample options" : "options nearby"}</span><span>{d.category === "all" ? "Showing all options" : `Showing ${categories.find((c) => c.id === d.category)?.label}`}</span></div>
        <div className="options-workspace">
          <section className="options-list" aria-label="Activity options" aria-busy={d.busy}>
            {places.map((place, index) => {
              const category = categories.find((c) => c.id === place.category)!;
              const miles = distanceMeters(d.center, { lat: place.position[0], lng: place.position[1] }) / 1609.344;
              return <article className={`option-card ${d.selection?.id === place.id ? "option-selected" : ""}`} key={place.id}>
                <div className="option-image" aria-label="Image placeholder"><span>{place.name}</span></div>
                <div className="option-copy">
                  <span className="option-category">{category.label} · {d.mode === "demo" ? "Sample idea" : "Nearby place"}</span>
                  <h2>{place.name}</h2>
                  <p><MapPin size={11} />{miles.toFixed(1)} miles away{d.mode === "demo" ? " · illustrative" : ""}</p>
                  <p><Star size={11} />{place.rating === undefined ? "Rating not provided" : `${place.rating.toFixed(1)} · Google rating`}</p>
                  <p className="option-address">{place.address ?? place.area}</p>
                  <div className="option-card-bottom"><span className="option-number">Option {index + 1}</span><button aria-label={`View option ${index + 1}: ${place.name}`} aria-pressed={d.selection?.id === place.id} onClick={() => d.onSelect(place.id)}>View option <ArrowRight size={11} /></button></div>
                </div>
              </article>;
            })}
            {!places.length && <div className="options-empty">{d.busy ? "Finding nearby activities…" : d.mode === "live" && !d.searched ? "Choose Filters to set your location, then discover nearby places." : "No matching options. Try another category or distance."}{d.mode === "live" && !d.searched && <button className="options-search" disabled={d.busy} onClick={() => void d.discover()}>Discover Side Quests</button>}</div>}
          </section>
          <section className="map-pane options-map" aria-label="Nearby options map">
            <div className="options-map-caption">{selected ? `Option ${places.indexOf(selected) + 1} · ${selected.name}` : "Nearby options · click a card"}</div>
            {d.mode === "demo" ? <ActivityMap activities={places} center={d.center} selection={d.selection} onSelect={d.onSelect} resetKey={d.resetKey} /> : d.liveResults.length ? <GoogleActivityMap activities={places} center={d.center} selection={d.selection} onSelect={d.onSelect} resetKey={d.resetKey} /> : <div className="map-loading">Discover nearby places to open the map.</div>}
            {selected && <button className="options-close" onClick={() => d.setSelection(null)}>Close place details</button>}
          </section>
        </div>
      </div>
    </main>
  );
}
