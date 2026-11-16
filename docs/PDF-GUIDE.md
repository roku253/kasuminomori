# 町の文書 PDF 作成ガイド（霞ノ杜町）

このガイドは、霞ノ杜町ホームページに置く「町の文書」の PDF（広報紙・議会だより・回覧の通信・情報公開の写し・ハザードマップなど）を、**実在の自治体が出した文書に見える品質**で作るための手順書です。AI（Cursor など）が上から順に実行すれば同じ品質に届くよう、数値・コード・チェックリストで書いています。

- お手本は **地域安全通信 第112号**（`public/pdf/anzen-r1-09.pdf`、データ `scripts/pdf/docs/anzen-r1-09.mjs`、組版 `scripts/pdf/templates/anzen.mjs`＋`styles/anzen.css`）。迷ったら 112号と同じにする。
- 置き場所: リポの `docs/PDF-GUIDE.md` と `D:\謎解き\観光サイト改修資料\PDF作成ガイド.md`（同じ内容）。
- 個別文書の直し方は `D:\謎解き\観光サイト改修資料\検証\PDF品質診断.md`。

目次
1. 全体の流れとコマンド
2. 品質の原則（実在の自治体文書らしさ）
3. お手本: 地域安全通信 第112号の解剖
4. 新しい文書を作る手順（チェックリスト）
5. 合格基準（自動検査・目視）
6. よくある失敗と対処
7. 文書種別ごとの型（推奨ページ構成）
8. 付録（コード断片・検査スクリプト・写真の台帳）

---

## 1. 全体の流れとコマンド

### 1-1. ファイルの構成

```
scripts/pdf/
  build.mjs            入口。docs/*.mjs（先頭が _ のファイルは除く）を1件ずつ PDF にする
  post.py              後処理と検査（finalize）・写しのスキャン風加工（scan）
  meta.py              public/pdf/*.pdf → src/generated/pdf-meta.json（容量・sha256・ページ数・Title）
  lib/html.mjs         h`` タグ付きテンプレート、t()（**太字** と改行）、documentHtml()、@font-face、css()、publicFile()
  lib/blocks.mjs       本文ブロックの小さな記法（段落・箇条・表・囲み・注・問）→ HTML
  lib/dates.mjs        和暦・曜日（md, mdRange, mdSeq, full, officeDay …）。曜日は必ずここで出す
  lib/town.mjs         住所・電話・FAX（src/lib/site.ts と照合）、組織（organization.json）→ unit(), telNo()
  lib/layout-check.mjs ブラウザ内の組版検査（はみ出し・区画の外・6mm 安全域・画像/フォントの読み込み）
  styles/base.css      全文書共通（@page A4、.page 210×297mm、本文の既定、問、ノンブル）
  styles/<種別>.css    文書種別ごとの CSS（anzen.css がお手本）
  templates/<種別>.mjs 組版（データ → ページの HTML の配列）
  docs/<id>.mjs        文書のデータ（1文書1ファイル。id はファイル名＝ PDF 名から .pdf を除いたもの）
  fonts/               OFL 版 BIZ UDPゴシック（Regular・Bold）・BIZ UDP明朝（Regular のみ）＋ OFL.txt
  .cache/              中間物（html/ raw/ raster/ spec/ shots/）。コミットしない
scripts/hazard/        ハザードマップ専用（地図描画。pdf_post.py の finalize_pdf を scripts/pdf/post.py も共有）
scripts/check-pdf.mjs  build（CI）で走る検査（public/pdf と pdf-meta.json の一致・登録漏れ）
```

### 1-2. 1文書の流れ

```
docs/<id>.mjs（データ：原稿・日付・発行者・checks）
   │ import
templates/<template>.mjs の render(doc) → { styles, pages:[<section class="page">…] }
   │ lib/html.mjs documentHtml()（@font-face と CSS を中に入れた1枚の HTML）
.cache/html/<id>.html
   │ Playwright（channel:"chrome" = この PC の Chrome）で開く。media=print、フォントと画像の読み込みを待つ
   │ lib/layout-check.mjs（はみ出し・区画外・6mm・ページ数・読み込み失敗）→ 1件でもあれば止まる
   │ page.pdf({ preferCSSPageSize, printBackground, tagged, outline, margin:0 })
.cache/raw/<id>.pdf
   │ post.py finalize（scripts/hazard/pdf_post.py の finalize_pdf を共有）
   │   - Info と XMP を作中の値に（Title・Author・Subject・Keywords・作成日）。Creator・Producer を消す
   │   - 検査: ページ数・A4・フォント（BIZ UDP だけ・埋め込み）・mustContain・mustNotContain・仮の文字・
   │           文字の無いページ・容量 5MB・メタに事件の語が無い・トレーラーに /Prev が無い
public/pdf/<id>.pdf
   │ npm run pdf:meta（meta.py）
src/generated/pdf-meta.json
   │ npm run check:pdf（Node だけ。容量・sha256・登録漏れ）
   └ 追加: python scripts/pdf/qa.py public/pdf/<id>.pdf（密度・重複・曜日・写真の使い回し。§5・§8-1）
```

部分開示の写しのように「文字を残してはいけないページ」は、テンプレートの `raster(doc)` で先にページを 240dpi の画像にし（`post.py scan` で紙の地色・傾き・ゴミを足す）、本体ではその画像を1ページ1枚で貼る（`templates/joho.mjs`）。

### 1-3. コマンド

```powershell
# 1件だけ作り、確認用の画像（各ページ 110dpi の PNG）も出す
npm run pdf:build -- anzen-r1-09 --shots D:\tmp\pdfshots
# 全件
npm run pdf:build
# メタの表を更新し、CI と同じ検査
npm run pdf:meta
npm run check:pdf
# 品質検査（§8-1 の qa.py を置いてから）
python scripts/pdf/qa.py public/pdf/anzen-r1-09.pdf
```

