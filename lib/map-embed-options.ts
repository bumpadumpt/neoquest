import { categories } from "./activities";
import type { DiscoveryDefaults } from "./use-activity-discovery";

export type MapEmbedOptions = Required<DiscoveryDefaults> & {
  controls: boolean;
  theme: "light" | "dark";
  accent: string;
};

// Accept only a small documented set of URL options; never read keys from URLs.
export function parseMapEmbedOptions(params: { get(name: string): string | null }): MapEmbedOptions {
  const category = params.get("category");
  const radius = Number(params.get("radius"));
  const location = params.get("location")?.trim();
  const accent = params.get("accent") ?? "294434";
  return {
    mode: params.get("mode") === "live" ? "live" : "demo",
    category: categories.find((c) => c.id === category)?.id ?? "all",
    location: location && location.length <= 200 ? location : "Berkeley, CA",
    radius: [1000, 3000, 5000, 10000].includes(radius) ? radius : 5000,
    controls: params.get("controls") !== "hidden",
    theme: params.get("theme") === "dark" ? "dark" : "light",
    accent: /^#[\da-f]{6}$/i.test(accent) ? accent : /^[\da-f]{6}$/i.test(accent) ? `#${accent}` : "#294434",
  };
}
