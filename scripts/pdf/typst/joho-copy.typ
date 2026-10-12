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
    [
      #set text(size: 8.5pt)
      令和元年8月 #bar(28mm) 日（ #bar(16mm) ） \
      発生を確認した日。時刻および曜日は不開示とする。
    ],
    row-label[2　場所],
    [
      #set text(size: 8.5pt)
      烏啼山道付近（立入禁止区域内） \
      杜ケ丘地区の山すそ。烏啼（うてい）山道の入口から、町が立入を禁じている区域内。禁止の理由は、落石および地盤のゆるみである。
    ],
    row-label[3　関係者],
    [
      #set text(size: 8.5pt)
      関係した者の氏名、住所および在籍先は、条例第7条第1号により不開示とする。
      #v(1.6mm)
      #bar(118mm)
      #v(1.6mm)
      #bar(118mm)
      #v(1.6mm)
      聴き取りにおける発言は、同条第5号により不開示とする。
      #v(1.6mm)
      #bar(118mm)
    ],
    row-label[4　概要],
    [
      #set text(size: 8.5pt)
      当該区域は、落石および地盤のゆるみのため、町が立入を禁止している。区域内で負傷があり、
      #v(1.4mm)
      #bar(118mm)
      #v(1.4mm)
      #bar(118mm)
      #v(1.4mm)
      #bar(78mm) #h(2mm) …搬送された。 \
      見分、連絡およびその後の措置のうち、個人または事務に関する部分は不開示とする。
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
      #set text(size: 8.5pt)
      8月 #bar(18mm) 日　区域の見分を行った。
      #v(1.4mm)
      #bar(118mm)
      #v(1.6mm)
      8月 #bar(18mm) 日
      #v(1mm)
      保護者より事実確認の申し入れがあった。 \
      申し入れの相手方、文面および回答の細部は不開示とする。 \
      （以下）
      #v(1.4mm)
      #bar(118mm)
      #v(1.4mm)
      #bar(118mm)
      #v(1.4mm)
      教育委員会において、対応の方針を確認した。その記録のうち個人に関する部分は不開示とする。
    ],
    row-label[6　対応],
    [
      #set text(size: 8.5pt)
      #bar(118mm)
      #v(1.6mm)
      立入禁止区域の柵及び看板を増設する \
      学校を通じて、立入禁止の周知と安全指導を行う \
      関係する区へ、入口の位置を改めて知らせる
    ],
    row-label[7],
    [
      #set text(size: 8.5pt)
      本件は事故として処理し、終了とする。 \
      再発の防止は、上記6の対応をもって行う。個人に関する照会には答えない。
    ],
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
