import { expect, test } from "@playwright/test";
import { sitePath } from "./paths";

const CATEGORIES = [
  { tab: "くらし・環境", h1: "くらし・環境", slug: "kurashi" },
  { tab: "安全・緊急", h1: "安全・緊急", slug: "anzen" },
  { tab: "福祉・健康", h1: "福祉・健康", slug: "fukushi" },
  { tab: "子ども・教育", h1: "子ども・教育", slug: "kodomo" },
  { tab: "産業・雇用", h1: "産業・雇用", slug: "sangyo" },
  { tab: "文化・スポーツ・観光", h1: "文化・スポーツ・観光", slug: "bunka" },
  { tab: "市政情報", h1: "市政情報", slug: "shisei" },
] as const;

test.describe("ヘッダー — カテゴリタブ・メガメニュー役割", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(sitePath("shisei/koho/"));
  });

  test.describe("desktop 1280", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(sitePath("shisei/koho/"));
    });

    for (const cat of CATEGORIES) {
      test(`タブ「${cat.tab}」→ ハブ ${cat.slug}`, async ({ page }) => {
        const nav = page.getByRole("navigation", { name: "主要カテゴリ" });
        await expect(nav).toBeVisible();
        await nav.getByRole("link", { name: cat.tab, exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`/kasuminomori/${cat.slug}/?$`));
        await expect(page.getByRole("heading", { level: 1, name: cat.h1 })).toBeVisible();
        const res = await page.request.get(page.url());
        expect(res.status()).toBe(200);
      });
    }

    test("現在地: 市政情報タブが aria-current", async ({ page }) => {
      const shisei = page
        .getByRole("navigation", { name: "主要カテゴリ" })
        .getByRole("link", { name: "市政情報", exact: true });
      await expect(shisei).toHaveAttribute("aria-current", "page");
    });

    test("メガメニュー: カテゴリ列は非表示・よく使うリンクのみ", async ({ page }) => {
      await page.getByRole("button", { name: "メニュー" }).click();
      const mega = page.getByRole("navigation", { name: "サイトメニュー" });
      await expect(mega.getByText("よく使うリンク")).toBeVisible();
      await expect(mega.getByText("カテゴリの案内は、画面上部のメニューから")).toBeVisible();
      await expect(mega.getByRole("heading", { name: "くらし・環境", exact: true })).toHaveCount(0);
    });
  });

  test.describe("mobile 375", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(sitePath("shisei/koho/"));
    });

    test("主要カテゴリタブは非表示", async ({ page }) => {
      await expect(page.getByRole("navigation", { name: "主要カテゴリ" })).toBeHidden();
    });

    test("メガメニュー: カテゴリ列を表示", async ({ page }) => {
      await page.getByRole("button", { name: "メニュー" }).click();
      const mega = page.getByRole("navigation", { name: "サイトメニュー" });
      await expect(mega.getByRole("heading", { name: "くらし・環境", exact: true })).toBeVisible();
      await expect(mega.getByText("カテゴリの案内は、画面上部のメニューから")).toBeHidden();
    });
  });
});

test.describe("トップ — メガメニューはフル", () => {
  test("desktop: カテゴリ列あり", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(sitePath());
    await page.getByRole("button", { name: "メニュー" }).click();
    const mega = page.getByRole("navigation", { name: "サイトメニュー" });
    await expect(mega.getByRole("heading", { name: "くらし・環境", exact: true })).toBeVisible();
  });
});
