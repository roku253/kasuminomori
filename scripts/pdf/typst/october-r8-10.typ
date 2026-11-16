// 10月号だけのページ種別レイアウト。設計図は広報ちよだ（特選）・広報葉山・広報かわづ。
#let data = json(sys.inputs.data)
#let orange = rgb("#e4572e")
#let leaf = rgb("#2f8f4e")
#let cream = rgb("#f3ddb0")
#let sun = rgb("#f6d15a")
#let sky = rgb("#8fd4ef")
#let pink = rgb("#f3c6d8")
#let ink = rgb("#222222")
#let paper = rgb("#ffffff")

#let pg(i) = data.pages.at(i)
#let art(i, j) = pg(i).articles.at(j)

#let prose(a, limit: 99) = {
  set par(justify: true, leading: 0.55em, spacing: 0.42em)
  set text(font: "BIZ UDPGothic", size: 9.2pt, fill: ink)
  let n = calc.min(limit, a.paras.len())
  for k in range(n) {
    a.paras.at(k)
    parbreak()
  }
}

#let ask(a) = {
  set text(size: 7.6pt, fill: ink)
  text(fill: paper, weight: "bold")[#box(fill: orange, inset: (x: 1.2pt, y: 0.4pt))[問]]
  h(1.5pt)
  [#a.toi　#data.town.tel]
}

#let h-orange(body, size: 16pt) = text(font: "Zen Kaku Gothic New", weight: "black", size: size, fill: orange)[#body]

#let rice(dx, dy, turn: 0deg) = place(dx: dx, dy: dy, rotate(turn)[
  #circle(radius: 3.2mm, fill: leaf)
  #place(dx: 2mm, dy: -1mm, circle(radius: 2.2mm, fill: sun))
  #place(dx: 5mm, dy: 1mm, circle(radius: 2.6mm, fill: orange))
])

#let sun-ico(dx, dy) = place(dx: dx, dy: dy, circle(radius: 7mm, fill: sun, stroke: 1.2pt + orange))

#let bubble(dx, dy, turn, body) = place(dx: dx, dy: dy, rotate(turn, box(fill: paper, stroke: 1pt + orange, inset: 1.6mm, radius: 2mm)[
  #set text(size: 8pt, fill: ink)
  #body
]))

#let folio(n, tint) = place(bottom + right, dx: -4mm, dy: -3mm, box(fill: tint, inset: (x: 2mm, y: 0.6mm))[
  #text(fill: paper, weight: "bold", size: 9pt)[#n]
])

// 1 表紙 — 広報ちよだ 2025年8月号 p1（写真全面、大きな月号、題字を写真に載せる）
#page(paper: "a4", margin: 0pt)[
  #place(top + left, image(data.photo, width: 210mm, height: 297mm, fit: "cover"))
  #place(top + left, dx: 6mm, dy: 8mm, box(fill: orange, inset: (x: 3mm, y: 2mm), radius: (right: 8mm))[
    #set text(fill: paper, font: "BIZ UDPMincho")
    #text(size: 11pt)[広報]
    #linebreak()
    #text(size: 22pt)[かすみのもり]
  ])
  #place(top + right, dx: -4mm, dy: 6mm, box(fill: sun, inset: (x: 3mm, y: 1mm))[
    #align(center)[
      #text(font: "Zen Kaku Gothic New", weight: "black", fill: orange, size: 42pt)[#data.monthNum]
      #v(-3mm)
      #text(size: 9pt, fill: ink, weight: "bold")[月号　No.#data.no]
    ]
  ])
  #bubble(12mm, 210mm, -8deg)[#data.mark　#data.wareki#{data.monthNum}月#{data.day}日]
  #place(bottom + left, dx: 8mm, dy: -8mm, box(fill: rgb("#000000").transparentize(35%), inset: (x: 3mm, y: 1.5mm))[
    #text(fill: paper, size: 11pt, weight: "bold")[▲ #data.caption　#data.feature]
  ])
  #sun-ico(168mm, 248mm)
]

