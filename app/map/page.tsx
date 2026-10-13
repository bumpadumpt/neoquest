import { Explorer } from "@/components/explorer";
export default function MapPage() {
  return (
    <Explorer liveSupported={process.env.NEOQUEST_GITHUB_PAGES !== "true"} />
  );
}
