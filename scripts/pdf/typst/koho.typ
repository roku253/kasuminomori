// 広報かすみのもり。データは prepare.mjs が書いた JSON。
#let data = json(sys.inputs.data)
#let green = rgb("#1f8f3a")
#let green-d = rgb("#146b2c")
#let ink = rgb("#1a1a1a")

#set text(font: "BIZ UDPGothic", size: 8.6pt, lang: "ja", fill: ink)
#set par(justify: true, leading: 0.65em, spacing: 0.72em)

#let display(body, size: 22pt) = text(font: "Zen Kaku Gothic New", weight: "black", size: size, fill: green-d, body)

#let tel-icon = box(width: 8pt, height: 8pt, baseline: 1.5pt, {
  place(dx: 0.6pt, dy: 0.6pt, circle(radius: 3.6pt, stroke: 0.7pt + green))
  place(dx: 2.4pt, dy: 2.6pt, rotate(-40deg, rect(width: 2.4pt, height: 4.2pt, radius: 1pt, fill: green)))
})

#let runbar = {
  set text(size: 8pt)
  grid(
    columns: (1fr, auto),
    align(left, text(fill: green-d, weight: "bold")[広報かすみのもり　#data.month 月10日発行]),
    align(right)[#tel-icon #h(2pt) #data.town.office　#data.town.tel],
  )
  v(1.2mm)
  line(length: 100%, stroke: 0.7mm + green)
}

#let num-h(n, title) = {
  box(circle(radius: 7.2pt, fill: green, align(center + horizon, text(fill: white, size: 8pt, weight: "bold", font: "Zen Kaku Gothic New")[#n])))
  h(4pt)
  text(font: "Zen Kaku Gothic New", weight: "black", size: 13pt, fill: green-d)[#title]
}

#let article(a, n) = {
  align(right, box(fill: green, inset: (x: 5pt, y: 2pt), text(fill: white, size: 7.4pt, weight: "bold")[#a.dept]))
  v(0.8mm)
  num-h(n, a.h)
  v(1.4mm)
  for p in a.paras [
    #p
    #parbreak()
  ]
  if a.toi != "" [
    #v(0.6mm)
    #box(inset: (x: 1.5pt, y: 1pt), fill: black, text(fill: white, size: 7.2pt, weight: "bold")[問])
    #h(3pt)
    #text(size: 7.6pt)[#tel-icon #h(2pt) #a.toi]
  ]
  v(3.2mm)
}

#let toc-item(label, pg) = {
  grid(
    columns: (auto, 1fr, auto),
    column-gutter: 1.5mm,
    align: bottom,
    [#box(width: 2.1mm, height: 2.1mm, fill: green) #h(1.2mm) #text(size: 8pt, weight: "bold")[#label]],
    box(width: 100%, repeat(justify: true, gap: 0pt)[・]),
    text(size: 8pt, weight: "bold", fill: green-d)[#pg],
  )
}

// ----- 表紙 -----
#page(paper: "a4", margin: 0pt, header: none, footer: none)[
  #block(width: 100%, height: 52mm, inset: (x: 12mm, top: 7mm, bottom: 1mm))[
    #grid(
      columns: (1fr, 26mm),
      column-gutter: 4mm,
      align: bottom,
      [
        #text(size: 8pt, fill: green-d, weight: "bold", tracking: 0.12em)[霞ノ杜町]
        #v(0.4mm)
        #text(size: 9pt, fill: green, tracking: 0.28em)[かすみのもり]
        #v(0.6mm)
        #text(font: "Zen Kaku Gothic New", weight: "black", size: 28pt, fill: ink)[広報 #h(2mm) かすみのもり]
      ],
      align(center, circle(
        radius: 12.5mm,
        fill: green,
        align(center + horizon)[
          #set text(fill: white, font: "Zen Kaku Gothic New")
          #text(size: 7.5pt, weight: "bold")[#data.year] \
          #text(size: 14pt, weight: "black")[#data.monthNum\.#data.day] \
          #text(size: 7pt)[No.#data.no]
        ],
      )),
    )
    #v(2.2mm)
    #text(size: 8pt, weight: "bold", fill: green-d, tracking: 0.16em)[Contents]
    #v(1mm)
    #grid(
      columns: (1fr, 1fr),
      column-gutter: 5mm,
      row-gutter: 1.1mm,
      ..{
        let items = ()
        for (i, g) in data.groups.enumerate() {
          items.push(toc-item(g.at(0).h, str(i + 2)))
        }
        let cal = data.groups.len() + 2
        items.push(toc-item("くらしのカレンダー", str(cal)))
        items.push(toc-item("人口・奥付", str(cal + 1)))
        items
      },
    )
  ]
  #place(top + left, dy: 52mm)[
    #box(width: 210mm, height: 245mm, clip: true)[
      #image(data.photo, width: 210mm, height: 245mm, fit: "cover")
      #place(bottom + left)[
        #block(width: 210mm, inset: (x: 12mm, y: 7mm), fill: rgb(8, 40, 18, 55%))[
          #text(fill: white, size: 11pt, weight: "bold")[#data.mark]
          #v(1mm)
          #text(font: "Zen Kaku Gothic New", weight: "black", fill: white, size: 26pt, stroke: 0.7pt + rgb("#123a86"))[#data.feature]
          #v(1.2mm)
          #text(fill: white, size: 8pt)[写真　#data.caption #if data.note != "" [　#data.note]]
        ]
      ]
    ]
  ]
]

// ----- 中面 -----
#for group in data.groups [
  #page(
    paper: "a4",
    margin: (top: 14mm, bottom: 16mm, x: 11mm),
    header: runbar,
    footer: context {
      let p = counter(page).get().first()
      align(if calc.odd(p) { right } else { left })[
        #circle(radius: 8pt, fill: green, align(center + horizon, text(fill: white, size: 8pt, weight: "bold")[#p]))
      ]
    },
    background: place(bottom + left, dx: 11mm, dy: -7mm, box(width: 188mm, height: 3mm, {
      // 下端の緑の点
    })),
  )[
    #place(bottom + left, dx: 0mm, dy: 2mm)[
      #box(width: 100%, height: 3.2mm)[#repeat(gap: 1.6mm)[#box(circle(radius: 1.05pt, fill: green))]]
    ]
    #grid(
      columns: (1fr, 1fr),
      column-gutter: 5mm,
      ..{
        let cells = ()
        for (i, a) in group.enumerate() {
          cells.push(article(a, i + 1))
        }
        if calc.odd(group.len()) { cells.push([]) }
        cells
      },
    )
  ]
]

