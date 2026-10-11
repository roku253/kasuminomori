// 地域安全通信。題字・回覧欄・2段・連絡欄・奥付は、もとの HTML 組版の寸法に合わせる。
#let data = json(sys.inputs.data)
#let navy = rgb("#1f4b7a")
#let tint = rgb("#e6edf5")
#let tint2 = rgb("#f3f6fa")
#let rule = rgb("#8b98a8")

#set text(font: "BIZ UDPGothic", size: 9.4pt, lang: "ja")
#set par(justify: false, leading: 0.82em, spacing: 0.65em)
#set block(spacing: 0pt)
#let circled = ("①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩")

#let rich(parts) = {
  for p in parts {
    if p.strong { strong(p.text) } else { p.text }
  }
}

#let toi(label) = {
  v(1.2mm)
  box(fill: black, inset: (x: 1.4pt, y: 0.6pt))[#text(fill: white, size: 7.4pt, weight: "bold")[問]]
  h(3pt)
  text(size: 8pt)[#label]
}

// 略図の上に、許可した字体で地名を載せる（SVG の中に文字を置くと別の字体名になる）。
#let pin(x, y, body, mid: false) = {
  if mid {
    place(center + horizon, dx: x * 100% - 50%, dy: y * 100% - 50%, body)
  } else {
    place(left + horizon, dx: x * 100%, dy: y * 100% - 50%, body)
  }
}

#let bang(x, y, light: true) = {
  pin(x, y, text(size: 6.4pt, weight: "bold", fill: if light { rgb("#fff") } else { black })[!], mid: true)
}

#let map-fig() = {
  block(width: 100%, inset: 1.6mm, stroke: 0.3mm + rule, radius: 1mm)[
    #box(width: 100%)[
      #image("/scripts/pdf/typst/anzen-map.svg", width: 100%)
      #bang(97.5 / 300, 177.5 / 236)
      #bang(149.5 / 300, 175.5 / 236)
      #bang(103.5 / 300, 119.5 / 236)
      #bang(195.5 / 300, 133.5 / 236)
      #bang(129.5 / 300, 145.5 / 236, light: false)
      #bang(241.5 / 300, 91.5 / 236, light: false)
      #pin(186 / 300, 59.5 / 236, text(size: 8pt, weight: "bold")[立入禁止区域], mid: true)
      #pin(206 / 300, 168 / 236, text(size: 7.4pt)[烏啼山道])
      #pin(50 / 300, 146 / 236, text(size: 7.4pt)[柵])
      #pin(40 / 300, 200 / 236, text(size: 7.4pt)[林道])
      #pin(10 / 300, 214 / 236, text(size: 6.6pt)[← 杜ケ丘地区の集落へ])
      #pin(270 / 300, 190 / 236, text(size: 7.6pt)[杜川])
      #pin(26 / 300, 12 / 236, text(size: 7pt, weight: "bold")[北], mid: true)
    ]
    #v(1.2mm)
    #set text(size: 6.6pt)
    #grid(
      columns: (3.4mm, auto, 4.2mm, auto, 4.2mm, auto, 4.2mm, auto),
      column-gutter: 0.7mm,
      align: horizon,
      box(width: 3.4mm, height: 2.2mm, fill: tint, stroke: 0.5pt + navy),
      [立入禁止区域],
      line(length: 4mm, stroke: (paint: black, thickness: 0.7pt, dash: "dashed")),
      [山道],
      line(length: 4mm, stroke: 1.1pt + black),
      [柵],
      line(length: 4mm, stroke: (paint: black, thickness: 0.6pt, dash: "dotted")),
      [ロープ],
    )
    #v(1.6mm)
    #grid(
      columns: (2.2mm, auto, 2.2mm, auto),
      column-gutter: 0.8mm,
      align: horizon,
      box(width: 2.2mm, height: 2.2mm, fill: black),
      [看板（8月に増設）],
      box(width: 2.2mm, height: 2.2mm, fill: white, stroke: 0.6pt + black),
      [看板（以前から）],
    )
    #v(1.8mm)
    #block(width: 100%)[
      #set par(leading: 0.45em, spacing: 0pt)
      #text(size: 7.6pt)[図　立入禁止区域（烏啼山道）の概略。縮尺は正確ではありません。区域の境には柵とロープ、入口と山道沿いに看板があります。]
    ]
  ]
}

#let colspec(b) = {
  let n = if b.head.len() > 0 { b.head.len() } else { b.rows.at(0).len() }
  if b.widths.len() == n {
    b.widths.map(w => float(w.trim("%")) * 1%)
  } else {
    range(n).map(_ => 1fr)
  }
}