- 必要なもの: Node（playwright は依存に入っている）、この PC の Chrome、Python 3（PyMuPDF・pypdf・Pillow）。
- 確認用画像は `--shots <dir>/<id>/p1.png …` に出る。**作ったら必ず全ページを画像で見る**（§5-2）。
- PDF・pdf-meta.json はコミットする生成物。`.cache/` はコミットしない。

---

## 2. 品質の原則（実在の自治体文書らしさ）

「本物らしさ」は、(1) 紙面が埋まっている、(2) 実物の型（題字・回覧欄・柱・ノンブル・奥付・問）がある、(3) 中身が具体的（数字・日付・場所・担当）、(4) 文体が役所の文、の4つで決まる。どれか1つが欠けると「AI が作った見本」に見える。

### 2-1. 判型と版面

| 項目 | 値 |
|---|---|
| 判型 | A4 縦 210×297mm（`@page { size:210mm 297mm; margin:0 }`、1ページ＝`<section class="page">`）。ハザードマップだけ A3 横（scripts/hazard） |
| 版面（文字を置く区画） | `.sheet { position:absolute; left:12mm; right:12mm; top:10mm; bottom:15mm }`（＝186×272mm）。広報・議会だよりは左右 11〜12mm、上 9〜10mm、下 12〜15mm |
| 安全域 | 文字は紙の縁から 6mm より内側（layout-check が止める）。裁ち落としの写真・色帯は `.bleed` を付ける |
| ノンブル | 2ページ目以降、下の外側（奇数ページ右・偶数ページ左）。`bottom:8mm`、9pt 太字。表紙には付けない（広報は表紙にも付けてよい） |
| 柱 | 2ページ目以降の上端に「誌名・号・（コーナー名）」と発行日。8pt、下に 0.4mm の罫（色はアクセント） |

### 2-2. 段組

- 本文ページは **2段**（段間 5.5〜6mm）が基本。広報のお知らせ欄・議会日誌のように短い記事が多いページは **3段**（段間 4.5〜5mm）。
- 1段（全幅）を使ってよいのは、表紙・公文書の写し・幅の広い表・見開きの特集見出しだけ。**全幅の地の文が 3行を超えたら段組にする**（1行 50字を超える行は読みにくく、素人の組版に見える）。
- 1ページの中で段組を切り替えてリズムを作る（112号 p.1: 2段〔本文＋図〕→ 全幅の記事＋表 → 2段の小記事）。
- 段組は CSS grid（`grid-template-columns:1fr 1fr`）で記事を左右に割り振るのが既定。長い本文を流すときだけ `column-count`（溢れると右へ段が増え、layout-check が scrollWidth で止める）。

### 2-3. 実物の型（部品）

| 部品 | 中身 | どの文書に要るか |
|---|---|---|
| 題字 | 誌名（大）・キャッチ（小）・通巻号数・○月号・発行日 | 全部（公文書の写しを除く） |
| 回覧欄 | 「回覧」＋確認印の枠（区長・組長・各戸）＋「見たら印を押して次へ」 | 回覧の通信 |
| 発行・協力の行 | 「発行 ○○課○○係・○○協会　協力 ○○駐在所」 | 通信・広報の表紙 |
| 柱・ノンブル | §2-1 | 2ページ以上の文書 |
| 記事末の「問」 | 黒地白抜きの「問」＋「課 係　0266-12-2111（内線 nnn）」 | 記事ごと（同じ係が続くときも記事ごとに1つ。1記事に2つは置かない） |
| 緊急・窓口の欄 | 110番・119番、担当の課の階・内線・FAX | 通信の最終ページ、広報の裏表紙 |
| 奥付 | 誌名・号・発行日・編集発行（課・係）・〒住所（役場内）・電話（代表）・FAX・印刷所（架空の社名）・「再生紙を使用しています」 | 最終ページの下 |
| 回覧の結び | 「回覧が終わりましたら、次の方へお回しください。」 | 回覧の通信 |

**メタな文を紙面に書かない**: 「この号の読み方」「訂正は次の号に出します」「電子版は直近6か月分」「記事の『問』の内線を…」のような、紙面の作り方を説明する文は実物の広報にはほぼ無い。書くなら奥付の1行に留める。

### 2-4. 情報密度（字数の予算）

紙面の白さが最大の「偽物らしさ」になる。ページを作る前に、ページごとの字数予算を決める（§4 の手順2）。

| ページの種類 | 文字数（抽出で数えた字数） | 図・写真・表 | 空白の帯（縦に連続する白） |
|---|---|---|---|
| 回覧の通信（112号） | p.1 約1,100字＋図1・表1、p.2 約1,350字＋表2 | 1ページに図か表を1つ以上 | 10mm 以下（最終ページの奥付の下も 15mm 以下） |
| 広報の本文ページ（2〜3段） | 1,400〜2,200字 | 写真か図表を1〜3 | 15mm 以下 |
| 広報のお知らせページ（3段） | 1,800〜2,600字 | 小さなカット・表 | 10mm 以下 |
| 議会だよりの一般質問 | 1議員 1/2〜1ページ、1ページ 1,300〜2,000字 | 質問者の囲み、答弁の囲み | 15mm 以下 |
| 公文書の写し（1段） | 1ページ 500〜900字相当（帯を含む） | ― | 最終ページの「以上」の下だけ空いてよい |
| 表紙 | 300〜700字 | 大きな写真1＋目次 | 写真と目次で埋める |

- 1つの記事は「見出し＋リード（1〜2文）＋本文（2〜4段落）＋要項（日時・場所・対象・費用・申込）＋問」。**見出しの下に 1〜2文しか無い記事を並べない**。
- 字数が足りないときは、同じ内容を表や箇条に言い直して水増し**しない**（§6）。別の日常記事を足す（§2-9）。
- 記事が多すぎてはみ出すときは、記事を次のページへ送るか、写真を小さくする。字を 8pt 未満にして詰めない。

### 2-5. 見出しの階層

1ページで使う大きさは、本文を含めて 4〜5段階まで。112号の値を基準にする。