// 2 特集 — 広報ちよだ p2（右上に大きな写真、左と下に記事。均等2段ではない）
#page(paper: "a4", margin: 0pt, fill: cream)[
  #let a0 = art(1, 0)
  #let a1 = art(1, 1)
  #place(top + right, image(pg(1).photo, width: 118mm, height: 128mm, fit: "cover"))
  #place(top + left, dx: 6mm, dy: 6mm, box(width: 84mm)[
    #box(fill: orange, inset: (x: 1.6mm, y: 0.5mm))[#text(fill: paper, size: 8pt, weight: "bold")[#a0.kicker]]
    #v(1mm)
    #h-orange(a0.h, size: 15pt)
    #v(1.2mm)
    #prose(a0, limit: 5)
    #v(1mm)
    #ask(a0)
  ])
  #place(top + left, dx: 96mm, dy: 130mm, box(width: 108mm, fill: cream, inset: 2mm)[
    #text(weight: "bold", size: 9pt, fill: orange)[#a1.h]
    #v(0.6mm)
    #prose(a1, limit: 3)
    #text(size: 7.4pt)[▲ #pg(1).photoCaption]
  ])
  #place(top + left, dx: 5mm, dy: 158mm, box(width: 200mm)[
    #text(weight: "bold", size: 9pt)[#a0.table.caption]
    #v(0.5mm)
    #table(
      columns: (28mm, 1fr, 32mm),
      inset: (x: 1.2mm, y: 0.8mm),
      stroke: 0.3pt + orange,
      fill: (_, y) => if y == 0 { orange } else if calc.odd(y) { cream } else { paper },
      table.header(..a0.table.headers.map(x => text(fill: paper, size: 8pt, weight: "bold")[#x])),
      ..a0.table.rows.map(r => r.map(c => text(size: 8pt)[#c])).flatten(),
    )
  ])
  #place(top + left, dx: 5mm, dy: 200mm, box(width: 200mm)[
    #grid(columns: (1fr, 1fr, 1fr), column-gutter: 3mm,
      ..(art(1, 2), art(1, 3), art(1, 4)).map(a => box[
        #text(fill: leaf, weight: "bold", size: 9.5pt)[#a.h]
        #v(0.5mm)
        #prose(a, limit: 3)
        #ask(a)
      ])
    )
  ])
  #rice(4mm, 148mm, turn: -12deg)
  #folio(2, orange)
]

