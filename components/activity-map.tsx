"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { BERKELEY_CENTER, categories, type Activity } from "@/lib/activities";
import "leaflet/dist/leaflet.css";

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
      title={`Sample: ${activity.name}`}
      alt={`Show ${activity.name}`}
      eventHandlers={{ click: () => onSelect(activity.id) }}
    >
      <Popup>
        <article className="activity-popup">
          <span className="popup-label">
            SAMPLE ACTIVITY · {category.label.toUpperCase()}
          </span>
          <h2>{activity.name}</h2>
          <p>{activity.description}</p>
          <span className="popup-area">{activity.area}</span>
          <p className="popup-disclaimer">
            Illustrative location. Not a verified venue.
          </p>
        </article>
      </Popup>
    </Marker>
  );
}

function Recenter({ resetKey }: { resetKey: number }) {
  const map = useMap();
  useEffect(() => {
    if (resetKey > 0) map.setView(BERKELEY_CENTER, 14);
  }, [map, resetKey]);
  return null;
}

export default function ActivityMap({
  activities,
  selection,
  onSelect,
  resetKey,
}: {
  activities: Activity[];
  selection: { id: string } | null;
  onSelect: (id: string) => void;
  resetKey: number;
}) {
  const [tileError, setTileError] = useState(false);
  return (
    <>
      <MapContainer
        center={BERKELEY_CENTER}
        zoom={14}
        minZoom={11}
        maxZoom={18}
        scrollWheelZoom={false}
        fadeAnimation={false}
        className="leaflet-map"
        aria-label="Berkeley sample activity map"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          keepBuffer={1}
          updateWhenIdle
          eventHandlers={{ tileerror: () => setTileError(true) }}
        />
        <Recenter resetKey={resetKey} />
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
