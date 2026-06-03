import { expect, test } from "@playwright/test";
import { sitePath } from "./paths";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "test-results", "viewports");

test.describe("トップ — viewport 見え方記録", () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test("desktop 1280×800", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(sitePath());
    await expect(page.getByRole("heading", { level: 1, name: "霞ノ杜町" })).toBeVisible();
    await expect(page.getByRole("region", { name: "メインビジュアル" })).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, "top-1280x800.png") });
  });

  test("mobile 375×812", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(sitePath());
    await expect(page.getByRole("heading", { level: 1, name: "霞ノ杜町" })).toBeVisible();
    await expect(page.getByText("よく使うページ")).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, "top-375x812.png"), fullPage: true });
  });

  test("mobile 375: メガメニュー展開", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(sitePath());
    const menuBtn = page.getByRole("button", { name: "メニュー" });
    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("よく使うページ")).toBeHidden();
    await page.screenshot({ path: path.join(OUT_DIR, "top-375x812-mega-open.png") });
  });
});
