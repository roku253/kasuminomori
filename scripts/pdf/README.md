# 町の文書 PDF（Typst）

Chrome で HTML を印刷する方式は使わない。組版は [Typst](https://typst.app) 0.15 以降。

## 入れるもの

Windows では次で入る。

```powershell
winget install --id Typst.Typst -e
```

入れたあと、新しい端末で `typst --version` が通ることを確かめる。通らなければ、Typst の実行ファイルがあるフォルダを PATH に足す。

字体は `scripts/pdf/fonts/` だけを使う（`--ignore-system-fonts`）。

- BIZ UDP ゴシック（本文・太字）
- BIZ UDP 明朝（同梱。このテンプレートでは本文にゴシックを使っている）
- Zen Kaku Gothic New Black / Bold（見出し。OFL）

## 作る

リポジトリの `観光サイト/kasuminomori` で。

```powershell
npm run pdf:build
npm run pdf:meta
npm run check:pdf
```

1件だけなら `npm run pdf:build -- koho-r8-10`。

確認用の画像は `npm run pdf:build -- koho-r8-10 --shots D:\tmp\pdfshots`。

## 中身

- `typst/koho.typ` … 広報（表紙の写真、2列のもくじ、2段の本文）
- `typst/anzen.typ` … 地域安全通信（題字・回覧欄・2段・連絡欄）
- `typst/flow.typ` … 議会だより
- `typst/joho.typ` … 情報提供資料の1ページ（通知）
- `typst/joho-copy.typ` … 写しの下絵。紙の地の上に枠と帯と印を組む
- `joho_raster.py` … その下絵をスキャンし、帯だけ純黒に戻して2〜3ページの画像にする
- `typst/prepare.mjs` … `docs/*.mjs` を JSON にする
- `post.py` … 作中の文書情報に直し、許可した字体だけが埋まっていることを確かめる
