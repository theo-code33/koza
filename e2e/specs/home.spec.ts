import { test, expect } from "@playwright/test";

test("landing page shows the kōza wordmark", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "kōza" })).toBeVisible();
});