| 階層 | 大きさ | 書体・装飾 | HTML |
|---|---|---|---|
| 題字 | 28〜34pt | ゴシック太字・字間 0.12〜0.14em、色帯に白抜き（広報・議会だよりは明朝 Regular 可） | `h1` |
| トップ／特集の見出し | 15〜20pt | 太字、左に 2.2mm の色の罫＋淡い地色 | `h2` |
| 記事見出し | 11.5〜13.5pt | 同上（小さい記事は 11.6pt・罫 1.8mm） | `h2` |
| 小見出し・要項の見出し | 10pt 太字 | 罫なし（`art-sub`、`box-title`） | `p`（`h3` にしない） |
| 本文 | 9〜9.5pt、行送り 1.6 | ゴシック Regular、両端揃え | `p` |
| リード | 10〜10.2pt、行送り 1.7 | | `p.lead` |
| 表・注・キャプション | 7.6〜8.6pt | 注は「※」、キャプションは「図」「写真」で始める | |
| 奥付 | 7.4pt | | |

- 見出しの前に**種別ラベル（kicker）**を付けると実物らしくなる: 「特殊詐欺」「注意」「駐在所から」「募集」「税金」「健康」など（黒地白抜き 8.4pt）。
- `h1`〜`h6` は Chrome が**しおり（アウトライン）**にする。記事見出しだけに使い、「5月」「今号の内容」「書誌」のような飾りの見出しは `p` か `div` にする。

### 2-6. 書体と字間

- フォントは `"KN Gothic"`（BIZ UDPゴシック Regular/Bold）と `"KN Mincho"`（BIZ UDP明朝 **Regular のみ**）。それ以外は使わない（post.py が埋め込み名で止める）。
- 明朝に `font-weight:700` をかけない（合成の太字になり字形が崩れる）。強調は `strong`（base.css でゴシック太字になる）。
- 本文は `text-align:justify`、`line-break:strict`（base.css）。行頭に「、」「。」「）」が来ないことを画像で確かめる。
- 数字は半角、括弧・「〜」・「・」は全角。日付は「9月21日（土）」、期間は「9月21日（土）〜30日（月）」（`mdRange`）。時刻は「7時15分」か「7:15」のどちらかに文書内で統一。
- 電話番号・日付・「（内線 215）」の途中で改行させない（`white-space:nowrap` の `span`）。「問」の行が折り返すときは、課係名を短くするか段幅を広げる。
- 字間: 題字 0.12〜0.3em、見出し 0〜0.05em、本文 0。本文に letter-spacing を付けない。
- 記号: ☎・絵文字・丸囲みの 21 以上・環境依存の単位記号（㎡ など）は BIZ UDP に無いことがある。使わず「電話」「平方メートル」と書く（無い字は別のフォントで描かれ、post.py が止める）。

### 2-7. 図表

- 図は **SVG を HTML に直接書く**（112号の立入禁止区域の図）。縮尺が正確でない略図には「縮尺は正確ではありません」とキャプションに書く。方位記号・凡例・地名（町の正本の地名だけ）を入れる。
- SVG の文字に縁取り（`stroke`・`paint-order`）、`text-shadow`、`filter` を付けない。Chrome が **Type3 フォント**にする。読みやすくしたいときは文字の下に白い四角（`<rect fill="#fff" fill-opacity="0.92">`）を敷く。
- 円グラフ・棒グラフは SVG で描く（`conic-gradient` は画像化されて縁がギザギザになる）。数値（金額と％）をラベルで添え、合計が 100％になることを確かめる。
- 表は「表でしか表せないもの」（日程・件数の比較・議決結果・時刻表）にだけ使う。**文で書いたことを 2列の表に言い直さない**（「対象｜案内が届いた方」のような表は水増しに見える）。
- 表の罫は 0.25〜0.3mm、見出し行は淡い地色、数値は右寄せ（`td.r`）、行の高さはそろえる。表題は `caption` に「町内の交通事故（1月〜7月）」のように書く。
- 色は「墨＋1色」を基本にする（回覧は白黒で複写されても読めること）。広報は表紙と特集だけ色数を増やしてよい。

### 2-8. 写真

- 使える写真は `public/img/photos/` の 11枚だけ（§8-4 の台帳）。**キャプションには写っているものを書く**。写っていないもの（「稲刈りのあとの田」に霧の杉林）を書かない。
- 横長の帯に切り抜くときは、写したいものが残るよう `object-position` を指定する（例: 棚田が下にある photo-terraces は `object-position: 50% 85%`）。
- 1文書の中で同じ写真を2回使わない（表紙と2ページ目の重複も不可）。広報の表紙は**6か月以内の号で同じ写真を使わない**。合う写真が無いときは写真を使わず、図・表・地図・イラスト（SVG）で組む。
- 人物は後ろ姿か遠景。児童の顔と名札は写さない。物語の写真（photo-1978、photo-mural など）を日常記事に使わない。
- 画像は長辺 1600px・JPEG 品質 75 前後。1文書 5MB 以内（post.py が止める）。

### 2-9. 日常記事の混ぜ方

- 物語の手がかりは**1文書に1か所、日常記事の中に埋める**。手がかりの記事だけ大きくしたり、色を変えたり、他より長くしたりしない（112号は手がかりの1文をトップ記事の2段落目に置き、周りを交通安全・詐欺・クマ・防犯灯で囲んでいる）。
- 日常記事は「その月に本当に役場が知らせること」から選ぶ。素材の正本:
  - 組織・内線: `src/content/data/organization.json`（`unit()`・`telNo()` で引く）
  - 町営バス: `src/content/data/bus.json`、ごみ: `gomi.json`、施設: `facilities.json`、手続き: `procedures.json`
  - 地名: ハザードマップの `scripts/hazard/config.json` の towns（三日月中央・三日月北・成沢・狐塚・木戸・西木戸・駅前・大萩・箕浦・柳川・筒川・湖畔・大字杜ケ丘／4地区）
  - 祝日: `src/lib/date-ja.mjs` の HOLIDAYS（＋ `scripts/pdf/lib/dates.mjs` の補い）
