import { Suspense } from "react";
import { MapEmbed } from "@/components/map-embed";

export default function MapEmbedPage() {
  return (
    <Suspense fallback={<div className="map-loading">Opening the map…</div>}>
      <MapEmbed liveSupported={process.env.NEOQUEST_GITHUB_PAGES !== "true"} />
    </Suspense>
  );
}
