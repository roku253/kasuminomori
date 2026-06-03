import { expect, test } from "@playwright/test";
import { sitePath } from "./paths";

const PORT = process.env.PW_PORT ?? "3456";

test.describe("霞ノ杜町 — スモーク（使用感シミュレーション）", () => {
  test("トップ: ヒーロー・お知らせ・フッター", async ({ page }) => {
    await page.goto(sitePath());
    await expect(page).toHaveTitle(/霞ノ杜町/);
    await expect(page.getByRole("heading", { level: 1, name: "霞ノ杜町" })).toBeVisible();
    await expect(page.getByRole("region", { name: "メインビジュアル" })).toBeVisible();
    await expect(page.locator("#top-news")).toBeVisible();
    await expect(page.getByText("よく使うページ")).toBeVisible();
    await expect(page.getByRole("link", { name: /庁舎案内/ }).first()).toBeVisible();
  });

  test("トップ → くらし → ごみ（役所ページ）", async ({ page }) => {
    await page.goto(sitePath());
    await page.getByRole("link", { name: "ごみ収集" }).click();
    await expect(page).toHaveURL(/\/kasuminomori\/kurashi\/gomi\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: "ごみ・リサイクル" })).toBeVisible();
    await expect(page.getByRole("table").first()).toBeVisible();
    await expect(
      page.getByRole("complementary").filter({ hasText: "関連するページ" }).first()
    ).toBeVisible();
  });

  test("カテゴリ index: くらし（ハブカード）", async ({ page }) => {
    await page.goto(sitePath("kurashi/"));
    await expect(page.getByRole("heading", { level: 1, name: "くらし・環境" })).toBeVisible();
    await expect(page.getByRole("link", { name: /ごみ・リサイクル/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /町営バス/ }).first()).toBeVisible();
  });

  test("観光 spot: 霞ノ杜神社（legacy レイアウト）", async ({ page }) => {
    await page.goto(sitePath("spot/1/"));
    await expect(page.getByRole("heading", { level: 1, name: "霞ノ杜神社" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "観光・町案内メニュー" })).toBeVisible();
    await expect(page.getByText("霧払いの大杉")).toBeVisible();
  });

  test("メガメニュー: 開閉と市政リンク", async ({ page }) => {
    await page.goto(sitePath("shisei/koho/"));
    const menuBtn = page.getByRole("button", { name: "メニュー" });
    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("link", { name: "お問い合わせ" }).first().click();
    await expect(page).toHaveURL(/\/kasuminomori\/contact\/?$/);
  });

  test("パンくず: トップへ戻る", async ({ page }) => {
    await page.goto(sitePath("kodomo/hoiku/"));
    await page.getByRole("link", { name: "トップ" }).click();
    await expect(page).toHaveURL(/\/kasuminomori\/?$/);
  });

  test("ルート直アクセスは basePath 配下（404 回避）", async ({ page }) => {
    const res = await page.goto(`http://localhost:${PORT}/`);
    expect(res?.status()).toBe(404);
  });
});
