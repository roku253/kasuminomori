# E2E（Playwright）と HTML の検査

## 配信先（project）

| project | 対象 | 起動するサーバ |
|---|---|---|
| `chrome`（既定） | 開発サーバ `http://localhost:3456/kasuminomori/` | `npm run dev`（起動中なら再利用。port は `PW_PORT`） |
| `static` | `next build` の書き出し `out/` | `node scripts/serve-out.mjs`（`http://localhost:3457/kasuminomori/`、port は `PW_STATIC_PORT`） |

```bash
npm run test:e2e            # chrome（開発サーバ）
npm run test:e2e:static     # static（out/ を配って本番相当で）。先に開発サーバを止めて npm run build
npx playwright test --project=chrome --project=static   # 両方
```

- webServer は project ごとに持てないので、`--project`（または環境変数 `PW_TARGET=static`）から起動するサーバを決めている（`playwright.config.ts`）。
- `*.static.spec.ts` は static だけで回る（TokenGate の本番挙動・全ページ巡回など、開発モードの bypass に頼れない検査）。それ以外の spec は両方で回せるように書く。
- `page.goto` は `e2e/paths.ts` の `sitePath()` を使う（`/kurashi/` のように先頭 `/` だけだと basePath が外れ 404）。origin が要るときは `baseURL` から取る（port を決め打ちしない）。
- 重なり（メニューが最前面か）は `e2e/helpers.ts` の `isOnTop()`。`toBeVisible` は「覆われて見えない」を見ない。

## out/ を手で配る

```bash
npm run serve:out           # http://localhost:3457/kasuminomori/ （--port で変更、--log で要求を表示）
```

basePath を外して out/ を返し、ディレクトリは index.html、末尾スラッシュなしは「/」付きへ 301、無いものは out/404.html を 404。
out/ が正本（`src/content/manifest.json`）より古いと注意を出す。

## HTML の検査（check-html）

```bash
npm run check:html                    # 対象は out/（正本より新しければ）か開発サーバ
node scripts/check-html.mjs --dev     # 開発サーバを対象に
node scripts/check-html.mjs --strict  # 「保留」の規則も有効にして回す（段階2のあと）
```

- 期待値は `scripts/check-html.config.json`（禁止語・件数・物語ページの相互リンク・meta の注記・title＝h1）。
- `enforce: false` の規則は「保留」として結果だけ出し、終了コードに効かない（段階2で本文が変わるもの）。段階2のあとで `enforceAll: true` にする。
- 全件の結果は `test-results/check-html.json`。

## ヘッダー・カテゴリタブ

```bash
npx playwright test e2e/header-nav.spec.ts
```

下層（`lg` 以上）では紺の帯の7分類（`主要カテゴリ`）が入口、メガメニューは「よく使うリンク」中心。モバイルではメガメニューの先頭に検索窓と全分類。
トップも下層と同じヘッダー（メニューは全分類）。

## 画面を出して見る・UI モード・コード生成

```bash
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:codegen
```

## PC / スマホの見え方記録

```bash
npm run test:e2e:viewports
```

保存先: `test-results/viewports/top-1280x800.png`, `top-375x812.png`, `top-375x812-mega-open.png`

## レポート・動画

- HTML レポート: `npm run test:e2e:report`
- 動画（要 ffmpeg・空き容量）: `PW_VIDEO=1` のうえ `npm run test:e2e` → `test-results/.../video.webm`
- 既定は動画オフ（ディスク不足対策）。失敗時スクショは常に `test-results/`

## 初回のみ

- **Google Chrome** が PC に入っていること（`channel: "chrome"`。内蔵ブラウザのダウンロードは不要）
