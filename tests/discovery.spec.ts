import { expect, test } from "@playwright/test";
import { mapFixture } from "./fixtures/maps";

const result = {
  center: { lat: 37.8716, lng: -122.2727 },
  locationLabel: "Berkeley, CA",
  activities: [
    {
      id: "fixture-cafe",
      name: "Fixture Café",
      category: "cafe",
      description: "A fixture from the mocked provider.",
      address: "123 Fixture Street, Berkeley",
      area: "Berkeley",
      position: [37.872, -122.273],
      rating: 4.2,
      source: "google",
      mapsUrl: "https://maps.google.com/?cid=123",
    },
    {
      id: "fixture-park",
      name: "Fixture Park",
      category: "park",
      description: "Another mocked provider result.",
      address: "456 Fixture Avenue, Berkeley",
      area: "Berkeley",
      position: [37.873, -122.274],
      source: "google",
    },
  ],
};
test.beforeEach(async ({ page }) => {
  await mapFixture(page);
});

test("demo is default and filters or discovery make no Places requests", async ({
  page,
}) => {
  let calls = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/discover")) calls++;
  });
  await page.goto("/map");
  await expect(
    page.getByRole("button", { name: "Demo mode", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .locator(".category-filters")
    .getByRole("button", { name: "Boba" })
    .click();
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect(page.locator(".activity-card")).toHaveCount(1);
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(1);
  expect(calls).toBe(0);
});

test("live discovery uses Google pins and cards, preserves unknown ratings, and filters without new requests", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/discover", (route) => {
    calls++;
    return route.fulfill({ json: result });
  });
  await page.goto("/map");
  await page.getByRole("button", { name: "Real places", exact: true }).click();
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect(page.locator(".google-activity-marker")).toHaveCount(2);
  await expect(page.locator(".leaflet-container")).toHaveCount(0);
  await expect(page.locator(".activity-card")).toHaveCount(2);
  await expect(
    page.getByText("Rating not provided", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show Fixture Café", exact: true })
    .click();
  await expect(page.locator(".google-place-detail h2")).toHaveText(
    "Fixture Café",
  );
  await expect(page.locator(".google-place-detail")).toContainText(
    "123 Fixture Street, Berkeley",
  );
  await expect(page.locator(".google-place-detail")).toContainText("4.2 / 5");
  await page
    .locator(".category-filters")
    .getByRole("button", { name: "Cafés" })
    .click();
  await expect(page.locator(".activity-card")).toHaveCount(1);
  await expect(page.locator(".google-activity-marker")).toHaveCount(1);
  expect(calls).toBe(1);
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect.poll(() => calls).toBe(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("manual and current locations are submitted only on discovery", async ({
  page,
  context,
}) => {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/discover", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ json: result });
  });
  await page.goto("/map");
  await page.getByRole("button", { name: "Real places", exact: true }).click();
  await page.getByLabel("Search near").fill("Oakland, CA");
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toMatchObject({
    location: "Oakland, CA",
    category: "all",
    radius: 5000,
  });
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 37.86, longitude: -122.29 });
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByLabel("Search near")).toHaveValue("Current location");
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1]).toMatchObject({ center: { lat: 37.86, lng: -122.29 } });
  expect(JSON.stringify(requests)).not.toContain("key");
});

test("failed discovery can return to working demo mode", async ({ page }) => {
  await page.route("**/api/discover", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Live discovery isn’t configured yet." },
    }),
  );
  await page.goto("/map");
  await page.getByRole("button", { name: "Real places", exact: true }).click();
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect(page.locator(".discovery-error")).toContainText(
    "isn’t configured",
  );
  await page.getByRole("button", { name: "Return to demo mode" }).click();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(12);
  await expect(page.locator(".activity-card")).toHaveCount(12);
});

test("switching to demo discards an in-flight live search", async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/discover", async (route) => {
    await pending;
    await route.fulfill({ json: result });
  });
  await page.goto("/map");
  await page.getByRole("button", { name: "Real places", exact: true }).click();
  const started = page.waitForRequest("**/api/discover");
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await started;
  await page.getByRole("button", { name: "Demo mode", exact: true }).click();
  release();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(12);
  await expect(page.locator(".google-activity-marker")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Demo mode", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("denied location access leaves manual search available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: (_: unknown, fail: () => void) => fail() },
    });
  });
  await page.goto("/map");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.locator(".discovery-error")).toContainText(
    "enter a city or address",
  );
  await page.getByLabel("Search near").fill("Berkeley");
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect(page.locator(".discovery-error")).toHaveCount(0);
  await expect(page.locator(".activity-card")).toHaveCount(12);
});

test("real API route rejects invalid input before requiring a key", async ({
  request,
}) => {
  const response = await request.post("/api/discover", {
    data: { center: { lat: 100, lng: 0 } },
  });
  expect(response.status()).toBe(400);
  expect(response.headers()["cache-control"]).toBe("no-store");
});
