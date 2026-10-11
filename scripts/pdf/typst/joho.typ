// 情報提供資料の1ページ。公文書の通知の体裁（明朝・黒枠・印）。2〜3ページは写しの画像。
#let data = json(sys.inputs.data)
#let ink = rgb("#1a1a1a")
#let seal = rgb("#b02020")

#set text(font: "BIZ UDPMincho", fill: ink, size: 10.5pt, lang: "ja")
#set par(justify: true, leading: 0.85em, first-line-indent: 1em, spacing: 0.75em)
#set page(paper: "a4", margin: (top: 16mm, bottom: 14mm, x: 18mm))

#grid(
  columns: (1fr, auto),
  align: horizon,
  text(size: 9pt)[霞ノ杜町　総務課　情報公開担当],
  text(size: 10.5pt)[#data.date],
)

#v(7mm)
#align(center)[
  #set par(first-line-indent: 0pt, spacing: 0pt)
  #text(size: 16pt, tracking: 0.18em)[情報提供資料]
]
#align(center, line(length: 46mm, stroke: 0.6pt + ink))
#v(6mm)

#for para in data.paras [
  #para
  #parbreak()
]

#v(3mm)
#align(center)[
  #set par(first-line-indent: 0pt)
  #text(size: 12pt, tracking: 0.4em)[記]
]

#v(2.5mm)
#table(
  columns: (32mm, 1fr),
  stroke: 0.45pt + ink,
  inset: (x: 2.2mm, y: 1.7mm),
  align: top + left,
  ..data.rows.map(row => (
    text(size: 9.5pt)[#row.at(0)],
    text(size: 9.5pt)[#row.at(1)],
  )).flatten(),
)

#v(4mm)
#set par(first-line-indent: 0pt, justify: false)
#block(width: 100%)[#text(size: 9.5pt)[#data.ask]]

#v(6mm)
#grid(
  columns: (1fr, 22mm),
  column-gutter: 4mm,
  align: horizon,
  text(size: 8.5pt)[
    #data.office \
    #data.postal　#data.address \
    電話 #data.tel（代表）
  ],
  box(width: 16mm, height: 16mm)[
    #place(center + horizon, circle(radius: 7.2mm, stroke: 0.7pt + seal))
    #place(center + horizon, circle(radius: 6.2mm, stroke: 0.3pt + seal))
    #place(center + horizon, text(font: "BIZ UDPMincho", fill: seal, size: 8pt)[印])
  ],
)

#page(margin: 0pt, header: none, footer: none)[
  #image(data.copy1, width: 100%, height: 100%, fit: "stretch")
]
#page(margin: 0pt, header: none, footer: none)[
  #image(data.copy2, width: 100%, height: 100%, fit: "stretch")
]