- 月ごとの定番（日本の市町村の広報で毎年出るもの）: 4月 組織・予算・交通安全運動／5月 軽自動車税・クマ・山菜／6月 住民税の通知・梅雨・国保／7月 国保税・熱中症・夏の地域安全運動／8月 お盆の窓口・花火・職員募集／9月 敬老・防災・秋の交通安全運動（9/21〜30）／10月 健診・予防接種・文化祭・住民税第3期／11月 秋の火災予防運動（11/9〜15）・年末調整／12月 年末年始の窓口とごみ・歳末警戒。
- 1記事に必ず具体を3つ以上: 数字（件数・人数・金額）、日付と曜日、場所（地区名・施設名）、時刻、担当。
- 文体: です・ます。「〜してください」「〜をお持ちください」「〜までにお申し込みください」。体言止めの箇条を3つ以上続けない。1文 30〜60字。**同じ文を1文書に2回書かない**（表紙の目次の要約も、本文の写しではなく別の言い方にする）。
- 個人名: 児童の氏名は書かない。物語の姓（渡辺・佐藤・青木・大野・川村）と藤原は議員・職員・投稿者に使わない（build.mjs の ALWAYS_FORBIDDEN が止める）。2019年の文書では町長を肩書きだけで書く。広報は個人名を置かない。

### 2-10. 曜日・和暦

- 曜日は**手で書かない**。`md("2019-09-03")` →「9月3日（火）」、`mdRange(a,b)`、`mdSeq(a,b)`、`full(iso)` →「令和元年11月1日（金）」を使う（`lib/dates.mjs`）。データの文字列にも `${md(...)}` で埋め込む。
- 発行日・会議の日・開示決定日など役所が動く日は `officeDay(iso, "ラベル")` で包む（土日・祝日・年末年始なら build が止まる）。祝日表の無い年は `lib/dates.mjs` の HOLIDAYS に足す。
- 和暦: 2019年5月1日以降は「令和元年」（「令和1年」と書かない）。4月30日までは「平成31年」。年度は「平成30年度」「令和元年度」。
- 納期限が土日祝に当たるときは「翌開庁日」（例: 2026-05-31（日）→ 6月1日（月））。
- 広報の発行日は「毎月10日」なら土日でもその日付でよい（officeDay は使わない）。

### 2-11. メタデータとしおり

- `meta.title` は正式名＋号（「地域安全通信 第112号（令和元年9月号）」）、`author` は発行者（課・係まで）、`subject` は主な内容を「／」でつないだもの、`keywords` は誌名・町名・号、`created` は作中の発行日の 9:00（`${ISSUE}T09:00:00+09:00`）。
- Title・Subject・Keywords に事件の語（負傷・搬送・黒塗り・行方不明・失踪、交通以外の「事故」、児童＋事件語）を入れない（post.py が止める）。
- しおりは見出し（h1〜h6）から自動で付く。§2-5 のとおり記事見出しだけを h2 にする。
- Creator・Producer は post.py が消す。手で付け足さない。

### 2-12. 禁止事項（全 PDF 共通）

- `ALWAYS_FORBIDDEN`（build.mjs）: 黒塗り・渡辺・佐藤・さとう・青木・大野・川村・年生・神隠し・町長の孫・TODO・ダミー・lorem・フィクション・架空。紙面に「架空」と書かない（奥付の印刷所も「架空」と書かず、架空の社名を書く）。
- 仮の文字: ○○・◯◯・△△・××・XX・〇〇。
- 実在の局番・郵便番号・lg.jp ドメイン・メールアドレスを書かない。住所と電話は `lib/town.mjs` の TOWN だけ。
- 広報（`_koho-issues.mjs` の ban）: 児童・事故・立入禁止・絵画展・年生。「交通事故」も「事故」を含むので使えない（「交通安全」「人身の被害」と書く）。

---

## 3. お手本: 地域安全通信 第112号の解剖

### 3-1. なぜ良いのか（他の文書との差）

| 観点 | 112号でしていること | 劣る文書で起きていること |
|---|---|---|
| 版面 | 2ページとも上から下まで記事・図・表・連絡欄で埋まる（p.1 の空白の帯 10mm 以下） | 各ページの下 1/3〜4/5 が白（議会だより 150〜225mm、広報 85〜177mm） |
| 段組 | p.1 は 2段（本文＋図）→ 全幅（記事＋表）→ 2段（小記事2本）。p.2 は 2段 | 全幅 1段の見出し＋2文の繰り返し |
| 情報密度 | 1ページ 1,100〜1,350字。数字（延べ22回・64人・7か所・48か所・前年比）と日付・地区名・時刻 | 1ページ 200〜700字。中身は「〜です」の 1〜2文と、その言い直しの表 |
| 見出しの階層 | 題字 30pt ＞ トップ 15pt ＞ 記事 13.5／11.6pt ＞ 小見出し 10pt ＞ 本文 9.4pt ＞ 注 8pt。kicker で変化 | 見出しが1種類だけ、または同じ大きさが並ぶ |
| 実物の型 | 題字ブロック、回覧欄（区長・組長・各戸）、発行・協力の行、柱、110/119 の黒帯、回覧の結び、奥付、再生紙、ノンブル | 型の一部が無い、または「この号の読み方」のような実物に無い部品がある |
| 図 | 手描きの SVG 略図（斜線の区域・柵・ロープ・看板の凡例・方位・キャプション） | CSS の円グラフ（画像化）、写真の帯だけ |
| 色 | 墨＋紺1色。白黒の複写でも読める | 色付きの帯と枠が多く、どれが大事か分からない |
| 文 | 役所の文（「関係各位のご協力により、周知を進めています」）。手がかりの1文は日常記事の間に埋まっている | 断片の命令文（「案内と予診票を持っていく」）、同じ文の繰り返し |
| 問 | 記事ごとに課・係・内線（組織の正本から） | 1ページに同じ問が4回、または問が無い |

