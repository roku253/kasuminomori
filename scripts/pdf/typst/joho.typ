// 情報提供資料。2〜3ページは文字の無い画像。
#let data = json(sys.inputs.data)
#let green = rgb("#1a4d80")

#set text(font: "BIZ UDPGothic", size: 10pt, lang: "ja")
#set par(justify: true, leading: 0.7em)
#set page(paper: "a4", margin: (top: 16mm, bottom: 16mm, x: 16mm))

#text(size: 9pt, fill: green)[霞ノ杜町　総務課　情報公開担当]
#v(2mm)
#text(font: "Zen Kaku Gothic New", weight: "black", size: 18pt, fill: green)[情報提供資料]
#v(3mm)
#for para in data.paras [
  #para
  #parbreak()
]

#page(margin: 0pt, header: none, footer: none)[
  #image(data.copy1, width: 100%, height: 100%, fit: "stretch")
]
#page(margin: 0pt, header: none, footer: none)[
  #image(data.copy2, width: 100%, height: 100%, fit: "stretch")
]