// 3 健康 — 広報ちよだ p7（地色の違う箱を、同じ幅で並べない）
#page(paper: "a4", margin: 0pt, fill: cream)[
  #let b0 = art(2, 0)
  #place(top + left, rect(width: 210mm, height: 28mm, fill: leaf))
  #place(top + left, dx: 6mm, dy: 5mm, h-orange(b0.h, size: 16pt))
  #place(top + right, dx: 2mm, dy: 18mm, rotate(7deg, box(stroke: 2pt + paper, image(pg(2).photo, width: 78mm, height: 58mm, fit: "cover"))))
  #place(top + left, dx: 6mm, dy: 34mm, box(width: 118mm, fill: paper, inset: 2.5mm)[
    #prose(b0, limit: 4)
    #ask(b0)
  ])
  #place(top + left, dx: 6mm, dy: 108mm, box(width: 96mm, fill: pink, inset: 2.2mm)[
    #text(weight: "bold", fill: orange, size: 10pt)[#art(2, 1).h]
    #v(0.6mm)
    #prose(art(2, 1), limit: 3)
    #if art(2, 1).table != none [
      #text(size: 7.5pt, weight: "bold")[#art(2, 1).table.caption]
      #for row in art(2, 1).table.rows [
        #text(size: 7.4pt)[#row.at(0)　#row.at(1)]
        #linebreak()
      ]
    ]
    #ask(art(2, 1))
  ])
  #place(top + left, dx: 108mm, dy: 92mm, box(width: 96mm, fill: sky, inset: 2.2mm)[
    #text(weight: "bold", size: 10pt)[#art(2, 2).h]
    #v(0.5mm)
    #prose(art(2, 2), limit: 4)
    #if art(2, 2).figure != none and art(2, 2).figure.type == "steps" [
      #for (i, s) in art(2, 2).figure.items.enumerate() [
        #text(size: 8pt)[#text(fill: orange, weight: "bold")[#(i + 1)] #s]
        #linebreak()
      ]
    ]
  ])
  #place(top + left, dx: 6mm, dy: 198mm, box(width: 198mm, fill: paper, inset: 2mm)[
    #grid(columns: (1.15fr, 0.85fr), column-gutter: 4mm,
      box[
        #text(weight: "bold", fill: leaf, size: 10pt)[#art(2, 3).h]
        #v(0.4mm)
        #prose(art(2, 3), limit: 4)
        #ask(art(2, 3))
      ],
      box[
        #text(weight: "bold", fill: orange, size: 10pt)[#art(2, 4).h]
        #v(0.4mm)
        #prose(art(2, 4), limit: 3)
        #if art(2, 4).list != none [
          #for item in art(2, 4).list [
            #text(size: 8pt)[・#item]
            #linebreak()
          ]
        ]
      ],
    )
  ])
  #place(top + right, dx: -6mm, dy: 4mm, text(fill: paper, size: 8pt, weight: "bold")[▲ #pg(2).photoCaption])
  #folio(3, leaf)
]

// 4 まちの話題 — 広報ちよだ p4（写真の大きさを変え、左を裁ち落とす）
#page(paper: "a4", margin: 0pt, fill: cream)[
  #place(top + left, dx: -4mm, dy: -2mm, image(pg(3).photo, width: 128mm, height: 150mm, fit: "cover"))
  #place(top + left, dx: 128mm, dy: 8mm, box(width: 76mm, fill: sun, inset: 2mm)[
    #text(weight: "bold", size: 11pt)[#art(3, 0).h]
    #v(0.6mm)
    #prose(art(3, 0), limit: 4)
  ])
  #place(top + left, dx: 128mm, dy: 78mm, image(data.photo, width: 76mm, height: 52mm, fit: "cover"))
  #place(top + left, dx: 6mm, dy: 152mm, text(size: 8pt)[▲ #pg(3).photoCaption])
  #place(top + left, dx: 5mm, dy: 164mm, box(width: 200mm)[
    #grid(columns: (1.2fr, 0.8fr, 1fr), column-gutter: 3mm,
      box[#text(fill: orange, weight: "bold", size: 10pt)[#art(3, 1).h]#v(0.4mm)#prose(art(3, 1), limit: 4)#ask(art(3, 1))],
      box(fill: pink, inset: 1.6mm)[#text(weight: "bold", size: 9.5pt)[#art(3, 2).h]#v(0.4mm)#prose(art(3, 2), limit: 3)],
      box[#text(fill: leaf, weight: "bold", size: 10pt)[#art(3, 4).h]#v(0.4mm)#prose(art(3, 4), limit: 4)#ask(art(3, 4))],
    )
  ])
  #place(bottom + left, dx: 5mm, dy: -8mm, box(width: 130mm, fill: sky, inset: 1.6mm)[
    #text(weight: "bold", size: 9pt)[#art(3, 3).h]
    #h(2mm)
    #text(size: 8pt)[#art(3, 3).paras.at(0)]
  ])
  #bubble(150mm, 250mm, 6deg)[秋まつり]
  #folio(4, orange)
]

