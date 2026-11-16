# 広報かすみのもり 紙面デザイン指示書（実装者向け）

この指示書のとおりに実装する。判断し直さない。書いていないことは変えない。コミットしない。

対象: `scripts/pdf/` 以下（パスはすべて `d:\nazotoki\観光サイト\kasuminomori\` からの相対）。

---

## 1. 決めたこと

記事ごとに見出しの形と大きさを変える。型は「帯」「リボン」「ざぶとん」「縁取り」の4種で、記事の並び順（何番目か）と kicker から自動で決める。色は濃緑・中緑・若葉・淡緑・茶・生成りの6色。ピンクと青は使わない。本文は BIZ UDPGothic 8.6pt のまま。見出しには Zen Maru Gothic、Kiwi Maru、Zen Kaku Gothic New を使う。Yomogi は決まった短い添え書き2か所だけに使う。記事は2段組みで流し込む。カレンダーは日曜始まりの月の暦にする。写真は2番目以降の記事の中に置く。紙面はすべて A4 縦。はみ出したらページを分ける。

### 採用しなかった反論
1. 「本文も Zen Maru Gothic にしてやわらかく」→ 採らない。本文は BIZ UDPGothic のまま。
2. 「あふれ防止のため見出しを全部同じ小さめの大きさに」→ 採らない。あふれたらページを分ける。
3. 「写真を少し傾けて貼り、手作り感を出す」→ 採らない。傾けない。

（採用した反論: リボンは1ページ2本まで。Yomogi は2か所だけ。全部の文字を 7.2pt 以上にする。はみ出しはビルドで止める。）

---

## 2. 色（`koho.typ` の先頭で定義。これ以外の色は足さない）

| 名前（Typst 変数） | 値 | 使う所 |
|---|---|---|
| `green-d`（濃緑） | `rgb("#2f5d34")` | 帯見出しの地、縁取りの縁、見出し文字、柱の文字 |
| `green`（中緑） | `rgb("#4f8a3c")` | 柱の線、ページ番号の丸、ざぶとんの kicker 札、土曜の日付 |
| `wakaba`（若葉） | `rgb("#9cc54a")` | 帯の左の縦線、縁取り見出しの下線、点線、目次の四角 |
| `usu`（淡緑） | `rgb("#eaf3dc")` | ざぶとんの地（奇数番目）、表の見出し行、窓口の囲み |
| `cha`（茶） | `rgb("#8a5a32")` | リボン、日曜・休みの日付、写真の縁、縁取り見出しの kicker 札 |
| `kinari`（生成り） | `rgb("#f7efdd")` | ざぶとんの地（偶数番目）、カレンダーの後半の月の地 |

- 文字の黒 `ink = rgb("#1a1a1a")`、白 `white`、範囲外の日付の灰 `luma(150)` は数に入れない。
- リボンの燕尾は `cha.darken(15%)`、折り返しは `cha.darken(35%)`。表の線は `0.3pt + green.lighten(45%)`。
- 古い `rgb("#1f8f3a")`、`rgb("#146b2c")`、`rgb("#e7f6ea")`、`rgb("#8aa88e")`、`rgb(8, 40, 18, 55%)` はすべて消す。表紙の写真に重ねる帯は `green-d.transparentize(35%)` にする。

---

## 3. 見出しの型（4種だけ）

| 型 | 名前 | 字体 | 大きさ | 形 |
|---|---|---|---|---|
| A | 帯見出し | Zen Maru Gothic black、白 | 14pt | 段の幅いっぱいの濃緑の帯（`block(width: 100%, fill: green-d, inset: (left: 3.2mm, right: 2.4mm, y: 2mm), radius: (top-right: 2.4mm), stroke: (left: 1.6mm + wakaba))`）。kicker は帯の中、見出しの上に Zen Maru Gothic bold 7.6pt の若葉で書く。 |
| B | リボン見出し | Zen Maru Gothic bold、白 | 11.5pt | 茶のリボン。両端の燕尾と折り返しは `polygon` で描く（下にコードあり）。kicker はリボンの上に Zen Maru Gothic bold 7.6pt の茶で書く。 |
| C | ざぶとん見出し | Zen Maru Gothic bold | 11pt | 角丸の色地（`block(width: 100%, radius: 2.4mm, inset: (x: 3mm, y: 2.2mm))`）。記事番号 i が奇数なら地は usu で文字は green-d、偶数なら地は kinari で文字は cha。kicker は先頭の札（`box(fill: green, radius: 1.2mm, inset: (x: 3pt, y: 1.5pt))` に白の 7.4pt bold）にする。 |
| D | 縁取り見出し | 特集ページの先頭は Kiwi Maru medium 18pt。それ以外は Zen Kaku Gothic New black 13pt | 18pt / 13pt | 白い文字に濃緑の縁（2枚重ね。下にコードあり）。下に `line(length: 100%, stroke: 1.2pt + wakaba)`。kicker は見出しの上の札（`box(fill: cha, radius: 1.2mm, inset: (x: 3pt, y: 1.5pt))` に白の 7.4pt bold）にする。 |

### 型の決め方（JSON に項目を足さない。`koho.typ` の中で計算する）

- `i` = そのページの `articles` の中で何番目か（0 始まり）。
- 「特集ページ」= `data.pages` の中で最初の `kind == "articles"` のページ。
- `RIBBON = ("行事", "募集", "文化", "講座", "図書館", "教室", "説明会", "子ども", "相談")`

上から順に見て、最初に当てはまったものにする。

1. `i == 0` で特集ページ → D（18pt、Kiwi Maru）
2. `i == 0` → A
3. kicker が RIBBON に入っていて、このページのリボンがまだ2本未満 → B
4. `i == 3` で特集ページでない → D（13pt、Zen Kaku Gothic New）
5. それ以外 → C

ページ内の型はそろって2種以上になる（記事は1ページに2本以上あり、i=0 と i=1 は必ず違う型になる）。

### 帯以外で使う部品のコード（このとおりに書く）

```typst
#let fuchi(body, font: "Zen Kaku Gothic New", weight: "black", size: 13pt, edge: 2.4pt) = block(width: 100%, {
  let t(fill, stroke) = text(font: font, weight: weight, size: size, fill: fill, stroke: stroke)[#body]
  place(top + left, t(green-d, (paint: green-d, thickness: edge, join: "round")))
  t(white, none)
})
// 特集の先頭は fuchi(a.h, font: "Kiwi Maru", weight: "medium", size: 18pt, edge: 3.2pt)
```

```typst
#let ribbon(body, size: 11.5pt) = layout(sz => {
  let inner = block(width: sz.width - 10.4mm,
    text(font: "Zen Maru Gothic", weight: "bold", size: size, fill: white)[#body])
  let h = measure(inner).height + 3mm
  block(width: sz.width, height: h + 1.2mm, {
    place(top + left, dy: 1.2mm, polygon(fill: cha.darken(15%),
      (0mm, 0mm), (4mm, 0mm), (4mm, h), (0mm, h), (1.6mm, h / 2)))
    place(top + right, dy: 1.2mm, polygon(fill: cha.darken(15%),
      (0mm, 0mm), (4mm, 0mm), (2.4mm, h / 2), (4mm, h), (0mm, h)))
    place(top + left, dx: 2.4mm, dy: h, polygon(fill: cha.darken(35%),
      (0mm, 0mm), (1.6mm, 0mm), (1.6mm, 1.2mm)))
    place(top + right, dx: -2.4mm, dy: h, polygon(fill: cha.darken(35%),
      (0mm, 0mm), (1.6mm, 0mm), (0mm, 1.2mm)))
    place(top + left, dx: 2.4mm, rect(width: sz.width - 4.8mm, height: h, fill: cha,
      inset: (x: 2.8mm, y: 1.5mm), align(horizon, inner)))
  })
})
```

- 縁取りは文字が2重に抜き出されるが、それでよい（検査は語が「ある」かどうかだけを見る）。
- `text.stroke` は D にだけ使う。ほかの型で縁取りしない。

---

## 4. カレンダー（日曜始まりの月の暦）

### データ（`_koho-load.mjs` で作る。JSON は変えない）

`replaceDates` を通す**前の** `raw` の calendar ページの `rows` から作る。

1. 各行の `row[0]` を `/^\{\{d:(\d{4})-(\d{2})-(\d{2})\}\}$/` で読む。合わなければ `throw new Error(\`カレンダーの日付が読めません: ${id} ${row[0]}\`)`。
2. 予定の文字は `replaceDates(row[1])` とし、`"／"` で分けて別の予定にする（言葉は変えない）。
3. ISO 日付ごとにまとめる。同じ日の予定は JSON の順のまま並べる。日付の順は ISO で並べ直す（JSON の行の順は変えない）。
4. 最初の日 `first` と最後の日 `last` を決める。`start` は `first` を含む週の日曜、`end` は `last` を含む週の土曜にする。曜日は `new Date(Date.UTC(y, m - 1, d)).getUTCDay()` で求める（0 が日曜）。
5. `start` から `end` まで1日ずつ進め、7日ごとに1週にして `weeks` を作る。各日は次の形にする:
   `{ iso, m, d, dow, holiday: isHoliday(iso), inRange: first <= iso && iso <= last, events: [...] }`
   `isHoliday` は `../lib/dates.mjs` から import する。
6. 返す calendar ページは `{ ...replacedPage, weeks }` とする。`rows` は残す。`prepareKoho` はページをそのまま渡すので、手を入れない。

### 組み方（`koho.typ` の calendar の分岐）

- 一番上に型 A の帯（全幅）で「くらしのカレンダー」と書き、帯の中の kicker の位置には「広報情報係」と書く。帯の下に Yomogi 11pt の茶で「#m1 月・#m2 月の予定」と書く。m1 は最初の週の範囲内の月、m2 は最後の範囲内の月。同じ月なら「#m1 月の予定」と書く。
- `grid(columns: (1fr,) * 7, stroke: 0.4pt + green.lighten(45%))` で組む。
- 1行目は曜日（日 月 火 水 木 金 土）。地は日曜だけ cha、ほかは green-d。文字は白の 8pt bold。
- 日のマスは `block(width: 100%, height: H, inset: 1.5mm)` にする。週が5以下なら H = 36mm、6なら 31mm。
- 日付の数字は Zen Maru Gothic black 12pt。`dow == 0` か `holiday` か、その日の予定に「役場は休み」を含むものがあれば cha。`dow == 6` なら green。ほかは ink。`inRange` でない日は luma(150) にし、予定は書かない。
- 範囲の最初の日と、各月の1日は数字を「m/d」の形にする（例「6/1」）。
- マスの地は、`m` が最初の月と同じなら白、違えば kinari。
- 予定は BIZ UDPGothic 7.4pt で1件1行、行頭に若葉の小さな四角（`box(width: 1.4mm, height: 1.4mm, fill: wakaba)`）を置く。予定名は省略しない。
- 暦の下に今の `#data.holiday　表の日は、この号で案内している日です。` を 8pt で残す。「表の日」は「暦の日」に変える。
- 古い2列の `table(columns: (1fr, 2fr) ...)` は消す。

---

## 5. 写真

- 表紙の大きな写真はそのまま残す（大きさも位置も変えない）。
- 記事ページの写真（`pg.photo`）は、そのページの記事の中に置く。置く記事は `i >= 1` のうち `table == none` かつ `figure == none` の最初の記事。なければ `i = 1` にする。先頭（i = 0）の記事には置かない。
- 置き方は今の `article-block` と同じ（1段落目のあと、2〜3段落目の右に `grid(columns: (1fr, photo-w))`）。`photo-w` は 36mm、高さは 28mm。ページの幅いっぱいにしない。段の幅を超えない。
- 枠は `box(fill: white, stroke: 0.5pt + cha, inset: 1.2mm, radius: 0.8mm)` で、中に `image(..., fit: "cover")` を入れる。傾けない。
- 写真の説明は Zen Maru Gothic regular 7.2pt の cha。JSON の `photoCaption` をそのまま書く（すでに「写真　」で始まっている）。

---

## 6. 変えるファイル / 触ってはいけないこと

### 変えるファイル（これだけ）
- `scripts/pdf/fonts/zenmarugothic/`（新しく作る）: `ZenMaruGothic-Regular.ttf`、`ZenMaruGothic-Bold.ttf`、`ZenMaruGothic-Black.ttf`、`OFL.txt`
- `scripts/pdf/fonts/kiwimaru/`（新しく作る）: `KiwiMaru-Medium.ttf`、`OFL.txt`
- `scripts/pdf/fonts/yomogi/`（新しく作る）: `Yomogi-Regular.ttf`、`OFL.txt`
- `scripts/pdf/lib/html.mjs`: `FONT_NAME_PATTERN` の1行だけ
- `scripts/pdf/post.py`: フォントのエラー文言、冒頭の説明、縦だけの検査
- `scripts/pdf/build.mjs`: `runPost` に渡す spec に `portraitOnly` を1つ足すだけ
- `scripts/pdf/docs/_koho-load.mjs`: カレンダーの `weeks`、禁止語、人口の検査、予算の合計の検査、`portraitOnly`
- `scripts/pdf/typst/koho.typ`: 紙面
- `scripts/pdf/docs/_koho-body.json`: `"paper": "a4-landscape"` を `"a4"` にすること、あふれたときにページを分けること、`toc` のページ番号を直すことだけ
- 出力物（`public/pdf/koho-r8-*.pdf`）は再ビルドで変わってよい

### 触ってはいけないこと
- 本文・見出し・表・図・kicker・toi・caption の文字。日付、金額、課名、学校名（第一小学校 / 箕浦中学校 / 箕浦高等学校）、人口（5,812 人 / 2,431 世帯は10月号だけ）を変えない。予算の内訳の合計は 46.8 億円のまま。
- 次の語を足さない: フィクション、架空、謎解き、市政、児童、事故、立入禁止、絵画展、年生、渡辺、佐藤、さとう、青木、大野、川村、藤原、神隠し、町長の孫、河川敷清掃、町立霞ノ杜小学校。個人名を新しく足さない。メールアドレス、実在の郵便番号、`lg.jp` を書かない。QR コードを作らない。
- 文章を表に写して水増ししない。本文を削ってページに収めない。
- `prepare.mjs`、`lib/dates.mjs`、`lib/town.mjs`、`scripts/hazard/` 以下、ほかの文書のテンプレート（`flow.typ`、`anzen.typ`、`joho*.typ`）、`html.mjs` の `FONTS` 配列。
- システムフォント、BIZ UDP明朝を広報で使わない。横向きのページを作らない。スキャン画像にしない。
- git commit / push をしない。

---

## 7. 実装手順

1. **フォントを置く。** PowerShell で次の8ファイルを `https://raw.githubusercontent.com/google/fonts/main/ofl/<家族>/<ファイル>` から `scripts/pdf/fonts/<家族>/` に落とす: `zenmarugothic/ZenMaruGothic-Regular.ttf`、`zenmarugothic/ZenMaruGothic-Bold.ttf`、`zenmarugothic/ZenMaruGothic-Black.ttf`、`zenmarugothic/OFL.txt`、`kiwimaru/KiwiMaru-Medium.ttf`、`kiwimaru/OFL.txt`、`yomogi/Yomogi-Regular.ttf`、`yomogi/OFL.txt`（すべて静的 TTF。8ファイルとも存在を確認ずみ）。落としたあと `python -c "import fitz;[print(p, fitz.Font(fontfile=p).name) for p in __import__('sys').argv[1:]]" <ttf...>` で PostScript 名を出し、`ZenMaruGothic-Regular / -Bold / -Black`、`KiwiMaru-Medium`、`Yomogi-Regular` になっていることを確かめる。違う名前なら、次の手順の正規表現をその名前に合わせる。
2. **`lib/html.mjs` の `FONT_NAME_PATTERN`** を次にする:
   `"^(?:[A-Z]{6}\\+)?(?:BIZUDP(?:Gothic|Mincho)-(?:Regular|Bold)|ZenKakuGothicNew-(?:Bold|Black)|ZenMaruGothic-(?:Regular|Bold|Black)|KiwiMaru-Medium|Yomogi-Regular)$"`
3. **`post.py`**:
   - 103行目の文言を `（許可は BIZ UDP・Zen Kaku Gothic New・Zen Maru Gothic・Kiwi Maru・Yomogi。字形が無く代わりのフォントで描かれた字がある）` にする。
   - 冒頭の説明の「全ページ A4 縦、フォントがすべて埋め込みで OFL の BIZ UDP だけ」を「全ページ A4（portraitOnly なら縦だけ）、フォントがすべて埋め込みで scripts/pdf/fonts の OFL フォントだけ」にする。
   - `finalize` の A4 の判定の直後に `if spec.get("portraitOnly") and not portrait: problems.append(f"p{i}: A4 縦でない（{w:.2f}×{h:.2f}pt）")` を足す。
4. **`build.mjs` の `buildOne`**: `runPost` に渡す spec に `portraitOnly: !!c.portraitOnly,` を `textlessPages` の行の下に足す。ほかは変えない。
5. **`_koho-load.mjs`**:
   - `ban` に `"謎解き", "市政", "藤原", "河川敷清掃", "町立霞ノ杜小学校", "lg.jp", "@"` を足す。
   - `issue()` の `checks` に `portraitOnly: true` を足す。
   - `id !== "koho-r8-10"` のとき `mustNotContain` に `"5,812", "2,431"` を足す。`id === "koho-r8-10"` のときは `mustContain` に `{ text: "5,812" }` と `{ text: "2,431" }` を足す。
   - 予算の検査: `row.pages` の中に `figure.type === "bars"` かつ `figure.unit === "億円"` の記事があれば、`items` の value の合計を小数第1位で丸め、46.8 でなければ `throw new Error("予算の内訳の合計が 46.8 億円になりません")`。
   - 4章のとおり calendar ページに `weeks` を付ける（raw の行から作り、`replaceDates` したページに付ける）。
6. **`_koho-body.json`**: `"paper": "a4-landscape"` の5か所（05号の2ページ、06号の3ページ、07号の2ページ、08号の2ページ、09号の2ページ）を `"paper": "a4"` にする。ほかは手順10まで触らない。
7. **`koho.typ` の土台**:
   - 2章の色の定義に置きかえる。`table-stroke` を `0.3pt + green.lighten(45%)`、`table-fill` を `usu` にする。
   - `render-steps` の本文の 8.2pt を 8.6pt にする。`render-bars` の 7pt を 7.2pt にする。`photo-aside` の説明の 6.4pt を 7.2pt にする。ほかに 7.2pt 未満の文字があれば 7.2pt にする（ページ番号も含む）。
   - `runbar` は文字を green-d、線を `0.7mm + green` にする。その下に `v(0.5mm)` と `line(length: 100%, stroke: 0.3mm + wakaba)` を足す。`dot-row` の点は wakaba、`toc-item` の四角は wakaba、`page-footer` の丸は green にする。
8. **`koho.typ` の見出し**: 3章の `fuchi` と `ribbon` を足す。`head-a(a)`、`head-b(a)`、`head-c(a, i)`、`head-d(a, big)` を3章の表のとおりに作る。`head-type(i, kicker, feature, ribbons)` は3章の5つの規則を上から順に見て `"A" / "B" / "C" / "D"` を返す。
9. **`koho.typ` の記事**:
   - `article-block(a, i: 0, type: "C", feature: false, show-head: true, photo: none, caption: "")` にする。古い右寄せの kicker の箱と `text(font: "Zen Kaku Gothic New" ...)[#a.h]` の行は消し、`show-head` が true なら type に応じた head 関数を呼ぶ。本文・リスト・表・図・問の並びと中身はそのまま。記事ごとに `block(breakable: false, below: 3.2mm)` で包む。
   - `articles-grid` は `articles-flow(articles, feature: false, photo: none, caption: "")` に置きかえる。中で `types` を `for` で作る（リボンの数を数える）。写真を置く記事の番号は5章の規則で決める。`feature` のときは、先頭の記事の見出しだけを `head-d(articles.at(0), true)` で段の外（全幅）に描き、その記事の本文（`show-head: false`）から段組みに入れる。段組みは `columns(2, gutter: 5.5mm)[...]` にし、記事を上から順に流す。
   - 古い grid の `compact` は消してよい。段落の間隔は今の compact の値（`spacing: 0.48em, leading: 0.58em`）を全記事に使う。本文の大きさは 8.6pt のまま。
   - ページの分岐: `a4-landscape` の分岐は消し、その場所に `pg.kind == "articles" and pg.paper != "a4"` なら `panic("横のページは作らない: " + data.id)` を置く。`articles` のページは `#dot-row` と `articles-flow(...)` を描く。外側の `block(breakable: false)` は外す（はみ出しを次のページへ出して検出するため）。
   - ループを `for (pi, pg) in data.pages.enumerate()` にし、最初の articles ページの番号を `let feat = data.pages.position(p => p.kind == "articles")` で求める。
   - 各ページの中身の最後（cover 以外）に次を置く:
     `#context if here().page() != pi + 1 { panic("紙面あふれ: " + data.id + " の " + str(pi + 1) + " ページ目") }`
10. **はみ出しを直す。** `npm run pdf:build -- koho-r8-05`（号ごと）で「紙面あふれ」が出たら、`_koho-body.json` のそのページの `articles` を前半 `ceil(n / 2)` 本と残りに分け、残りを `{ "kind": "articles", "paper": "a4", "articles": [...] }` としてすぐ後ろに入れる。`photo` と `photoCaption` は元のページに残す。記事の順と中身は変えない。そのあと、その号の `toc` で、入れたページ以降の番号（文字列）を1つずつ増やす。分けたページがまたあふれたら、同じ手順をもう一度行う。文字や行間を縮めて収めない。
11. **カレンダー**: 4章のとおりに `calendar` の分岐を書き直す。
12. **表紙**: 写真の位置と大きさは変えない。「Contents」を Yomogi 10pt の cha で「もくじ」にする。号の丸は green-d の地にする。写真に重ねる帯の地を `green-d.transparentize(35%)` にし、特集名（`data.feature`）は Kiwi Maru medium 22pt の白、`data.mark` は Zen Maru Gothic bold 11pt の白にする。表紙の題字（広報 かすみのもり）は Zen Kaku Gothic New black 28pt のままにする。
13. **裏表紙**: 見出し「お知らせ」「課の電話」を型 C（i = 1 として淡緑の地）にする。窓口の囲みは `fill: usu, radius: 2.4mm` にする。ほかは変えない。
14. **確かめる。** `npm run pdf:build -- koho-r8-05 koho-r8-06 koho-r8-07 koho-r8-08 koho-r8-09 koho-r8-10 --shots .cache/shots` を実行し、PNG を見て8章を確かめる。そのあと `npm run pdf:build`（全文書）も通す。続けて `npm run pdf:meta` と `npm run check:pdf` を実行する。コミットはしない。

---

## 8. 完了条件（すべて満たすこと）

- `npm run pdf:build` が広報6号（koho-r8-05〜10）とも ✗ なしで終わる。全文書でも止まらない。
- post.py の検査で、全ページが A4 縦（portraitOnly）。横のページが1枚もない。ページ数は JSON の `pages` の長さと同じ。
- 禁止語が1つもない（post.py が止めない）。人口 5,812 / 2,431 は10月号だけにある。予算の内訳の合計は 46.8。
- 埋め込まれたフォントが `FONT_NAME_PATTERN` だけで、システムフォントがない。
- 記事のどのページでも、見出しの型が2種以上ある（shots で目で見る）。リボンは1ページ2本まで。
- カレンダーが日曜始まりの7列の暦で、予定がその日のマスに載っている。古い2列の表がない。
- 記事ページの写真が段の中（2番目以降の記事）にあり、ページの幅いっぱいの帯になっていない。表紙の大きな写真は残っている。
- 本文 8.6pt 以上、表 7.2pt 以上、そのほかの文字もすべて 7.2pt 以上。
- 本文・見出し・表の文字が元の JSON と同じ（変えたのは paper、ページの分け方、toc の番号だけ）。
- コミットしていない。
