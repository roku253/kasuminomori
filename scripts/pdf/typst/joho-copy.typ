// 情報提供資料の写し（2〜3ページの下絵）。紙の地の上に公文書を組む。
// この PDF は文字が残る。公開用は joho_raster.py がスキャンして、帯だけ純黒に戻す。
#let ink = rgb("#333333")
#let rule = rgb("#444444")
#let paper = image("/scripts/pdf/assets/paper_texture.jpg", width: 210mm, height: 297mm, fit: "cover")
#let seal = image("/scripts/pdf/assets/miyasaka-seal.png", width: 17mm)

#set text(font: "BIZ UDPMincho", fill: ink, size: 10.5pt, lang: "ja")
#set par(leading: 0.75em, spacing: 0.65em, first-line-indent: 0pt, justify: false)

#let bar(w) = box(width: w, height: 3.15mm, fill: black, baseline: 0.55mm)
#let long = bar(112mm)
#let mid = bar(72mm)

#let sheet(body) = page(paper: "a4", margin: 0pt)[
  #place(top + left, paper)
  #pad(x: 16mm, y: 15mm)[
    #body
  ]
]

#sheet[
  #align(center, text(size: 13pt, tracking: 0.42em)[霞ノ杜町教育委員会])
  #v(5mm)
  #align(right)[
    霞教第 #bar(26mm) 号 \
    令和元年8月 #bar(24mm) 日
  ]
  #v(7mm)
  #grid(
    columns: (1fr, auto, 18mm),
    column-gutter: 3mm,
    align: horizon,
    [霞ノ杜町長　様],
    align(right)[霞ノ杜町教育委員会教育長],
    seal,
  )
  #v(7mm)
  #align(center)[烏啼山道付近立入禁止区域における事案について（報告）]
  #v(2mm)
  #line(length: 100%, stroke: 0.4pt + rule)
  #v(4mm)
  1　日時 \
  #h(5mm) 令和元年8月 #bar(32mm) 日（ #bar(22mm) ）
  #v(3.5mm)
  2　場所 \
  #h(5mm) 烏啼山道付近（立入禁止区域内）
  #v(3.5mm)
  3　関係者 \
  #v(1.5mm)
  #pad(left: 5mm)[#long #v(1.6mm) #long #v(1.6mm) #long]
  #v(4mm)
  4　概要 \
  #v(1.5mm)
  #pad(left: 5mm)[
    #mid #v(1.6mm)
    #mid #v(1.6mm)
    #mid #h(3mm) …搬送された。
  ]
]

#sheet[
  #text(size: 9.5pt)[霞ノ杜町教育委員会] \
  #text(size: 9.5pt)[烏啼山道付近立入禁止区域における事案について（報告）（続き）]
  #v(2mm)
  #line(length: 100%, stroke: 0.5pt + rule)
  #v(2mm)
  （写）
  #v(3mm)
  5　経過 \
  #v(1.5mm)
  #h(5mm) 8月 #bar(22mm) 日
  #v(2mm)
  #pad(left: 5mm, long)
  #v(2.2mm)
  #h(5mm) 8月 #bar(22mm) 日 \
  #h(5mm) 保護者より事実確認の申し入れがあった。 \
  #h(5mm) （以下）
  #v(2mm)
  #pad(left: 5mm)[#long #v(1.6mm) #long]
  #v(4mm)
  6　対応 \
  #v(1.5mm)
  #pad(left: 5mm, long)
  #v(3mm)
  #h(5mm) 立入禁止区域の柵及び看板を増設する
  #v(4mm)
  7 \
  #v(2mm)
  #h(5mm) 本件は事故として処理し、終了とする。
  #v(8mm)
  #line(length: 100%, stroke: 0.4pt + rule)
  #v(2mm)
  #text(size: 9.5pt)[【7条1号】　　【7条5号】]
]