#let show-block(b) = {
  if b.t == "p" {
    block(spacing: 3.4mm)[
      #set par(justify: true, leading: if b.at("lead", default: false) { 0.95em } else { 0.9em })
      #text(size: if b.at("lead", default: false) { 10.2pt } else { 9.4pt })[#rich(b.parts)]
    ]
  } else if b.t == "list" {
    block(spacing: 1.6mm)[
      #set par(leading: 0.72em)
      #for (i, item) in b.items.enumerate() {
        block(spacing: 1.3mm)[
          #grid(
            columns: (5mm, 1fr),
            column-gutter: 0.8mm,
            text(weight: "bold")[#if b.ordered { circled.at(i) } else { [・] }],
            item,
          )
        ]
      }
    ]
  } else if b.t == "table" {
    block(spacing: 1.5mm)[
      #if b.caption != "" {
        text(size: 8.8pt, weight: "bold")[#b.caption]
        v(0.8mm)
      }
      #table(
        columns: colspec(b),
        inset: (x: 1.6mm, y: 0.7mm),
        stroke: 0.3mm + rgb("#555"),
        align: top + left,
        fill: (x, y) => if y == 0 and b.head.len() > 0 { tint } else if x == 0 and b.head.len() == 0 { tint2 },
        ..if b.head.len() > 0 {
          (table.header(..b.head.map(c => align(center, text(weight: "bold", size: 8.6pt)[#c]))),)
        } else {
          ()
        },
        ..b.rows
          .enumerate()
          .map(pair => {
            let row = pair.at(1)
            row.enumerate().map(cell => {
              let ci = cell.at(0)
              let c = cell.at(1)
              let bold = b.head.len() == 0 and ci == 0
              let h = if c.a == "r" { right } else if c.a == "c" { center } else { left }
              align(h)[#text(size: 8.6pt, weight: if bold { "bold" } else { "regular" })[#c.t]]
            })
          })
          .flatten(),
      )
    ]
  } else if b.t == "box" {
    block(spacing: 1.5mm)[
      #block(
        width: 100%,
        inset: (x: 2.6mm, y: 2mm),
        stroke: (if b.warn { 0.6mm } else { 0.35mm }) + if b.warn { black } else { rule },
        radius: 1mm,
        fill: if b.warn { white } else { tint2 },
      )[
        #text(weight: "bold", size: 10pt)[#b.title]
        #v(1mm)
        #for (i, item) in b.items.enumerate() {
          block(spacing: 1.2mm)[
            #set par(leading: 0.65em)
            #grid(
              columns: (5mm, 1fr),
              column-gutter: 1.2mm,
              text(weight: "bold")[#if b.warn { circled.at(i) } else { [・] }],
              item,
            )
          ]
        }
      ]
    ]
  } else if b.t == "toi" {
    toi(b.text)
    v(0.4mm)
  } else if b.t == "map" {
    map-fig()
  }
}

#let art(a) = {
  v(4.6mm)
  block(
    width: 100%,
    inset: (left: if a.small { 2.6mm } else { 3mm }, y: if a.small { 1mm } else { 1.4mm }),
    fill: tint,
    stroke: (left: (if a.small { 1.8mm } else { 2.2mm }) + navy),
  )[
    #if a.kicker != "" {
      grid(
        columns: (auto, 1fr),
        column-gutter: 2.4mm,
        align: horizon,
        box(fill: black, inset: (x: 1.8mm, y: 0.3mm), radius: 0.6mm)[
          #text(fill: white, size: 8.4pt, weight: "bold", tracking: 0.05em)[#a.kicker]
        ],
        text(size: if a.small { 11.6pt } else { 13.5pt }, weight: "bold")[#a.title],
      )
    } else {
      text(size: if a.small { 11.6pt } else { 13.5pt }, weight: "bold")[#a.title]
    }
  ]
  if a.sub != "" {
    v(1.6mm)
    text(weight: "bold", size: 10pt)[#a.sub]
  }
  v(1.6mm)
  for b in a.body { show-block(b) }
}

#let pieces(items) = {
  for a in items {
    if a.at("grid", default: none) != none {
      grid(columns: (1fr, 1fr), column-gutter: 5mm, ..a.grid.map(x => art(x)))
    } else {
      art(a)
    }
  }
}

#page(paper: "a4", margin: (top: 10mm, bottom: 15mm, x: 12mm))[
  #grid(
    columns: (1fr, 58mm),
    rows: (34mm,),
    column-gutter: 4mm,
    block(width: 100%, height: 100%, fill: navy, inset: (x: 5mm, y: 2.8mm), radius: 1.2mm)[
      #set par(spacing: 0pt, leading: 0.65em)
      #block(spacing: 2.2mm)[
        #text(fill: white, size: 8.6pt, tracking: 0.06em)[#data.tagline]
      ]
      #block(spacing: 2.8mm)[
        #text(fill: white, size: 26pt, weight: "bold", tracking: 0.06em)[地域安全通信]
      ]
      #text(fill: white, size: 9.2pt, weight: "bold")[
        #text(size: 12.5pt)[第#data.no\号]
        #h(3mm)
        #data.month
        #h(3mm)
        #data.date\発行
      ]
    ],
    block(width: 100%, height: 100%, stroke: 0.5mm + black, inset: (x: 2mm, y: 1.6mm), radius: 1mm)[
      #grid(
        columns: (1fr, auto),
        align: horizon,
        text(size: 15pt, weight: "bold", tracking: 0.3em)[回覧],
        text(size: 7.4pt)[見たら印を押して次へ],
      )
      #v(1.4mm)
      #table(
        columns: (1fr, 1fr, 1fr),
        rows: (4.6mm, 11mm),
        inset: 1pt,
        stroke: 0.3mm + rgb("#444"),
        fill: (x, y) => if y == 0 { rgb("#eee") },
        align: center + horizon,
        text(size: 7.6pt)[区長], text(size: 7.6pt)[組長], text(size: 7.6pt)[各戸], [], [], [],
      )
    ],
  )
  #v(1.8mm)
  #grid(
    columns: (1fr, auto),
    text(size: 8pt)[#strong[発行]　#data.publisher],
    text(size: 8pt)[#strong[協力]　#data.cooperation],
  )
  #v(1.2mm)
  #line(length: 100%, stroke: 0.4mm + black)

  #v(3.6mm)
  #block(width: 100%, inset: (left: 3.4mm, y: 2mm), fill: tint, stroke: (left: 2.2mm + navy))[
    #text(size: 15pt, weight: "bold")[#data.top.title]
  ]
  #v(2.6mm)
  #if data.top.aside.len() > 0 {
    grid(
      columns: (1fr, 78mm),
      column-gutter: 5mm,
      { for b in data.top.body { show-block(b) } },
      { for b in data.top.aside { show-block(b) } },
    )
  } else {
    for b in data.top.body { show-block(b) }
  }
  #pieces(data.rest)
]

