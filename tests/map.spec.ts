import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Exercise Leaflet without repeatedly requesting public map tiles in automation.
  // Live tile connectivity is a separate manual smoke check, not claimed by these tests.
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e8ecdf"/></svg>',
    }),
  );
});

test("home links to the map and sample data is clearly disclosed", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore the Berkeley demo" }).click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(
    page.getByText("All activities are fictional sample ideas", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.locator(".activity-card")).toHaveCount(12);
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(12);
  await expect(page.locator(".leaflet-control-attribution")).toContainText(
    "OpenStreetMap",
  );
});

test("category filters update the list and map together", async ({ page }) => {
  await page.goto("/map");
  for (const [category, count] of [
    ["Food", 3],
    ["Sports", 2],
    ["Outdoors", 4],
    ["Cafés", 3],
  ] as const) {
    await page
      .locator(".category-filters")
      .getByRole("button", { name: category, exact: false })
      .click();
    await expect(page.locator(".activity-card")).toHaveCount(count);
    await expect(page.locator(".leaflet-marker-icon")).toHaveCount(count);
  }
  await page.getByRole("button", { name: "All ideas" }).click();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(12);
});

test("markers and sidebar selections show descriptions and category", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/map");
  await page
    .locator('.leaflet-marker-icon[title="Sample: Boba & a little catch-up"]')
    .click();
  await expect(page.locator(".activity-popup h2")).toHaveText(
    "Boba & a little catch-up",
  );
  await expect(page.locator(".popup-label")).toHaveText(
    "SAMPLE ACTIVITY · CAFÉS",
  );
  await expect(page.locator(".activity-popup")).toContainText(
    "Try a new milk-tea flavor",
  );
  await page.getByRole("button", { name: /Golden-hour hoops/ }).click();
  await expect(page.locator(".activity-popup h2")).toHaveText(
    "Golden-hour hoops",
  );
  await expect(page.locator(".popup-label")).toContainText("SPORTS");
  await page.getByRole("button", { name: "Close popup" }).click();
  await expect(page.locator(".activity-popup")).toHaveCount(0);
  await page.getByRole("button", { name: /Golden-hour hoops/ }).click();
  await expect(page.locator(".activity-popup h2")).toHaveText(
    "Golden-hour hoops",
  );
  await page.getByRole("button", { name: "Recenter on Berkeley" }).click();
  await expect(page.locator(".activity-popup")).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("tile failures leave usable markers and a clear message", async ({
  page,
}) => {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.goto("/map");
  await expect(page.locator(".tile-error")).toContainText(
    "Map tiles couldn’t load",
  );
  await page.getByRole("button", { name: /A little matcha moment/ }).click();
  await expect(page.locator(".activity-popup h2")).toHaveText(
    "A little matcha moment",
  );
});
