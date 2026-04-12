import { test, expect } from "@playwright/test";

const devices = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 14", width: 390, height: 844 },
  { name: "iPad", width: 768, height: 1024 },
  { name: "Desktop HD", width: 1280, height: 800 },
  { name: "Desktop 4K", width: 1920, height: 1080 },
];

for (const device of devices) {
  test(`Hero fits viewport on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto("/");

    const headline = page.locator("main h1").first();
    await expect(headline).toBeVisible();
    const headlineBox = await headline.boundingBox();
    expect(headlineBox).not.toBeNull();
    expect(headlineBox!.y + headlineBox!.height).toBeLessThan(device.height);

    const tryZAI = page.getByRole("button", { name: /Try ZAI/i });
    await expect(tryZAI).toBeVisible();
    const ctaBox = await tryZAI.boundingBox();
    expect(ctaBox).not.toBeNull();
    expect(ctaBox!.y + ctaBox!.height).toBeLessThan(device.height);
  });

  test(`No horizontal scroll on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(device.width + 2);
  });

  test(`Nav visible on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "ZAI" })).toBeVisible();
    await expect(page.getByRole("link", { name: /htu\.io/i }).first()).toBeVisible();
  });
}
