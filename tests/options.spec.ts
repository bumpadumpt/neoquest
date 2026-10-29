import { expect, test } from "@playwright/test";
import { mapFixture } from "./fixtures/maps";

test.beforeEach(async ({ page }) => { await mapFixture(page); });

test("options layout matches four demo cards and keeps subject pins with shared selection", async ({ page }) => {
  let requests = 0;
  page.on("request", (r) => { if (r.url().includes("/api/discover")) requests++; });
  await page.goto("/map/options");
  await expect(page.getByRole("heading", { name: "Activity Options", exact: true })).toBeVisible();
  await expect(page.locator(".option-card")).toHaveCount(4);
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(4);
  await expect(page.locator(".options-disclosure")).toContainText("Fictional sample ideas");
  await expect(page.locator(".options-filters")).toHaveCount(0);
  await page.getByRole("button", { name: "View option 1: Cedar Street picnic" }).click();
  await expect(page.locator(".activity-popup h2")).toHaveText("Cedar Street picnic");
  await expect(page.locator(".option-card.option-selected h2")).toHaveText("Cedar Street picnic");
  await expect(page.locator(".marker-face").first()).toHaveText("🌳");
  await page.getByRole("button", { name: "Close place details" }).click();
  await expect(page.locator(".option-selected")).toHaveCount(0);
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByLabel("Category", { exact: true }).selectOption("boba");
  await expect(page.locator(".option-card")).toHaveCount(1);
  await expect(page.locator(".marker-face")).toHaveText("🧋");
  await page.locator(".leaflet-marker-icon").click();
  await expect(page.locator(".option-selected h2")).toHaveText("Boba & a little catch-up");
  expect(requests).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("options live search preserves provider fields and uses category icons without invented metadata", async ({ page }) => {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/discover", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ json: { center: { lat: 37.87, lng: -122.27 }, locationLabel: "Test city", activities: [{ id: "fixture", name: "Synthetic Café", category: "cafe", description: "Test data", area: "Test address", address: "123 Fixture Street", position: [37.87, -122.27], source: "google" }] } });
  });
  await page.goto("/map/options?mode=live&category=cafe&radius=1000");
  expect(requests).toHaveLength(0);
  await page.getByRole("button", { name: "Discover Side Quests" }).click();
  await expect(page.locator(".option-card")).toHaveCount(1);
  await expect(page.locator(".option-card")).toContainText("Rating not provided");
  await expect(page.locator(".option-card")).toContainText("123 Fixture Street");
  await expect(page.locator(".google-activity-marker")).toHaveText("☕");
  await page.getByRole("button", { name: "Show Synthetic Café" }).click();
  await expect(page.locator(".option-card.option-selected")).toContainText("Synthetic Café");
  await expect(page.locator(".google-place-detail")).toContainText("Rating not provided");
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({ category: "cafe", radius: 1000 });
});