#page(
  paper: "a4",
  margin: (top: 14mm, bottom: 16mm, x: 11mm),
  header: runbar,
  footer: context {
    let p = counter(page).get().first()
    align(left)[#circle(radius: 8pt, fill: green, align(center + horizon, text(fill: white, size: 8pt, weight: "bold")[#p]))]
  },
)[
  #align(right, box(fill: green, inset: (x: 5pt, y: 2pt), text(fill: white, size: 7.4pt, weight: "bold")[広報情報係]))
  #num-h[●][くらしのカレンダー]
  #v(2mm)
  #table(
    columns: (1fr, 2fr),
    inset: 4pt,
    stroke: 0.3pt + rgb("#8aa88e"),
    fill: (_, y) => if y == 0 { rgb("#e7f6ea") },
    table.header([日], [予定]),
    ..data.calRows.map(row => (row.at(0), row.at(1))).flatten(),
  )
  #v(2mm)
  #text(size: 8pt)[#data.holiday　表の日は、この号で案内している日です。]
]

#page(
  paper: "a4",
  margin: (top: 14mm, bottom: 16mm, x: 11mm),
  header: runbar,
  footer: context {
    let p = counter(page).get().first()
    align(right)[#circle(radius: 8pt, fill: green, align(center + horizon, text(fill: white, size: 8pt, weight: "bold")[#p]))]
  },
)[
  #grid(
    columns: (1fr, 1fr),
    column-gutter: 5mm,
    [
      #num-h[1][人口]
      #v(1.2mm)
      #data.population
      #v(3mm)
      #text(size: 8pt)[この広報紙は、毎月10日に町内の全世帯へお届けしています。]
    ],
    [
      #num-h[2][課の電話]
      #v(1.2mm)
      #text(size: 8pt)[代表 #data.town.tel のあと、内線を伝えてください。]
      #v(1mm)
      #table(
        columns: (1.6fr, 0.5fr, 0.5fr),
        inset: 3pt,
        stroke: 0.3pt + rgb("#8aa88e"),
        fill: (_, y) => if y == 0 { rgb("#e7f6ea") },
        table.header(text(size: 7.4pt, weight: "bold")[担当], text(size: 7.4pt, weight: "bold")[階], text(size: 7.4pt, weight: "bold")[内線]),
        ..data.directory.map(row => (text(size: 7.2pt)[#row.at(0)], text(size: 7.2pt)[#row.at(1)], text(size: 7.2pt)[#row.at(2)])).flatten(),
      )
    ],
  )
  #v(1fr)
  #line(length: 100%, stroke: 0.4mm + green)
  #v(1.2mm)
  #text(size: 7.6pt)[
    *広報かすみのもり*　No.#data.no　#data.month 月号　#data.year 年#data.monthNum 月#data.day 日発行 \
    編集・発行　霞ノ杜町 政策推進課 広報情報係　電話 #data.town.tel（代表・内線244）　FAX #data.town.fax \
    #data.town.postalCode　#data.town.address \
    印刷　霞ノ杜印刷　再生紙を使用しています。毎月10日に町内の全世帯へお届けしています。
  ]
]