// 5 くらし（工事・税）— 広報葉山 p12 の小さい記事を、ちよだ p5 の写真位置で
#page(paper: "a4", margin: 0pt, fill: paper)[
  #place(top + left, image(pg(4).photo, width: 210mm, height: 62mm, fit: "cover"))
  #place(top + left, dx: 6mm, dy: 64mm, text(fill: paper, size: 8pt)[]) 
  #place(top + left, dx: 4mm, dy: 50mm, box(fill: orange, inset: (x: 2mm, y: 0.8mm))[
    #text(fill: paper, weight: "bold", size: 12pt)[#art(4, 0).h]
  ])
  #place(top + left, dx: 5mm, dy: 68mm, box(width: 200mm, height: 222mm)[
    #text(size: 8pt)[▲ #pg(4).photoCaption]
    #v(1mm)
    #grid(columns: (1fr, 1fr, 1fr), column-gutter: 2.4mm, row-gutter: 2.2mm,
      ..(art(4, 0), art(4, 1), art(4, 2), art(4, 3), art(4, 4), art(4, 5)).map(a => box(width: 100%, height: 96mm, fill: if a.kicker == "税" { sun } else { sky }, inset: 1.6mm, clip: true)[
        #text(size: 7pt, fill: orange, weight: "bold")[#a.kicker]
        #linebreak()
        #text(weight: "bold", size: 9pt)[#a.h]
        #v(0.3mm)
        #prose(a, limit: 4)
        #ask(a)
      ])
    )
  ])
  #folio(5, leaf)
]

// 6 数字と訓練 — 広報ちよだ p6（人物カットと数字を混ぜる）
#page(paper: "a4", margin: 0pt, fill: cream)[
  #place(top + left, rect(width: 78mm, height: 297mm, fill: leaf))
  #place(top + left, dx: 4mm, dy: 8mm, box(width: 70mm)[
    #text(fill: sun, size: 11pt, weight: "bold")[町の人口]
    #v(1mm)
    #text(font: "Zen Kaku Gothic New", weight: "black", fill: paper, size: 28pt)[5,812]
    #v(-1mm)
    #text(fill: paper, size: 10pt)[人]
    #v(1mm)
    #text(fill: paper, size: 9pt)[世帯 2,431]
    #v(2mm)
    #text(fill: paper, size: 8pt)[#art(5, 2).paras.at(0)]
  ])
  #place(top + left, dx: 82mm, dy: 0mm, image(pg(5).photo, width: 128mm, height: 78mm, fit: "cover"))
  #place(top + left, dx: 84mm, dy: 80mm, text(size: 7.6pt)[▲ #pg(5).photoCaption])
  #place(top + left, dx: 84mm, dy: 90mm, box(width: 120mm, fill: cream, inset: 2mm)[
    #text(weight: "bold", fill: orange, size: 11pt)[#art(5, 0).h]
    #v(0.5mm)
    #prose(art(5, 0), limit: 4)
    #ask(art(5, 0))
  ])
  #place(top + left, dx: 4mm, dy: 150mm, box(width: 70mm, fill: sun, inset: 2mm)[
    #text(weight: "bold", size: 9.5pt)[#art(5, 1).h]
    #v(0.4mm)
    #prose(art(5, 1), limit: 3)
  ])
  #place(top + left, dx: 84mm, dy: 175mm, box(width: 120mm)[
    #grid(columns: (1fr, 1fr), column-gutter: 3mm,
      box[#text(weight: "bold", fill: leaf, size: 9.5pt)[#art(5, 3).h]#v(0.4mm)#prose(art(5, 3), limit: 3)#ask(art(5, 3))],
      box[#text(weight: "bold", fill: orange, size: 9.5pt)[#art(5, 4).h]#v(0.4mm)#prose(art(5, 4), limit: 3)],
    )
  ])
  #place(bottom + left, dx: 4mm, dy: -6mm, box(width: 200mm, fill: pink, inset: 1.8mm)[
    #text(weight: "bold", size: 9.5pt)[#art(5, 5).h]
    #h(2mm)
    #text(size: 8pt)[#art(5, 5).paras.at(0)]
    #h(3mm)
    #ask(art(5, 5))
  ])
  #folio(6, orange)
]

