import { expect, test } from "@playwright/test";
import { isOnTop } from "./helpers";
import { sitePath } from "./paths";

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

  test("バス時刻表: 関連リンクが404にならない", async ({ page }) => {
    await page.goto(sitePath("kurashi/bus-jikan/"));
    const related = page.getByRole("complementary").filter({ hasText: "関連するページ" });
    await related.getByRole("link", { name: "バスロケ" }).click();
    await expect(page).toHaveURL(/\/kasuminomori\/kurashi\/bus-roke\/?$/);
    await page.goto(sitePath("kurashi/bus-jikan/"));
    await related.getByRole("link", { name: "地図" }).click();
    await expect(page).toHaveURL(/\/kasuminomori\/kurashi\/chizu\/?$/);
    await page.goto(sitePath("kurashi/bus-jikan/"));
    await related.getByRole("link", { name: "アクセス詳細" }).click();
    await expect(page).toHaveURL(/\/kasuminomori\/access\/?$/);
    await page.goto(sitePath("kurashi/bus-jikan/"));
    await related.getByRole("link", { name: "観光" }).click();
    await expect(page).toHaveURL(/\/kasuminomori\/bunka\/?$/);
  });

  test("くらしハブ: ごみカードは /kurashi/gomi/ へ（/gomi/ 404 回避）", async ({ page }) => {
    await page.goto(sitePath("kurashi/"));
    await page
      .locator("#city-main")
      .getByRole("link", { name: /ごみ・リサイクル/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/kasuminomori\/kurashi\/gomi\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: "ごみ・リサイクル" })).toBeVisible();
  });

  // 段階1b で旧型の左メニュー（「観光・町案内メニュー」）を廃止し、共通テンプレート＋ローカルナビにした。
  // 本文の「霧払いの大杉」は段階2（WP3c）で spot の本文を書き直したら合わせて直す。
  test("観光 spot: 霞ノ杜神社（共通テンプレート・ローカルナビ）", async ({ page }) => {
    await page.goto(sitePath("spot/1/"));
    await expect(page.getByRole("heading", { level: 1, name: "霞ノ杜神社" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "観光・町案内メニュー" })).toHaveCount(0);
    const localNav = page.getByRole("navigation", { name: "文化・スポーツ・観光" });
    await expect(localNav).toBeVisible();
    await expect(localNav.getByRole("link", { name: "霞ノ杜神社" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("霧払いの大杉")).toBeVisible();
  });

  // トップも下層と同じヘッダー（写真の上にボタンを置かない）。メニューを開くとパネルと背景が最前面になり、
  // トップの部品（よく使うページ）がメニューに重ならないこと。
  test("トップ: メガメニュー展開時はメニューが最前面（トップの部品が重ならない）", async ({ page }) => {
    await page.goto(sitePath());
    await page.getByRole("button", { name: "メニュー" }).click();
    await expect(page.getByRole("button", { name: "メニュー" })).toHaveAttribute("aria-expanded", "true");
    const mega = page.getByRole("navigation", { name: "サイトメニュー" });
    await expect(mega).toBeVisible();
    await expect(mega.getByText("よく使うリンク")).toBeVisible();
    expect(await isOnTop(mega)).toBe(true);
    expect(await isOnTop(page.getByText("よく使うページ", { exact: true }))).not.toBe(true);
  });

  test("メガメニュー: 開閉と町政リンク", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(sitePath("shisei/koho/"));
    const menuBtn = page.getByRole("button", { name: "メニュー" });
    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");
    await page
      .getByRole("navigation", { name: "サイトメニュー" })
      .getByRole("link", { name: "お問い合わせ" })
      .click();
    await expect(page).toHaveURL(/\/kasuminomori\/contact\/?$/);
  });

  test("パンくず: トップへ戻る", async ({ page }) => {
    await page.goto(sitePath("kodomo/hoiku/"));
    await page.getByRole("link", { name: "トップ" }).click();
    await expect(page).toHaveURL(/\/kasuminomori\/?$/);
  });

  test("ルート直アクセスは basePath 配下（404 回避）", async ({ page, baseURL }) => {
    // 開発サーバ（chrome）でも out/ の配信（static）でも同じ origin の "/" を見る
    const res = await page.goto(new URL("/", baseURL).href);
    expect(res?.status()).toBe(404);
  });
});
