"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  LocateFixed,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Brand } from "./brand";
import { categories } from "@/lib/activities";
import { useActivityDiscovery } from "@/lib/use-activity-discovery";

const ActivityMap = dynamic(() => import("./activity-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      Opening the demo map…
    </div>
  ),
});
const GoogleActivityMap = dynamic(() => import("./google-activity-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      Opening the live map…
    </div>
  ),
});

export function Explorer({
  liveSupported = true,
  provider = "google",
}: {
  liveSupported?: boolean;
  provider?: "google" | "osm";
}) {
  const {
    mode, category, selection, resetKey, location, radius, center, locationLabel,
    activities, liveResults, searched, busy, locating, error, onSelect,
    chooseMode, chooseCategory, useCurrentLocation, discover, cancelSearch,
    setLocation, setRadius, setSelection, setResetKey,
  } = useActivityDiscovery({ provider, mode: provider === "osm" ? "live" : "demo", radius: provider === "osm" ? 1000 : 5000 });
  return (
    <div className="explorer">
      <header className="explorer-header">
        <Brand />
        <Link href="/" className="back-link">
          <ArrowLeft size={15} /> Back home
        </Link>
        <Link href={provider === "osm" ? "/map" : "/map/open"} className="back-link">
          {provider === "osm" ? "Google finder" : "OpenStreetMap finder"}
        </Link>
        <span className="prototype-tag">SIDE QUEST DISCOVERY</span>
      </header>
      <main>
        <section className="explorer-intro">
          <div>
            <span className="eyebrow">
              A LITTLE SPONTANEITY GOES A LONG WAY
            </span>
            <h1>
              Your kind of nearby<span>✳</span>
            </h1>
            <p>Find a place to start. Bring your favorite people.</p>
          </div>
          <div className="berkeley-badge">
            <MapPin size={17} />
            <div>
              <strong>{locationLabel}</strong>
              <span>
                {mode === "demo"
                  ? "Sample ideas. Endless possibilities."
                  : "Nearby places, picked by category and distance."}
              </span>
            </div>
          </div>
        </section>
        <div className="sample-notice">
          <Sparkles size={16} />
          <p>
            {mode === "demo" ? (
              <>
                <strong>You’re exploring demo mode.</strong> All activities are
                fictional sample ideas with illustrative locations, not verified
                businesses or recommendations.
              </>
            ) : (
              <>
                <strong>{provider === "osm" ? "Real places from OpenStreetMap." : "Real places from Google Places."}</strong>{" "}
                {provider === "osm" ? "Community-mapped places; coverage varies. No ratings or reviews. Check access before visiting." : "Ratings are shown only when provided. Check availability directly with the venue."}
              </>
            )}
          </p>
        </div>
        <div className="explorer-workspace">
          <aside
            className="activity-sidebar"
            aria-label="Activity list and category filters"
          >
            <div className="sidebar-heading">
              <h2>What’s the vibe?</h2>
              <p>A quest for every kind of day.</p>
            </div>
            <div className="discovery-controls">
              <div className="discovery-mode" aria-label="Discovery mode">
                <button
                  className={mode === "demo" ? "active" : ""}
                  aria-pressed={mode === "demo"}
                  onClick={() => chooseMode("demo")}
                >
                  Demo mode
                </button>
                <button
                  className={mode === "live" ? "active" : ""}
                  aria-pressed={mode === "live"}
                  onClick={() => chooseMode("live")}
                  disabled={!liveSupported}
                >
                  Real places
                </button>
              </div>
              {!liveSupported && (
                <p className="setup-note">
                  This static preview supports demo mode. Real places need a
                  server deployment.
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void discover();
                }}
              >
                <label htmlFor="discovery-location">Search near</label>
                <input
                  id="discovery-location"
                  maxLength={200}
                  value={location}
                  placeholder="City, address, or latitude, longitude"
                  onChange={(e) => {
                    cancelSearch();
                    setLocation(e.target.value);
                  }}
                />
                <button
                  className="current-location-button"
                  type="button"
                  disabled={locating}
                  onClick={useCurrentLocation}
                >
                  <LocateFixed size={14} />
                  {locating
                    ? "Getting your location…"
                    : "Use my current location"}
                </button>
                <label htmlFor="discovery-radius">Search distance</label>
                <select
                  id="discovery-radius"
                  value={radius}
                  onChange={(e) => {
                    cancelSearch();
                    setRadius(Number(e.target.value));
                  }}
                >
                  <option value={1000}>1 km</option>
                  <option value={3000}>3 km</option>
                  <option value={5000}>5 km</option>
                  {provider !== "osm" && <option value={10000}>10 km</option>}
                </select>
                <button
                  type="submit"
                  className="button dark discover-button"
                  disabled={busy || locating}
                >
                  {busy ? "Discovering…" : "Discover Side Quests"}
                  <Sparkles size={14} />
                </button>
              </form>
              {error && (
                <div className="discovery-error" role="alert">
                  <p>{error}</p>
                  {mode === "live" && (
                    <button
                      className="return-demo"
                      onClick={() => chooseMode("demo")}
                    >
                      Return to demo mode
                    </button>
                  )}
                </div>
              )}
            </div>
            <div
              className="category-filters"
              aria-label="Filter activities by category"
            >
              <button
                onClick={() => chooseCategory("all")}
                aria-pressed={category === "all"}
                className={category === "all" ? "active" : ""}
              >
                ✦ All ideas
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => chooseCategory(c.id)}
                  aria-pressed={category === c.id}
                  className={category === c.id ? "active" : ""}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="list-heading">
              <h2>
                {mode === "demo"
                  ? "A little inspiration"
                  : "Discovered side quests"}
              </h2>
              <span role="status">{activities.length} activities</span>
            </div>
            <div className="activity-list" aria-busy={busy}>
              {busy && (
                <p className="empty-discovery" role="status">
                  Finding nearby possibilities…
                </p>
              )}
              {!busy && !activities.length && (
                <p className="empty-discovery">
                  {!searched && mode === "live"
                    ? "Enter a location and press Discover Side Quests to find real places."
                    : "No matching activities here. Try another category, a wider distance, or a new discovery search."}
                </p>
              )}
              {activities.map((activity) => {
                const c = categories.find((c) => c.id === activity.category)!;
                return (
                  <button
                    key={activity.id}
                    className={`activity-card ${selection?.id === activity.id ? "selected" : ""}`}
                    onClick={() => onSelect(activity.id)}
                    aria-pressed={selection?.id === activity.id}
                  >
                    <span
                      className="activity-art"
                      style={{ background: c.color }}
                    >
                      {c.emoji}
                    </span>
                    <span className="activity-copy">
                      <span className="activity-category">
                        {c.label} ·{" "}
                        {mode === "demo" ? "Sample" : provider === "osm" ? "OSM place" : "Google place"}
                      </span>
                      <strong>{activity.name}</strong>
                      <span className="activity-area">
                        <MapPin size={10} />
                        {activity.address ?? activity.area}
                      </span>
                      {mode === "live" && provider !== "osm" && (
                        <span className="card-rating">
                          {activity.rating === undefined
                            ? "Rating not provided"
                            : `${activity.rating.toFixed(1)} / 5`}
                        </span>
                      )}
                    </span>
                    <ArrowUpRight size={16} className="card-arrow" />
                  </button>
                );
              })}
            </div>
            <p className="sidebar-note">
              {mode === "demo"
                ? "Demo ideas are around Berkeley. No keys or searches are needed."
                : "Places are sorted by distance. Filtering loaded places makes no new API requests. Press Discover to search your selected category again."}
            </p>
          </aside>
          <section className="map-pane" aria-label="Interactive map">
            {mode === "demo" || provider === "osm" ? (
              <ActivityMap
                activities={activities}
                selection={selection}
                onSelect={onSelect}
                resetKey={resetKey}
                center={center}
              />
            ) : liveResults.length ? (
              <GoogleActivityMap
                activities={activities}
                center={center}
                selection={selection}
                onSelect={onSelect}
                resetKey={resetKey}
              />
            ) : (
              <div className="map-loading">
                <Compass size={28} />
                <span>
                  {busy
                    ? "Finding nearby side quests…"
                    : "Discover real places to open the Google map."}
                </span>
              </div>
            )}
            <button
              className="recenter-button"
              onClick={() => {
                setSelection(null);
                setResetKey((k) => k + 1);
              }}
              aria-label="Recenter on search location"
            >
              <LocateFixed size={17} />
              <span>Back to search location</span>
            </button>
            {mode === "demo" && (
              <div className="map-hint">
                <Compass size={18} />
                <span>Pick a pin. Find a little possibility.</span>
              </div>
            )}
          </section>
        </div>
      </main>
      <footer className="explorer-footer">
        <span>A little adventure. A lot of possibility.</span>
        <span>
          {mode === "demo"
            ? "Sample data · No API keys needed"
            : provider === "osm" ? "Data © OpenStreetMap contributors · No Google APIs" : "Places from Google · Searches run only when requested"}
        </span>
      </footer>
    </div>
  );
}
