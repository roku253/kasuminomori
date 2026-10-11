// 開示した写し。実在の開示決定通知書と同じ並び（右上に番号と日付、宛名、右に職名と印、枠の表、下の注）。
#let ink = rgb("#222222")
#let paper = image("/scripts/pdf/assets/paper_texture.jpg", width: 210mm, height: 297mm, fit: "cover")
#let seal = image("/scripts/pdf/assets/miyasaka-seal.png", width: 16mm)

#set text(font: "BIZ UDPMincho", fill: ink, size: 9pt, lang: "ja")
#set par(leading: 0.65em, spacing: 0.45em, first-line-indent: 0pt, justify: false)

#let bar(w) = box(width: w, height: 2.8mm, fill: black, baseline: 0.45mm)
#let hair = 0.45pt + black

#let sheet(body) = page(paper: "a4", margin: 0pt)[
  #place(top + left, paper)
  #pad(x: 14mm, y: 12mm)[#body]
]

#let row-label(body) = align(center + horizon, text(size: 9pt)[#body])

#sheet[
  #grid(
    columns: (1fr, auto),
    align: top,
    text(size: 9pt)[霞ノ杜町教育委員会],
    align(right)[
      #set par(leading: 0.55em, spacing: 0.2em)
      霞教第 #bar(22mm) 号 \
      令和元年8月 #bar(18mm) 日
    ],
  )
  #v(5mm)
  #align(center, text(size: 13pt)[烏啼山道付近立入禁止区域における事案について（報告）])
  #v(5mm)
  #grid(
    columns: (1fr, auto),
    align: horizon,
    [霞ノ杜町長　様],
    box(inset: (right: 2mm))[
      霞ノ杜町教育委員会教育長
      #h(1mm)
      #box(seal)
    ],
  )
  #v(4mm)
  #set par(justify: true, leading: 0.7em)
  烏啼山道付近の立入禁止区域における事案について、教育委員会から町長へ次のとおり報告した文書の写しです。不開示の部分は帯で示しています。
  #v(3mm)
  #table(
    columns: (28mm, 1fr),
    rows: (16mm, 18mm, 58mm, 62mm),
    stroke: hair,
    inset: (x: 2.2mm, y: 2mm),
    align: top + left,
    row-label[1　日時],
    [令和元年8月 #bar(28mm) 日（ #bar(16mm) ）],
    row-label[2　場所],
    [烏啼山道付近（立入禁止区域内）],
    row-label[3　関係者],
    [
      #bar(118mm)
      #v(2.2mm)
      #bar(118mm)
      #v(2.2mm)
      #bar(118mm)
    ],
    row-label[4　概要],
    [
      #bar(118mm)
      #v(2.2mm)
      #bar(118mm)
      #v(2.2mm)
      #bar(78mm) #h(2.5mm) …搬送された。
    ],
  )
]

#sheet[
  #text(size: 8.5pt)[霞ノ杜町教育委員会　烏啼山道付近立入禁止区域における事案について（報告）（続き）]
  #v(2mm)
  #table(
    columns: (28mm, 1fr),
    rows: (78mm, 36mm, 28mm),
    stroke: hair,
    inset: (x: 2.2mm, y: 2mm),
    align: top + left,
    row-label[5　経過],
    [
      8月 #bar(18mm) 日
      #v(2mm)
      #bar(118mm)
      #v(2.4mm)
      8月 #bar(18mm) 日
      #v(1.2mm)
      保護者より事実確認の申し入れがあった。 \
      （以下）
      #v(2mm)
      #bar(118mm)
      #v(2mm)
      #bar(118mm)
    ],
    row-label[6　対応],
    [
      #bar(118mm)
      #v(2.4mm)
      立入禁止区域の柵及び看板を増設する
    ],
    row-label[7],
    [本件は事故として処理し、終了とする。],
  )
  #v(1fr)
  #table(
    columns: (28mm, 1fr),
    stroke: hair,
    inset: (x: 2.2mm, y: 1.8mm),
    align: top + left,
    row-label[担当],
    [
      霞ノ杜町教育委員会（役場3階） \
      写しについての問い合わせは、総務課総務係（情報公開、内線211）
    ],
  )
  #v(3mm)
  #block(width: 100%, inset: (x: 2mm, y: 1.6mm), stroke: hair)[
    #set text(size: 8pt)
    #set par(leading: 0.55em, spacing: 0.35em)
    ※　不開示の部分は、霞ノ杜町情報公開条例第7条第1号（個人に関する情報）および第5号（事務事業に関する情報）に該当するため、開示していません。帯の下に文字は残していません。 \
    【7条1号】　　【7条5号】
  ]
]
