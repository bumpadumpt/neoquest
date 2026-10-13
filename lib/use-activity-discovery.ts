"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BERKELEY_CENTER,
  filterActivities,
  sampleActivities,
  type Activity,
  type Category,
} from "@/lib/activities";
import { distanceMeters, type SearchCenter } from "@/lib/discovery";

export type DiscoveryDefaults = {
  mode?: "demo" | "live";
  category?: Category | "all";
  location?: string;
  radius?: number;
};
const berkeley = { lat: BERKELEY_CENTER[0], lng: BERKELEY_CENTER[1] };

// Both website layouts share request cancellation, demo recovery and cost controls.
export function useActivityDiscovery(initial: DiscoveryDefaults = {}) {
  const [mode, setMode] = useState<"demo" | "live">(initial.mode ?? "demo");
  const [category, setCategory] = useState<Category | "all">(initial.category ?? "all");
  const [selection, setSelection] = useState<{ id: string } | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [location, setLocation] = useState(initial.location ?? "Berkeley, CA");
  const [radius, setRadius] = useState(initial.radius ?? 5000);
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
  return {
    mode, category, selection, resetKey, location, radius, center, locationLabel,
    activities, liveResults, searched, busy, locating, error, onSelect,
    chooseMode, chooseCategory, useCurrentLocation, discover, cancelSearch,
    setLocation, setRadius, setSelection, setResetKey,
  };
}
