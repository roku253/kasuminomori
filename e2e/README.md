# E2E（Playwright）

## 画面を出して見る（PC にブラウザがポップアップ）

```bash
npm run test:e2e:headed
```

## UI モード（ステップ実行・タイムライン再生）

```bash
npm run test:e2e:ui
```

## 操作を録画してコード生成

```bash
npm run test:e2e:codegen
```

## ヘッダー・カテゴリタブ

```bash
npx playwright test e2e/header-nav.spec.ts
```

内页（`lg` 以上）では画面上部の7タブがカテゴリ入口、メガメニューは「よく使うリンク」中心。モバイルではメガメニューに全カテゴリ。

開発 URL は必ず `http://localhost:3000/kasuminomori/`（`basePath` 付き）。`/kurashi/` だけだと 404 になります。

## PC / スマホの見え方記録

```bash
npm run test:e2e:viewports
```

保存先: `test-results/viewports/top-1280x800.png`, `top-375x812.png`, `top-375x812-mega-open.png`

## レポート・動画

- HTML レポート: `npm run test:e2e:report`
- 動画（要 ffmpeg・空き容量）: `set PW_VIDEO=1` のうえ `npm run test:e2e` → `test-results/.../video.webm`
- 既定は動画オフ（ディスク不足対策）。失敗時スクショは常に `test-results/`

`page.goto` は `e2e/paths.ts` の `sitePath()` を使うこと（`/kurashi/` のように先頭 `/` だけだと `basePath` が外れ 404 になる）。

`npm run dev` は Playwright が自動起動します（既に dev 中なら再利用）。

## 初回のみ

- **Google Chrome** が PC に入っていること（内蔵ブラウザのダウンロードは不要）
- ディスク不足時は `npx playwright install chromium` は失敗します（本設定は Chrome 利用）

## 動画の場所

テスト後: `test-results/<フォルダ名>/video.webm` を VLC 等で再生。

<!-- automation check -->