import type { Page } from "@playwright/test";

export async function mapFixture(page: Page) {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e8ecdf"/></svg>',
    }),
  );
  // Mock the already-loaded SDK, so no Maps key or paid API request is needed.
  await page.addInitScript(() => {
    class MapFixture {
      private center: { lat: number; lng: number };
      private idle = new Set<() => void>();
      constructor(public container: HTMLElement, options: { center: { lat: number; lng: number } }) {
        container.classList.add("test-google-map");
        this.center = options.center;
        container.addEventListener("fixture-pan", ((event: CustomEvent<{ lat: number; lng: number }>) => {
          this.panTo(event.detail);
        }) as EventListener);
      }
      panTo(center: { lat: number; lng: number }) {
        this.center = center;
        this.container.dataset.center = JSON.stringify(center);
        this.idle.forEach((callback) => callback());
      }
      getCenter() {
        return { lat: () => this.center.lat, lng: () => this.center.lng };
      }
      addListener(_name: string, callback: () => void) {
        this.idle.add(callback);
        return { remove: () => this.idle.delete(callback) };
      }
    }
    class MarkerFixture {
      private content: HTMLElement;
      constructor(options: { map: MapFixture; content: HTMLElement }) {
        this.content = options.content;
        options.map.container.append(options.content);
      }
      set map(value: null) {
        if (value === null) this.content.remove();
      }
    }
    (window as unknown as { google: unknown }).google = {
      maps: {
        importLibrary: async (name: string) =>
          name === "maps" ? { Map: MapFixture } : {},
        marker: { AdvancedMarkerElement: MarkerFixture },
      },
    };
  });
}
