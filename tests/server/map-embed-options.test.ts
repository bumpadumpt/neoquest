import { describe, expect, it } from "vitest";
import { parseMapEmbedOptions } from "@/lib/map-embed-options";

describe("map embed URL configuration", () => {
  it("defaults to a key-free demo with visible controls", () => {
    expect(parseMapEmbedOptions(new URLSearchParams())).toEqual({
      mode: "demo", category: "all", location: "Berkeley, CA", radius: 5000,
      controls: true, theme: "light", accent: "#294434",
    });
  });
  it("accepts documented preferences and styling", () => {
    expect(parseMapEmbedOptions(new URLSearchParams("mode=live&category=boba&location=Oakland%2C%20CA&radius=1000&controls=hidden&theme=dark&accent=336699"))).toEqual({
      mode: "live", category: "boba", location: "Oakland, CA", radius: 1000,
      controls: false, theme: "dark", accent: "#336699",
    });
  });
  it.each(["red", "url(javascript:alert(1))", "fff", "#123456;background:red"])("rejects unsafe or unsupported accent %s", (accent) => {
    expect(parseMapEmbedOptions(new URLSearchParams({ accent })).accent).toBe("#294434");
  });
  it("falls back for unsupported options and oversized input", () => {
    const parsed = parseMapEmbedOptions(new URLSearchParams({ mode: "anything", category: "unknown", radius: "1000000", theme: "unknown", location: "x".repeat(201) }));
    expect(parsed).toMatchObject({ mode: "demo", category: "all", radius: 5000, theme: "light", location: "Berkeley, CA" });
  });
  it("accepts encoded hex colors and coordinates without accepting keys", () => {
    const parsed = parseMapEmbedOptions(new URLSearchParams("accent=%23ABCDEF&location=37.87%2C%20-122.27&key=untrusted"));
    expect(parsed.accent).toBe("#ABCDEF");
    expect(parsed.location).toBe("37.87, -122.27");
    expect(parsed).not.toHaveProperty("key");
  });
});