// 7 カレンダー — 端まで罫を引き、余白の帯を残さない
#page(paper: "a4", margin: 0pt, fill: paper)[
  #place(top + left, rect(width: 210mm, height: 16mm, fill: orange))
  #place(top + left, dx: 4mm, dy: 3mm, text(fill: paper, font: "Zen Kaku Gothic New", weight: "black", size: 13pt)[#{data.month}月・11月の予定])
  #place(top + left, dx: 2mm, dy: 18mm, box(width: 206mm, height: 270mm)[
    #set text(size: 6.6pt)
    #set par(justify: false, leading: 0.28em, spacing: 0.15em)
    #let weeks = pg(6).weeks
    #let dows = ("日", "月", "火", "水", "木", "金", "土")
    #let rows = weeks.len() + 1
    #grid(
      columns: (1fr,) * 7,
      rows: (8mm,) + (1fr,) * weeks.len(),
      stroke: 0.4pt + orange,
      ..dows.enumerate().map(((di, name)) => align(center + horizon, box(fill: if di == 0 { orange } else if di == 6 { sky } else { leaf }, width: 100%, height: 100%)[
        #text(fill: paper, weight: "bold", size: 8pt)[#name]
      ])),
      ..weeks.map(w => w.map(day => box(width: 100%, height: 100%, inset: 0.6mm, fill: if not day.inRange { rgb("#f3e6c8") } else if day.dow == 0 or day.holiday { pink } else if day.events.len() > 0 { cream } else { sky })[
        #text(weight: "bold", fill: if day.dow == 0 or day.holiday { orange } else { ink }, size: 8pt)[#day.m/#day.d]
        #for ev in day.events [
          #linebreak()
          #text(size: 6.2pt)[#ev]
        ]
      ])).flatten(),
    )
  ])
  #place(bottom + left, rect(width: 210mm, height: 10mm, fill: leaf))
  #folio(7, orange)
]

// 8 裏表紙 — 広報ちよだ p16（色面とカットで下端まで埋める）
#page(paper: "a4", margin: 0pt, fill: sun)[
  #place(top + left, rect(width: 210mm, height: 36mm, fill: orange))
  #place(top + left, dx: 6mm, dy: 6mm)[
    #text(fill: paper, font: "BIZ UDPMincho", size: 20pt)[広報かすみのもり]
    #linebreak()
    #text(fill: paper, size: 9pt)[No.#data.no　#data.wareki#{data.monthNum}月#{data.day}日発行]
  ]
  #sun-ico(170mm, 4mm)
  #place(top + left, dx: 5mm, dy: 42mm, box(width: 125mm, height: 150mm, fill: paper, inset: 2.5mm)[
    #text(weight: "bold", fill: orange, size: 12pt)[お知らせ]
    #v(1mm)
    #set text(size: 8.5pt)
    #pg(7).note
  ])
  #place(top + right, dx: -5mm, dy: 42mm, box(width: 72mm, fill: sky, inset: 2mm, height: 150mm)[
    #text(weight: "bold", size: 10pt)[課の電話]
    #v(0.6mm)
    #set text(size: 6.4pt)
    #text[代表 #data.town.tel]
    #v(0.6mm)
    #for row in data.directory [
      #row.at(0)
      #h(1mm)
      #text(fill: orange)[#row.at(2)]
      #linebreak()
    ]
  ])
  #place(bottom + left, rect(width: 210mm, height: 78mm, fill: leaf))
  #place(bottom + left, dx: 6mm, dy: -70mm, box(width: 198mm)[
    #text(fill: paper, size: 8.5pt)[
      #data.town.office　#data.town.postalCode　#data.town.address \
      代表 #data.town.tel　FAX #data.town.fax \
      編集・発行　霞ノ杜町 政策推進課 広報情報係 \
      印刷　杜川印刷　再生紙・植物油インキ
    ]
  ])
  #rice(160mm, 230mm, turn: 8deg)
  #folio(8, orange)
]