112号に残る弱点: p.2 の奥付の下に約 32mm の白がある（`.spacer{flex:0}` のため連絡欄が下に付かない）。直し方は §3-4。

### 3-2. ページの設計図（mm）

```
p.1  ┌ sheet: left12 right12 top10 bottom15 ─────────────────────────────┐
     │ [題字ブロック 1fr（紺地・白抜き）] [回覧欄 58mm]   ← .mast（grid 1fr 58mm, gap 4）
     │  発行 ……………………………………………… 協力 …     ← .pubinfo（8pt、下罫 0.4mm）
     │ ■トップ見出し 15pt（全幅）
     │ [本文・リード 10.2pt・お願いの囲み・問] [図 78mm]   ← .top-grid（gap 5）
     │ ■記事見出し 13.5pt（全幅）＋ 2列の表 ＋ 問
     │ [■小記事 11.6pt] [■小記事 11.6pt]                ← .grid2.row（gap 6）
     └──────────────────────────────────────────────────────┘
p.2  │ 柱: 誌名 第112号（9月号） ……………………… 発行日     ← .running
     │ [左段: 記事×2（表・囲み）] [右段: 記事×3（表・箇条）] ← .grid2
     │ [110番/119番 黒地 62mm][駐在所・担当係・内線・FAX]   ← .contact
     │         回覧が終わりましたら、次の方へお回しください。 ← .kaiten
     │ 奥付（7.4pt、上罫）                       再生紙     ← .colophon
     │                                                 2   ← .nombre.right（.sheet の外）
```

### 3-3. テンプレートの部品（templates/anzen.mjs）

記事1本の HTML。見出しに kicker（種別ラベル）を持てる。`grid` を渡すと2段の行になる。

```js
function article(a, extraCls = "") {
  if (a.grid) return h`<div class="grid2 row">${a.grid.map((x) => h`<div class="col">${article(x)}</div>`)}</div>`;
  return h`<section class="art ${extraCls}">
  <h2 class="art-h ${a.small ? "small" : ""}">${a.kicker ? h`<span class="kicker">${a.kicker}</span>` : ""}<span>${t(a.title)}</span></h2>
  ${a.sub ? h`<p class="art-sub">${t(a.sub)}</p>` : ""}
  <div class="art-body">${blocks(a.body)}</div>
</section>`;
}
```

題字と回覧欄（p.1 の頭）:

```js
<header class="mast">
  <div class="mast-title">
    <p class="tag">${doc.tagline}</p>
    <h1>地域安全通信</h1>
    <p class="issue"><span class="no">第${doc.issue.no}号</span><span>${doc.issue.month}</span><span>${date}発行</span></p>
  </div>
  <div class="kairan">
    <div class="k-head"><span class="k-big">回覧</span><span class="k-sub">見たら印を押して次へ</span></div>
    <table><thead><tr><th>区長</th><th>組長</th><th>各戸</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr></tbody></table>
  </div>
</header>
<p class="pubinfo"><span><b>発行</b>　${doc.publisher}</span><span><b>協力</b>　${doc.cooperation}</span></p>
```

連絡欄・回覧の結び・奥付・ノンブル（最終ページの下）。住所・電話は `TOWN`、担当は `unit()`・`telExt()` から引き、手で書かない:

```js
<div class="contact">
  <div class="emg"><p>事件・事故は　<span class="big">110番</span></p><p>火事・救急は　<span class="big">119番</span></p></div>
  <div class="where">${blocks(doc.contact)}
    <p><b>${office.name}</b>（役場${office.floor}）　<span class="nowrap">${telExt(doc.office)}</span>　<span class="nowrap">FAX ${TOWN.fax}</span></p>
  </div>
</div>
<p class="kaiten">回覧が終わりましたら、次の方へお回しください。</p>
<div class="colophon">
  <span>地域安全通信　第${no}号（${month}）　${date}発行<br>編集・発行　${doc.publisher}<br>${TOWN.postalCode}　${TOWN.address}（${TOWN.office}内）　電話 ${TOWN.tel}（代表）</span>
  <span style="text-align:right">この通信は再生紙を使用しています。</span>
</div>
…
<p class="nombre right">2</p>   ← .sheet の外（.page の直下）に置く
```

### 3-4. CSS の要点（styles/anzen.css）

```css
:root { --ac:#1f4b7a; --ac-tint:#e6edf5; --ac-tint2:#f3f6fa; --rule:#8b98a8; }  /* 墨＋紺1色 */
body { font-size:9.4pt; line-height:1.6; }
.sheet { position:absolute; left:12mm; right:12mm; top:10mm; bottom:15mm;
         display:flex; flex-direction:column; overflow:hidden; }          /* 溢れたら layout-check が止める */

.mast { display:grid; grid-template-columns:1fr 58mm; gap:4mm; }
.mast-title { background:var(--ac); color:#fff; padding:3.2mm 5mm 3mm; border-radius:1.2mm; }
.mast-title h1 { font-size:30pt; letter-spacing:.14em; line-height:1.12; }
.kairan { border:.5mm solid #1a1a1a; border-radius:1mm; padding:1.6mm 2mm 2mm; }
.kairan .k-big { font-size:15pt; font-weight:700; letter-spacing:.3em; }
.kairan td { height:11mm; }                                             /* 実際に印が押せる高さ */

.art { margin-top:3.6mm; }
.art-h { display:flex; align-items:center; gap:2.4mm; font-size:13.5pt; line-height:1.3;
         padding:1.4mm 0 1.4mm 3mm; border-left:2.2mm solid var(--ac); background:var(--ac-tint); }
.art-h.small { font-size:11.6pt; padding:1mm 0 1mm 2.6mm; border-left-width:1.8mm; }
.art-h .kicker { font-size:8.4pt; color:#fff; background:#1a1a1a; padding:.3mm 1.8mm; border-radius:.6mm; }
.top .art-h { font-size:15pt; padding:2mm 0 2mm 3.4mm; }
.top-grid { display:grid; grid-template-columns:1fr 78mm; gap:5mm; margin-top:2.6mm; }
.art-body > * + * { margin-top:1.5mm; }
.art-body p { text-align:justify; }
.lead { font-size:10.2pt; line-height:1.7; }

.box { border:.35mm solid #1a1a1a; border-radius:1mm; padding:2mm 2.6mm 2.2mm; }
.box.warn { border-width:.6mm; }                                      /* お願い・注意 */
.box.tint { background:var(--ac-tint2); border-color:var(--rule); }   /* 例示・参考 */
table.data th, table.data td { border:.3mm solid #555; padding:.7mm 1.6mm; font-size:8.6pt; line-height:1.4; }
table.data thead th { background:var(--ac-tint); text-align:center; }
table.data tbody th { background:var(--ac-tint2); white-space:nowrap; }

.running { display:flex; justify-content:space-between; font-size:8pt; border-bottom:.4mm solid var(--ac); padding-bottom:1mm; }
.grid2 { display:grid; grid-template-columns:1fr 1fr; column-gap:6mm; }
.contact { border:.5mm solid #1a1a1a; border-radius:1.2mm; display:grid; grid-template-columns:62mm 1fr; }
.contact .emg { background:#1a1a1a; color:#fff; }
.colophon { font-size:7.4pt; line-height:1.45; border-top:.25mm solid #777; padding-top:1.2mm; }
```

