import { expect, test } from "@playwright/test";
import { mapFixture } from "./fixtures/maps";

test.beforeEach(async ({ page }) => { await mapFixture(page); });

test("embed is map-only, supports URL styling and filters, and does not search on load", async ({ page }) => {
  let searches = 0;
  page.on("request", (r) => { if (r.url().includes("/api/discover")) searches++; });
  await page.goto("/map/embed?category=boba&theme=dark&accent=336699");
  await expect(page.locator(".map-embed")).toHaveClass(/embed-dark/);
  expect(await page.locator(".map-embed").evaluate((e) => getComputedStyle(e).getPropertyValue("--embed-accent"))).toBe("#336699");
  await expect(page.getByLabel("Category", { exact: true })).toHaveValue("boba");
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(1);
  await expect(page.locator(".explorer-header, .activity-sidebar, .activity-card")).toHaveCount(0);
  await expect(page.locator(".embed-status")).toContainText("Fictional sample activities");
  await page.locator(".leaflet-marker-icon").click();
  await expect(page.locator(".activity-popup")).toContainText("SAMPLE ACTIVITY");
  await page.getByLabel("Category", { exact: true }).selectOption("park");
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(2);
  expect(searches).toBe(0);
});

test("hidden controls can be opened and the map resizes within the viewport", async ({ page }) => {
  await page.goto("/map/embed?controls=hidden");
  await expect(page.locator(".embed-controls")).toHaveCount(0);
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(12);
  const before = await page.locator(".leaflet-container").boundingBox();
  await page.getByRole("button", { name: "Show search controls" }).click();
  await expect(page.getByLabel("Search near")).toBeVisible();
  const after = await page.locator(".leaflet-container").boundingBox();
  expect(after!.height).toBeLessThan(before!.height);
  expect(after!.height).toBeGreaterThan(150);
  const status = await page.locator(".embed-status").boundingBox();
  expect(status!.y).toBeGreaterThanOrEqual(after!.y + after!.height - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await page.getByRole("button", { name: "Hide search controls" }).click();
  await expect(page.locator(".embed-controls")).toHaveCount(0);
});

test("live URL preferences submit once, pins show provider details and filtering makes no new request", async ({ page }) => {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/discover", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ json: {
      center: { lat: 37.8716, lng: -122.2727 }, locationLabel: "Oakland fixture",
      activities: [{ id: "fixture-place", name: "Synthetic Boba Fixture", category: "boba", description: "Test data only.", area: "Fixture address", address: "123 Fixture Street", position: [37.8716, -122.2727], source: "google" }],
    } });
  });
  await page.goto("/map/embed?mode=live&category=boba&location=Oakland%2C%20CA&radius=1000");
  await expect(page.getByRole("button", { name: "Real places", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(requests).toHaveLength(0);
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect(page.locator(".google-activity-marker")).toHaveCount(1);
  expect(requests).toEqual([{ location: "Oakland, CA", category: "boba", radius: 1000 }]);
  await page.getByRole("button", { name: "Show Synthetic Boba Fixture" }).click();
  await expect(page.locator(".google-place-detail")).toContainText("123 Fixture Street");
  await expect(page.locator(".google-place-detail")).toContainText("Rating not provided");
  await page.getByRole("button", { name: "Close place details" }).click();
  await expect(page.locator(".google-place-detail")).toHaveCount(0);
  await page.getByLabel("Category", { exact: true }).selectOption("cafe");
  await expect(page.locator(".google-activity-marker")).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

test("a hidden live embed still requires a click and can recover to demo after errors", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/discover", (route) => { calls++; return route.fulfill({ status: 503, json: { error: "Test provider unavailable" } }); });
  await page.goto("/map/embed?mode=live&controls=hidden");
  await expect(page.getByRole("button", { name: "Discover Side Quests" })).toBeVisible();
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect(page.locator(".embed-error")).toContainText("Test provider unavailable");
  await page.getByRole("button", { name: "Return to demo mode" }).click();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(12);
  expect(calls).toBe(1);
});

test("embed fits a parent iframe and preserves map attribution", async ({ page }) => {
  await page.route("**/embed-test-parent", (route) => route.fulfill({ contentType: "text/html", body: '<html><body style="margin:0"><iframe title="Embedded NeoQuest" src="/map/embed?controls=hidden" style="border:0;width:100%;height:500px"></iframe></body></html>' }));
  await page.goto("/embed-test-parent");
  const frame = page.frameLocator('iframe[title="Embedded NeoQuest"]');
  await expect(frame.locator(".leaflet-marker-icon")).toHaveCount(12);
  await expect(frame.locator(".leaflet-control-attribution")).toContainText("OpenStreetMap");
  const box = await frame.locator(".map-embed").boundingBox();
  expect(box!.height).toBeCloseTo(500, 1);
  expect(await frame.locator("body").evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
});

test("search this area uses the panned Google center and current preferences, and keeps an empty map searchable", async ({ page }) => {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/discover", (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    return route.fulfill({ json: { center: body.center ?? { lat: 37.8716, lng: -122.2727 }, locationLabel: "Your search location", activities: [] } });
  });
  await page.goto("/map/embed?mode=live&controls=hidden&category=cafe&radius=1000");
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect(page.locator(".test-google-map")).toHaveCount(1);
  const point = { lat: 37.8, lng: -122.4 };
  await page.locator(".test-google-map").evaluate((el, center) => el.dispatchEvent(new CustomEvent("fixture-pan", { detail: center })), point);
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: "Search this area", exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1]).toEqual({ center: point, category: "cafe", radius: 1000 });
  await expect(page.locator(".test-google-map")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Search this area", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Show search controls" }).click();
  await expect(page.getByLabel("Search near")).toHaveValue("Map area");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("demo area searches stay local when the Leaflet map is dragged", async ({ page }) => {
  let calls = 0;
  page.on("request", (request) => { if (request.url().includes("/api/discover")) calls++; });
  await page.goto("/map/embed?controls=hidden&radius=1000");
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(12);
  const box = (await page.locator(".leaflet-container").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.4 + 100, box.y + box.height * 0.6, { steps: 15 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Search this area", exact: true }).click();
  await expect(page.locator(".embed-status")).toContainText("Fictional sample activities");
  expect(await page.locator(".leaflet-marker-icon").count()).toBeLessThan(12);
  expect(calls).toBe(0);
});
