// 議会だより・地域安全通信。本文は prepare が抜き出した段落。
#let data = json(sys.inputs.data)
#let green = rgb("#1f4b7a")

#set text(font: "BIZ UDPGothic", size: 9pt, lang: "ja")
#set par(justify: true, leading: 0.65em)
#set page(paper: "a4", margin: (top: 16mm, bottom: 14mm, x: 12mm))

#align(center)[
  #text(font: "Zen Kaku Gothic New", weight: "black", size: 16pt, fill: green)[#data.title]
]
#v(3mm)

#for (i, page) in data.pages.enumerate() {
  if i > 0 { pagebreak() }
  columns(2, gutter: 5.5mm)[
    #for para in page [
      #para
      #parbreak()
    ]
  ]
}