**弱点の直し方（新しい文書ではこうする）**: 最終ページの連絡欄・奥付は紙の下に付ける。`.contact { margin-top:auto }`（`.sheet` が flex の縦並びなので下に押される）にし、記事の段（`.grid2`）と連絡欄のあいだの空きが 8mm を超えたら記事を足す。空きを `flex:1` の spacer で見えなくするだけにしない（白の位置が変わるだけ）。

### 3-5. データの書き方（docs/anzen-r1-09.mjs）

```js
import { md, mdRange, mdSeq, officeDay } from "../lib/dates.mjs";
import { safe } from "../lib/html.mjs";

const ISSUE = officeDay("2019-08-20", "第112号の発行日");   // 平日でなければ止まる

export default {
  id: "anzen-r1-09", file: "anzen-r1-09.pdf", template: "anzen", pages: 2,
  issue: { no: 112, month: "令和元年9月号", date: ISSUE },
  tagline: "安全で安心な霞ノ杜町を、みんなの力で",
  publisher: "霞ノ杜町 総務課 地域安全係・霞ノ杜町防犯協会",
  office: "総務課 地域安全係",          // organization.json の「課 係」名。内線は自動
  cooperation: "霞ノ杜駐在所",
  meta: { title: "地域安全通信 第112号（令和元年9月号）", author: "…", subject: "…／…", keywords: "…",
          created: `${ISSUE}T09:00:00+09:00` },
  p1: {
    top: { title: "烏啼山道付近の立入禁止区域について",
           body: [ { p: "…", cls: "lead" },
                   { box: { cls: "warn", title: "ご家庭へのお願い", body: [{ ordered: true, list: ["…", "…", "…"] }] } },
                   { toi: "総務課 地域安全係" } ],
           aside: [ { html: safe(`<figure class="fig">${MAP}${LEGEND}<figcaption>図　…縮尺は正確ではありません。…</figcaption></figure>`) } ] },
    rest: [
      { title: `夏の地域安全運動（${mdRange("2019-08-01", "2019-08-10")}）を実施しました`,
        body: [ "…",
                { table: { cls: "data", widths: ["34%", "66%"], rows: [
                  ["防犯パトロール車の巡回", "10日間・延べ22回（町内全域）"],
                  ["地区の夜間見回り", `${mdSeq("2019-08-02", "2019-08-09")}　延べ64人`] ] } },
                { toi: "総務課 地域安全係" } ] },
      { grid: [ { small: true, title: "「子ども110番の家」にご協力を", body: [/*…*/] },
                { small: true, title: "防犯灯の球切れを見つけたら", body: [/*…*/] } ] },
    ],
  },
  p2: { left: [/* 記事 */], right: [/* 記事 */] },
  contact: ["**霞ノ杜駐在所**　困りごとや相談は、お近くの駐在所へ。…"],
  checks: {
    mustContain: [{ page: 1, text: "…合意の文…" }, { page: 1, text: "第112号" }],   // 抽出で必ず見えるべき文
    mustNotContain: ["伝承", "町長室", "藤原", "申し入れ", "本件は"],               // この文書に出てはいけない語
  },
};
```

本文ブロックの記法（`lib/blocks.mjs`）:

| 書き方 | 出力 |
|---|---|
| `"文字列"` | 段落（`**太字**`、`\n` で改行） |
| `{ p: "…", cls: "lead" }` | class 付き段落 |
| `{ list: [...] }` / `{ list: [...], ordered: true }` / `{ checks: [...] }` | ・箇条 / ①②③ / □ |
| `{ table: { cls: "data", head, rows, widths, caption } }` | 表（セルは文字列か `{ t, cls:"r", colspan }`） |
| `{ dl: [["日時", "…"], ["場所", "…"]] }` | 要項（見出しと内容の組） |
| `{ box: { title, body: [...], cls: "warn" か "tint" } }` | 囲み |
| `{ note: "…" }` | 注（※） |
| `{ html: safe(svg) }` | 図など、そのまま |
| `{ toi: "総務課 地域安全係" }` | 記事末の「問」（内線は organization.json から） |

データの約束:
- 1記事＝1つの `{ title, body }`。本文の事実は1回だけ書き、表と文で同じことを繰り返さない。
- 日付は `md()` などの関数で、組織は `toi`／`unit()` で、住所・電話は `TOWN` で。文字列に直書きしない。
- 物語の合意の文は一字も変えずに置き、`checks.mustContain` にページ指定で入れる。出てはいけない語は `checks.mustNotContain` に入れる。
- 文書固有の図（SVG）はデータファイルの先頭に定数で置く（112号の `MAP`・`LEGEND`）。

---

## 4. 新しい文書を作る手順（チェックリスト）

上から順に実行する。各手順の「終わりの条件」を満たすまで次へ進まない。

