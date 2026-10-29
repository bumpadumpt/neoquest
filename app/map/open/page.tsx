import { Explorer } from "@/components/explorer";
export default function OpenMapPage() {
  return <Explorer provider="osm" liveSupported={process.env.NEOQUEST_GITHUB_PAGES !== "true"} />;
}
