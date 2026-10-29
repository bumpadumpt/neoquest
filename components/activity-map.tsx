"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { categories, type Activity } from "@/lib/activities";
import type { SearchCenter } from "@/lib/discovery";
import "leaflet/dist/leaflet.css";
import { PlaceInfo } from "./place-info";

const icons = Object.fromEntries(
  categories.map((category) => [
    category.id,
    L.divIcon({
      className: "activity-marker",
      html: `<span class="marker-face" style="background:${category.color}">${category.emoji}</span>`,
      iconSize: [42, 48],
      iconAnchor: [21, 46],
      popupAnchor: [0, -42],
    }),
  ]),
);

function ActivityMarker({
  activity,
  selection,
  onSelect,
}: {
  activity: Activity;
  selection: { id: string } | null;
  onSelect: (id: string) => void;
}) {
  const marker = useRef<L.Marker>(null);
  const category = categories.find((c) => c.id === activity.category)!;
  const map = useMap();
  useEffect(() => {
    if (selection?.id !== activity.id) {
      marker.current?.closePopup();
      return;
    }
    map.setView(activity.position, Math.max(map.getZoom(), 14), {
      animate: false,
    });
    marker.current?.openPopup();
  }, [selection, map, activity]);
  return (
    <Marker
      ref={marker}
      position={activity.position}
      icon={icons[activity.category]}
      title={`${activity.source === "osm" ? "OpenStreetMap" : "Sample"}: ${activity.name}`}
      alt={`Show ${activity.name}`}
      eventHandlers={{ click: () => onSelect(activity.id) }}
    >
      <Popup>
        <article className="activity-popup">
          <span className="popup-label">
            {activity.source === "osm" ? "OPENSTREETMAP PLACE" : "SAMPLE ACTIVITY"} · {category.label.toUpperCase()}
          </span>
          <h2>{activity.name}</h2>
          <PlaceInfo activity={activity} />
        </article>
      </Popup>
    </Marker>
  );
}

function Recenter({
  resetKey,
  center,
}: {
  resetKey: number;
  center: SearchCenter;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 14);
  }, [map, resetKey, center]);
  useEffect(() => {
    // The embed can be resized by Figma or by hiding its search toolbar.
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function ActivityMap({
  activities,
  selection,
  onSelect,
  resetKey,
  center,
}: {
  activities: Activity[];
  selection: { id: string } | null;
  onSelect: (id: string) => void;
  resetKey: number;
  center: SearchCenter;
}) {
  const [tileError, setTileError] = useState(false);
  return (
    <>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        minZoom={11}
        maxZoom={18}
        scrollWheelZoom={false}
        fadeAnimation={false}
        className="leaflet-map"
        aria-label={activities.some((a) => a.source === "osm") ? "OpenStreetMap activity map" : "Sample activity map"}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          keepBuffer={1}
          updateWhenIdle
          eventHandlers={{ tileerror: () => setTileError(true) }}
        />
        <Recenter resetKey={resetKey} center={center} />
        {activities.map((activity) => (
          <ActivityMarker
            key={activity.id}
            activity={activity}
            selection={selection}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>
      {tileError && (
        <div className="tile-error" role="alert">
          Map tiles couldn’t load. Check your connection or allow
          tile.openstreetmap.org. Sample markers and the activity list still
          work.
        </div>
      )}
    </>
  );
}