#page(paper: "a4", margin: (top: 10mm, bottom: 15mm, x: 12mm))[
  #grid(
    columns: (1fr, auto),
    align: horizon,
    text(size: 8pt)[#text(size: 9.6pt, weight: "bold", fill: navy)[地域安全通信]　第#data.no\号（#data.month）],
    text(size: 8pt)[#data.date\発行],
  )
  #v(1mm)
  #line(length: 100%, stroke: 0.4mm + navy)
  #grid(
    columns: (1fr, 1fr),
    column-gutter: 6mm,
    pieces(data.left),
    pieces(data.right),
  )
  #v(3mm)
  #block(stroke: 0.5mm + black, radius: 1.2mm, clip: true, width: 100%)[
    #table(
      columns: (62mm, 1fr),
      stroke: none,
      inset: 0pt,
      fill: (x, y) => if x == 0 { black },
      align: horizon + left,
      pad(x: 3mm, y: 2.2mm)[
        #set text(fill: white, weight: "bold", size: 9pt)
        #set par(leading: 0.35em)
        事件・事故は　#text(size: 13pt)[110番] \
        火事・救急は　#text(size: 13pt)[119番]
      ],
      pad(x: 3mm, y: 1.8mm)[
        #set text(size: 8.4pt)
        #set par(leading: 0.42em, spacing: 0.35em)
        #rich(data.contact.at(0))
        #parbreak()
        #text(weight: "bold")[#data.office]
      ],
    )
  ]
  #v(1.6mm)
  #align(center, text(size: 9pt, weight: "bold", tracking: 0.06em)[回覧が終わりましたら、次の方へお回しください。])
  #v(2mm)
  #line(length: 100%, stroke: 0.25mm + rgb("#777"))
  #v(1.2mm)
  #grid(
    columns: (1fr, auto),
    column-gutter: 4mm,
    text(size: 7.4pt)[
      地域安全通信　第#data.no\号（#data.month）　#data.date\発行 \
      編集・発行　#data.publisher \
      #data.town.postalCode　#data.town.address（#data.town.office\内）　電話 #data.town.tel（代表）
    ],
    align(right + top, text(size: 7.4pt)[この通信は再生紙を使用しています。]),
  )
  #place(bottom + right, dy: 6mm, text(size: 9pt, weight: "bold")[2])
]
