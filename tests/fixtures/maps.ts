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
      constructor(public container: HTMLElement) {
        container.classList.add("test-google-map");
      }
      panTo(center: unknown) {
        this.container.dataset.center = JSON.stringify(center);
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