### 手順0 決める（コードを書く前）
- [ ] 文書の種別を §7 から選ぶ（広報紙／議会だより／回覧・通信／情報公開の写し／ハザードマップ）。
- [ ] id・ファイル名（例 `koho-r8-11` → `public/pdf/koho-r8-11.pdf`）、判型（A4 縦）、ページ数（広報 12・議会だより 8・通信 2・写し 1＋n）。
- [ ] 発行者（奥付・Author）と記事末の「問」の係を決める（`organization.json` にある名前だけ）。
- [ ] 発行日を決め、曜日を `lib/dates.mjs` で確かめる（役所が動く日なら `officeDay`）。その年の祝日表があるか確かめる。
- [ ] 物語の合意の文・置いてはいけない語を、仕様書（引き継ぎ仕様書 §3）と会議まとめから写す。
- 終わりの条件: 上の値をデータファイルの冒頭コメントに書いた。

### 手順1 ページ割り表を作る
- [ ] §7 の型から、ページごとに「柱（コーナー名）・記事の本数・各記事の見出し・図表・写真・字数予算」を表にする（データファイルの冒頭コメントに置く）。
- [ ] 各ページの字数予算が §2-4 の範囲に入ることを確かめる（足りなければ日常記事を足す。§2-9 の月の定番から選ぶ）。
- [ ] 写真を §8-4 の台帳から選ぶ。キャプションと写っているものが合うこと、同じ文書・直近6号で重ならないこと。
- 終わりの条件: 全ページの予算の合計が「ページ数 × 下限」を超えている。

### 手順2 原稿を書く（docs/<id>.mjs）
- [ ] 記事ごとに: 見出し（15〜25字）→ リード（1〜2文）→ 本文（2〜4段落）→ 要項（`dl`: 日時・場所・対象・定員・費用・持ち物・申込）→ `{ toi }`。
- [ ] 数字・日付・地区名・時刻・担当のうち3つ以上が入っている。
- [ ] 日付は全部 `md()` 等で書いた（`grep -n "（[月火水木金土日]）" docs/<id>.mjs` で直書きが無いこと）。
- [ ] 同じ文・同じ事実を表と文で二重に書いていない。
- [ ] 合意の文を `checks.mustContain`（ページ指定）、禁止語を `checks.mustNotContain` に入れた。
- 終わりの条件: 原稿の総字数（地の文）が予算の 90％以上。

### 手順3 組版（templates/・styles/）
- [ ] 既存のテンプレートで足りるなら使う（通信 → `anzen`）。新しい種別なら `templates/<種別>.mjs` と `styles/<種別>.css` を作る。112号の部品（`article()`・`.art-h`・`.box`・`table.data`・`.running`・`.contact`・`.colophon`・`.nombre`）を写して始める。
- [ ] `.sheet` は `position:absolute; display:flex; flex-direction:column; overflow:hidden`。最終ページの連絡欄・奥付は `margin-top:auto`。
- [ ] 2ページ目以降に柱とノンブル（奇数右・偶数左）。表紙・最終ページに題字・奥付。
- [ ] 記事見出しだけ `h2`、題字だけ `h1`。飾りの見出しは `p`。
- [ ] 写真は `<figure>` ＋ `<figcaption>`、`object-fit:cover` と `object-position` を写真ごとに指定。
- [ ] 空きを測る `data-fill`（§8-2）を本文の箱に付ける。
- 終わりの条件: `npm run pdf:build -- <id> --shots <dir>` が通る。

### 手順4 見る・直す（ここを省かない）
- [ ] `--shots` の全ページを画像で開き、§5-2 の目視チェックを1ページずつ行う。
- [ ] `python scripts/pdf/qa.py public/pdf/<id>.pdf` の ERROR を 0、WARN を説明できるものだけにする。
- [ ] 112号の画像（`anzen-r1-09` の p1・p2）と並べて、密度・見出しの大きさ・余白を比べる。
- [ ] 直したら手順3から再実行。
- 終わりの条件: §5 の合格基準を全部満たした。

### 手順5 仕上げ
- [ ] `npm run pdf:meta` → `npm run check:pdf`。
- [ ] サイトの一覧（`src/content/pages/` の該当ページ）の題名・号・発行日・ページ数が PDF と合う（ページの HTML 側は別担当の作業。食い違いを見つけたら記録する）。
- [ ] 作業ログに「作ったファイル・検査の結果・残した WARN とその理由」を書く。

---

## 5. 合格基準

### 5-1. 自動検査（全部通ること）

| 検査 | どこで | 基準 |
|---|---|---|
| 組版 | `lib/layout-check.mjs`（build の中） | はみ出し 0、区画の外 0、6mm の安全域の外の文字 0、ページ数どおり、画像・フォントの読み込み失敗 0 |
| 空き | `data-fill`（§8-2 を layout-check に足す） | 本文の箱の下の空き ≤ 8mm（最終ページ・写しの最終ページは対象外にしてよい） |
| PDF | `post.py finalize`（build の中） | A4、ページ数、フォントは BIZ UDP の埋め込みだけ、mustContain／mustNotContain、仮の文字 0、文字の無いページの条件、5MB 以下、メタに事件の語なし、トレーラーに /Prev なし、%%EOF 1回、Creator/Producer なし |
| 品質 | `scripts/pdf/qa.py`（§8-1） | ERROR 0: Type3 フォント・想定外のフォント・空白の帯 40mm 超・曜日の食い違い。WARN を確認: 空白の帯 20〜40mm、本文ページ 500字未満、同じ文の繰り返し、同じ画像の再利用、中身の無いしおり、6.5pt 未満の字 |
| 登録 | `npm run pdf:meta` → `npm run check:pdf` | pdf-meta.json と public/pdf が一致 |

### 5-2. 目視チェックリスト（ページごと）

