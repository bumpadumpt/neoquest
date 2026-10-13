"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  LocateFixed,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Brand } from "./brand";
import {
  BERKELEY_CENTER,
  categories,
  filterActivities,
  sampleActivities,
  type Activity,
  type Category,
} from "@/lib/activities";
import { distanceMeters, type SearchCenter } from "@/lib/discovery";

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
const berkeley = { lat: BERKELEY_CENTER[0], lng: BERKELEY_CENTER[1] };

export function Explorer({
  liveSupported = true,
}: {
  liveSupported?: boolean;
}) {
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [category, setCategory] = useState<Category | "all">("all");
  const [selection, setSelection] = useState<{ id: string } | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [location, setLocation] = useState("Berkeley, CA");
  const [radius, setRadius] = useState(5000);
  const [center, setCenter] = useState<SearchCenter>(berkeley);
  const [locationLabel, setLocationLabel] = useState("Berkeley, California");
  const [resolvedLocation, setResolvedLocation] = useState<{
    input: string;
    center: SearchCenter;
  }>({ input: "Berkeley, CA", center: berkeley });
  const [demoResults, setDemoResults] = useState(sampleActivities);
  const [liveResults, setLiveResults] = useState<Activity[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const activities = filterActivities(
    mode === "demo" ? demoResults : liveResults,
    category,
  );
  const onSelect = useCallback((id: string) => setSelection({ id }), []);
  useEffect(
    () => () => {
      abort.current?.abort();
      requestId.current++;
    },
    [],
  );
  function cancelSearch() {
    requestId.current++;
    abort.current?.abort();
    setBusy(false);
  }
  function chooseCategory(next: Category | "all") {
    cancelSearch();
    setCategory(next);
    setSelection(null);
  }
  function chooseMode(next: "demo" | "live") {
    cancelSearch();
    setMode(next);
    setError("");
    setSelection(null);
    setSearched(false);
    setLiveResults([]);
    if (next === "demo") {
      setDemoResults(sampleActivities);
      setCenter(berkeley);
      setLocation("Berkeley, CA");
      setLocationLabel("Berkeley, California");
      setResolvedLocation({ input: "Berkeley, CA", center: berkeley });
    }
  }
  function useCurrentLocation() {
    cancelSearch();
    setError("");
    if (!navigator.geolocation) {
      setError(
        "Location access isn’t available. Enter a city or address instead.",
      );
      return;
    }
    setLocating(true);
    const id = requestId.current;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        if (id !== requestId.current) return;
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setResolvedLocation({ input: "Current location", center: next });
        setLocation("Current location");
      },
      () => {
        setLocating(false);
        if (id === requestId.current)
          setError(
            "Couldn’t get your location. Allow location access or enter a city or address.",
          );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }
  async function discover() {
    cancelSearch();
    setError("");
    setSelection(null);
    const input = location.trim();
    if (!input) {
      setError("Enter a city or address, or use your current location.");
      return;
    }
    const knownCenter =
      resolvedLocation.input === input ? resolvedLocation.center : undefined;
    if (mode === "demo") {
      const nextCenter =
        knownCenter ?? (/berkeley/i.test(input) ? berkeley : undefined);
      if (!nextCenter) {
        setError(
          "Demo ideas are around Berkeley. Choose real places to search another city.",
        );
        return;
      }
      setCenter(nextCenter);
      setLocationLabel(input);
      setDemoResults(
        sampleActivities.filter(
          (a) =>
            distanceMeters(nextCenter, {
              lat: a.position[0],
              lng: a.position[1],
            }) <= radius,
        ),
      );
      setSearched(true);
      setResetKey((k) => k + 1);
      return;
    }
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !window.google?.maps) {
      setError(
        "Live pins need a website-restricted Google Maps key. See the API setup guide or use demo mode.",
      );
      return;
    }
    const id = requestId.current;
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(knownCenter ? { center: knownCenter } : { location: input }),
          category,
          radius,
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Search couldn’t complete. Try again or use demo mode.",
        );
      if (id !== requestId.current) return;
      setLiveResults(data.activities);
      setCenter(data.center);
      setResolvedLocation({ input, center: data.center });
      setLocationLabel(
        input === "Current location"
          ? "Your current location"
          : data.locationLabel === "Your search location"
            ? input
            : data.locationLabel,
      );
      setSearched(true);
      setResetKey((k) => k + 1);
    } catch (e) {
      if (id === requestId.current && !controller.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "Search is unavailable. Try demo mode.",
        );
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }
  return (
    <div className="explorer">
      <header className="explorer-header">
        <Brand />
        <Link href="/" className="back-link">
          <ArrowLeft size={15} /> Back home
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
                <strong>Real places from Google Places.</strong> Ratings are
                shown only when provided. Check availability directly with the
                venue.
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
                  <option value={10000}>10 km</option>
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
                        {mode === "demo" ? "Sample" : "Google place"}
                      </span>
                      <strong>{activity.name}</strong>
                      <span className="activity-area">
                        <MapPin size={10} />
                        {activity.address ?? activity.area}
                      </span>
                      {mode === "live" && (
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
            {mode === "demo" ? (
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
            : "Places from Google · Searches run only when requested"}
        </span>
      </footer>
    </div>
  );
}
