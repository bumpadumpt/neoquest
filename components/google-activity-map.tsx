"use client";

import { useEffect, useRef, useState } from "react";
import { categories, type Activity } from "@/lib/activities";
import type { SearchCenter } from "@/lib/discovery";
import { loadGoogleMap } from "@/lib/google-map-loader";
import { PlaceInfo } from "./place-info";

export default function GoogleActivityMap({
  activities,
  center,
  selection,
  onSelect,
  resetKey,
  onViewCenterChange,
}: {
  activities: Activity[];
  center: SearchCenter;
  selection: { id: string } | null;
  onSelect: (id: string) => void;
  resetKey: number;
  onViewCenterChange?: (center: SearchCenter) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState("");
  const selected = activities.find((a) => a.id === selection?.id);
  useEffect(() => {
    if (!map || !onViewCenterChange) return;
    const report = () => {
      const point = map.getCenter();
      if (point) onViewCenterChange({ lat: point.lat(), lng: point.lng() });
    };
    report();
    const listener = map.addListener("idle", report);
    return () => listener.remove();
  }, [map, onViewCenterChange]);
  useEffect(() => {
    let cancelled = false;
    loadGoogleMap()
      .then(async () => {
        const { Map } = (await google.maps.importLibrary(
          "maps",
        )) as google.maps.MapsLibrary;
        await google.maps.importLibrary("marker");
        if (!cancelled && container.current)
          setMap(
            new Map(container.current, {
              center,
              zoom: 14,
              mapId:
                process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }),
          );
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "The live map is unavailable.",
          );
      });
    const callbacks = window as unknown as Record<string, unknown>;
    const oldAuthFailure = callbacks.gm_authFailure;
    callbacks.gm_authFailure = () => {
      if (!cancelled)
        setError(
          "Google rejected the Maps key. Check billing and website restrictions, or use demo mode.",
        );
    };
    return () => {
      cancelled = true;
      callbacks.gm_authFailure = oldAuthFailure;
    };
    // Initialize once; the effect below updates the requested center.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    map?.panTo(center);
  }, [map, center, resetKey]);
  useEffect(() => {
    if (selected)
      map?.panTo({ lat: selected.position[0], lng: selected.position[1] });
  }, [map, selected, selection]);
  useEffect(() => {
    if (!map) return;
    const markers = activities.map((activity) => {
      const category = categories.find((c) => c.id === activity.category)!;
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "google-activity-marker";
      pin.setAttribute("aria-label", `Show ${activity.name}`);
      pin.setAttribute("aria-pressed", String(selection?.id === activity.id));
      pin.style.background = category.color;
      pin.textContent = category.emoji;
      pin.addEventListener("click", () => onSelect(activity.id));
      return new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: activity.position[0], lng: activity.position[1] },
        title: activity.name,
        content: pin,
      });
    });
    return () => {
      markers.forEach((marker) => {
        marker.map = null;
      });
    };
  }, [map, activities, selection, onSelect]);
  return (
    <>
      <div
        ref={container}
        className="google-map"
        aria-label="Google map of discovered places"
      />
      {!map && !error && (
        <div className="map-loading google-map-loading" role="status">
          Opening the live map…
        </div>
      )}
      {error && (
        <div className="tile-error" role="alert">
          {error}
        </div>
      )}
      {map && !error && selected && (
        <article
          className="google-place-detail activity-popup"
          aria-label="Selected place"
        >
          <span className="popup-label">
            GOOGLE PLACE ·{" "}
            {categories
              .find((c) => c.id === selected.category)!
              .label.toUpperCase()}
          </span>
          <h2>{selected.name}</h2>
          <PlaceInfo activity={selected} />
        </article>
      )}
    </>
  );
}