全体
- [ ] 遠目（画像を縮小）で見て、各ページの上から下まで灰色（文字）が均一に詰まっている。白い帯が 15mm を超えて続かない。
- [ ] 本文ページは 2段以上。全幅の地の文が 3行を超えていない。
- [ ] 見出しの大きさが 3〜4段階あり、記事の重さに応じて違う（全部同じ大きさではない）。
- [ ] 1ページに図・表・写真・囲みのどれかが 1つ以上ある（表紙と写しを除く）。
- [ ] 実物の型がそろっている: 題字・号・発行日／柱・ノンブル／記事末の問／奥付（§2-3）。
- [ ] 「この号の読み方」のような説明の文や、各ページに同じ連絡欄の繰り返しが無い。

文と数字
- [ ] 同じ文・同じ表の中身が2回出ていない。表が文の言い直しになっていない。
- [ ] 日付に曜日があり、期間・締切・納期限が月の定番と合う（祝日の扱いも）。
- [ ] 金額・人数・件数の合計が合う（円グラフ 100％、地区別の合計＝総数）。
- [ ] 人名の規則（§2-9）と禁止語（§2-12）を守っている。

写真と図
- [ ] キャプションと写真の中身が合っている。切り抜きで大事なもの（田・橋・建物）が切れていない。
- [ ] 同じ写真を2回使っていない。表紙は直近6号と重ならない。
- [ ] 図に凡例・方位・単位・出典か「縮尺は正確ではありません」がある。

組版の細部
- [ ] 行頭に句読点・閉じ括弧が無い。電話番号・内線・日付が途中で折れていない。
- [ ] 問の行が2行に折れていない。
- [ ] 表の罫・地色・文字の大きさが文書内でそろっている。数値は右寄せ。
- [ ] ノンブルが奇数右・偶数左。柱の号・日付が表紙と同じ。

---

## 6. よくある失敗と対処

| 失敗 | 見え方・原因 | 対処 |
|---|---|---|
| ページの下半分が白い | 記事が足りない（字数予算を決めずに作った） | 手順1の予算表を作り、日常記事を足す。段組を 2〜3段にする。最後の手段で写真を大きく（ただし 1ページの 1/3 まで） |
| はみ出し（build が止まる） | 記事が多すぎる、表の行が多い | 記事を次ページへ送る。写真の高さを下げる。字を 8pt 未満にはしない |
| 水増しの表・繰り返し | 足りない字数を「同じ事実の2列表」「同じ文の再掲」で埋めた（広報の `_koho-enrich.mjs` がこれ） | 水増しの仕組みを使わない。別の記事を書く。qa.py の「同じ文」WARN を 0 にする |
| 断片の文 | 「〜を持っていく」「〜へ」で終わる箇条・体言止めの羅列 | 役所の文（です・ます、〜してください）で、1文 30〜60字 |
| 見出しだらけ | 1つの話題を「〜のとき」「〜の場所」など 3〜4本の小記事に割った | 1話題＝1記事。小見出しは `art-sub`（10pt 太字）か `dl` の要項にまとめる |
| 写真とキャプションが合わない | 写真の中身を確かめずに季節の語を書いた／中央で切り抜いて主題が消えた | §8-4 の台帳を見る。`object-position` を指定。合う写真が無ければ図や表で組む |
| 同じ写真の使い回し | 表紙の写真を2ページ目にも使う／別の号で同じ表紙 | 1文書1回、表紙は6号で重ねない（qa.py が文書内の重複を WARN） |
| Type3 フォント | SVG の文字に stroke・paint-order・text-shadow・filter を付けた | 縁取りをやめ、文字の下に白い四角を敷く（112号の地図） |
| 想定外のフォント（post.py が止める） | BIZ UDP に無い字（☎・絵文字・環境依存文字）を書いた／`font-family` を書き忘れ OS のフォントに落ちた | 字を言い換える。全要素が base.css の `"KN Gothic"` を継ぐようにし、SVG の `<text>` にも `font-family="KN Gothic"` を書く |
| 明朝の太字 | `"KN Mincho"` に `font-weight:700`（合成の太字） | 明朝は Regular だけ。強調はゴシック太字 |
| しおりの /Prev で止まる | Chrome のしおり（アウトライン）の兄弟リンク /Prev を、旧検査が「増分保存」と誤判定 | post.py は FORBIDDEN_KEYS から /Prev を外し、トレーラーの /Prev と %%EOF 1回で判定している。scripts/hazard/pdf_post.py を変えない |
| 黒塗りの下に文字が残る | 文字の上に黒い四角を重ねた（PDF では文字が抽出できる） | 写しのページは `raster()` で画像にしてから貼る。隠す原文はデータにもリポにも書かない（帯だけを描く）。`checks.textlessPages` で 0 字・画像1枚・帯の内側が一様な黒を確かめる |
| 写しの帯で行が割れる | 帯を `display:block` にしたため「霞教第」「■」「号」が3行になる | 帯は行の中の `inline-block`（§8-3-4）。行全体を隠すときだけ行幅いっぱいの帯 |
| 曜日の間違い | 曜日を手で書いた | `md()` 等を使う。qa.py が年と照合する |
| 「令和1年」 | 和暦を手で書いた | `full()`・`year()` を使う（元年になる） |
| 問の行が折れる | 「教育委員会 教育課 生涯学習係」＋電話が段幅に入らない | 段幅を広げる、`toi` の電話部分を `nowrap`、課の表記を organization.json の短い名前にする |
| しおりに「5月」「書誌」 | 飾りの見出しに h2 を使った | 記事見出し以外は `p`／`div` |
| 毎ページの同じ連絡帯 | 空きを埋めるために「役場の代表」欄を全ページに置いた | 連絡欄は最終ページ（通信）か裏表紙（広報）だけ |
| メタに事件の語 | Subject に「負傷」「事故」 | post.py が止める。Subject は日常の題だけにする |
| ノンブルが内側 | left/right を固定した | 奇数ページ `right`、偶数ページ `left` |
| 容量超過 | 写真の原寸を貼った | 長辺 1600px・品質 75 前後に縮めた写しを使う（public/ を変えられないときは .cache に縮小版を作って貼る） |
