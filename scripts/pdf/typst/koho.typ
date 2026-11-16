// 広報かすみのもり。実在の町村広報（題字を写真に載せる、段組、お知らせ枠、隅のノンブル）に合わせる。
#let data = json(sys.inputs.data)
#let navy = rgb("#1a4d80")
#let navy-d = rgb("#12365c")
#let tint = rgb("#e7eef6")
#let line-c = rgb("#c5d0dc")
#let ink = rgb("#1a1a1a")
#let paper = rgb("#ffffff")
#let sunday = rgb("#9c2f2f")

#set text(font: "BIZ UDPGothic", size: 8.2pt, lang: "ja", fill: ink, cjk-latin-spacing: none)
#set par(justify: true, leading: 0.62em, spacing: 0.55em, linebreaks: "optimized")

#let runbar = {
  set text(size: 7.6pt)
  grid(
    columns: (1fr, auto),
    align: horizon,
    text(fill: navy, weight: "bold")[広報かすみのもり],
    [#data.wareki#{data.monthNum}月号　No.#data.no],
  )
  v(0.7mm)
  line(length: 100%, stroke: 0.7pt + navy)
}

#let page-footer = context {
  let p = counter(page).get().first()
  let num = box(fill: navy, inset: (x: 1.6mm, y: 0.4mm))[
    #text(fill: paper, weight: "bold", size: 8pt)[#p]
  ]
  set text(size: 7.6pt, fill: navy, weight: "bold")
  if calc.even(p) {
    align(left)[#num #h(2mm) 広報かすみのもり]
  } else {
    align(right)[広報かすみのもり #h(2mm) #num]
  }
}

#let toi-line(label) = {
  v(1mm)
  box(fill: navy-d, inset: (x: 1.3pt, y: 0.5pt))[#text(fill: paper, size: 7pt, weight: "bold")[問]]
  h(2.5pt)
  text(size: 7.2pt)[#label　#data.town.tel]
}

#let head(a, big: false) = {
  if a.kicker != none and a.kicker != "" [
    #box(fill: navy, inset: (x: 1.6mm, y: 0.5mm))[
      #text(fill: paper, size: 7pt, weight: "bold")[#a.kicker]
    ]
    #h(1.4mm)
  ]
  text(font: "Zen Kaku Gothic New", weight: "black", size: if big { 12.5pt } else { 10pt }, fill: navy-d)[#a.h]
  v(0.5mm)
  line(length: 100%, stroke: 0.8pt + navy)
  v(0.9mm)
}

#let render-table(t) = {
  if t == none { [] } else {
    v(0.8mm)
    if t.caption != none and t.caption != "" [
      #text(size: 7.4pt, weight: "bold")[#t.caption]
      #v(0.4mm)
    ]
    let n = t.headers.len()
    let cols = if n == 2 { (28mm, 1fr) } else if n == 3 { (24mm, 1fr, 26mm) } else if n == 4 { (22mm, 1fr, 22mm, 22mm) } else { (1fr,) * n }
    table(
      columns: cols,
      inset: (x: 1.4mm, y: 0.9mm),
      stroke: 0.3pt + line-c,
      fill: (_, y) => if y == 0 { navy } else if calc.odd(y) { tint } else { paper },
      table.header(..t.headers.map(h => text(fill: paper, size: 7.2pt, weight: "bold")[#h])),
      ..t.rows.map(row => row.map(c => text(size: 7.3pt)[#c])).flatten(),
    )
  }
}

#let render-bars(fig) = {
  let items = fig.items
  let max-v = calc.max(..items.map(i => i.value))
  v(0.6mm)
  if fig.caption != none and fig.caption != "" [
    #text(size: 7.4pt, weight: "bold")[#fig.caption]
    #v(0.4mm)
  ]
  for it in items [
    #grid(
      columns: (22mm, 1fr, auto),
      column-gutter: 1.2mm,
      align: horizon,
      text(size: 6.8pt)[#it.label],
      box(height: 2.6mm, width: 100%, fill: tint, {
        box(width: 100% * it.value / max-v, height: 100%, fill: navy)
      }),
      text(size: 6.8pt)[#str(it.value)#if fig.unit != none and fig.unit != "" [ #fig.unit]],
    )
    #v(0.3mm)
  ]
}

#let render-steps(fig) = {
  v(0.6mm)
  if fig.caption != none and fig.caption != "" [
    #text(size: 7.4pt, weight: "bold")[#fig.caption]
    #v(0.4mm)
  ]
  for (i, s) in fig.items.enumerate() [
    #grid(
      columns: (auto, 1fr),
      column-gutter: 1.6mm,
      align: horizon,
      box(fill: navy, inset: (x: 1.4mm, y: 0.3mm))[#text(fill: paper, size: 7pt, weight: "bold")[#i + 1]],
      text(size: 7.6pt)[#s],
    )
    #v(0.45mm)
  ]
}

#let render-figure(fig) = {
  if fig == none { [] }
  else if fig.type == "bars" { render-bars(fig) }
  else if fig.type == "steps" { render-steps(fig) }
  else { [] }
}

#let photo-block(path, caption, w) = {
  stack(spacing: 0.6mm,
    box(width: w, height: w * 0.72, clip: true, stroke: 0.3pt + line-c)[
      #image(path, width: w, height: w * 0.72, fit: "cover")
    ],
    if caption != none and caption != "" {
      block(width: w)[#text(size: 6.8pt)[▲ #caption]]
    },
  )
}

#let article-block(a, big: false, photo: none, caption: "", photo-w: 32mm) = {
  set par(spacing: 0.42em, leading: 0.55em)
  block(breakable: false, below: 0pt)[
    #head(a, big: big)
    #let paras = a.paras
    #let has-photo = photo != none and photo != "" and paras.len() > 0
    #if has-photo [
      #grid(
        columns: (1fr, photo-w),
        column-gutter: 2.2mm,
        align: top,
        paras.at(0),
        photo-block(photo, caption, photo-w),
      )
      #v(0.6mm)
      #for p in paras.slice(1) [
        #p
        #parbreak()
      ]
    ] else [
      #for p in paras [
        #p
        #parbreak()
      ]
    ]
    #if a.list != none and a.list.len() > 0 [
      #v(0.4mm)
      #for item in a.list [
        - #text(size: 7.6pt)[#item]
      ]
    ]
    #render-table(a.table)
    #render-figure(a.figure)
    #if a.toi != none and a.toi != "" [
      #toi-line(a.toi)
    ]
  ]
}

#let articles-flow(articles, feature: false, photo: none, caption: "") = {
  let photo-at = {
    let found = none
    for (i, a) in articles.enumerate() {
      if i >= 1 and a.table == none and a.figure == none {
        found = i
        break
      }
    }
    if found != none { found } else { if articles.len() > 1 { 1 } else { 0 } }
  }
  let cells = ()
  for (i, a) in articles.enumerate() {
    cells.push(article-block(
      a,
      big: feature and i == 0,
      photo: if i == photo-at { photo } else { none },
      caption: caption,
      photo-w: if feature { 34mm } else { 28mm },
    ))
  }
  if calc.odd(cells.len()) { cells.push([]) }
  grid(
    columns: (1fr, 1fr),
    column-gutter: 4.2mm,
    row-gutter: 3.2mm,
    ..cells,
  )
}

#let kurashi-card(it) = block(width: 100%, stroke: 0.35pt + navy, inset: (x: 1.8mm, y: 1.5mm))[
  #set par(justify: false, leading: 0.42em, spacing: 0.28em)
  #box(fill: navy, inset: (x: 1.3mm, y: 0.3mm))[
    #text(fill: paper, size: 6.6pt, weight: "bold")[#it.kicker]
  ]
  #v(0.45mm)
  #text(font: "Zen Kaku Gothic New", weight: "black", size: 8.6pt, fill: navy-d)[#it.h]
  #v(0.35mm)
  #text(size: 7.1pt)[#it.body]
  #toi-line(it.toi)
]

#let render-kurashi(pg) = {
  text(font: "Zen Kaku Gothic New", weight: "black", size: 13pt, fill: navy-d)[#pg.title]
  v(0.4mm)
  line(length: 100%, stroke: 0.8pt + navy)
  v(1.2mm)
  text(size: 7.6pt)[#pg.lead]
  v(2mm)
  grid(
    columns: (1fr, 1fr),
    column-gutter: 3.2mm,
    row-gutter: 2mm,
    ..pg.items.map(kurashi-card),
  )
  v(1fr)
  block(width: 100%, fill: tint, inset: (x: 2.5mm, y: 1.8mm))[
    #text(size: 7.4pt)[開庁は平日 8時30分から17時15分（土日祝日、12月29日から1月3日は休み）。代表 #data.town.tel]
  ]
}

#let cal-num(day) = {
  text(
    font: "Zen Kaku Gothic New",
    weight: "black",
    size: 8pt,
    fill: if not day.inRange { rgb("#b0b0b0") } else if day.dow == 0 or day.holiday { sunday } else if day.dow == 6 { navy } else { ink },
  )[#day.d]
}

#let render-calendar(pg) = {
  let weeks = pg.weeks
  text(font: "Zen Kaku Gothic New", weight: "black", size: 13pt, fill: navy-d)[くらしのカレンダー]
  v(0.4mm)
  line(length: 100%, stroke: 0.8pt + navy)
  v(1.4mm)
  text(size: 7.6pt)[#data.holiday]
  v(1.6mm)
  let dows = ("日", "月", "火", "水", "木", "金", "土")
  let h-cell = if weeks.len() <= 5 { 32mm } else { 27mm }
  grid(
    columns: (1fr,) * 7,
    stroke: 0.3pt + line-c,
    ..dows.enumerate().map(((di, name)) => block(
      width: 100%,
      fill: if di == 0 { sunday } else { navy },
      inset: (y: 0.8mm),
    )[
      #align(center, text(fill: paper, size: 7.4pt, weight: "bold")[#name])
    ]),
    ..weeks.map(w => w.map(day => block(
      width: 100%,
      height: h-cell,
      clip: true,
      fill: if day.inRange { paper } else { rgb("#f3f3f3") },
      inset: 1mm,
    )[
      #set par(justify: false, leading: 0.35em, spacing: 0.2em)
      #cal-num(day)
      #if day.inRange and day.events.len() > 0 [
        #v(0.5mm)
        #for ev in day.events [
          #text(size: 6.4pt)[#ev]
          #linebreak()
        ]
      ]
    ])).flatten(),
  )
}

#let render-back(pg) = {
  grid(
    columns: (1fr, 1fr),
    column-gutter: 5mm,
    [
      #text(font: "Zen Kaku Gothic New", weight: "black", size: 12pt, fill: navy-d)[お知らせ]
      #v(0.4mm)
      #line(length: 100%, stroke: 0.8pt + navy)
      #v(1.4mm)
      #text(size: 8pt)[#pg.note]
    ],
    [
      #text(font: "Zen Kaku Gothic New", weight: "black", size: 12pt, fill: navy-d)[課の電話]
      #v(0.4mm)
      #line(length: 100%, stroke: 0.8pt + navy)
      #v(1.2mm)
      #text(size: 7.4pt)[代表 #data.town.tel のあと、内線を伝えてください。]
      #v(1mm)
      #table(
        columns: (1.7fr, 0.45fr, 0.45fr),
        inset: (x: 1.2mm, y: 0.7mm),
        stroke: 0.3pt + line-c,
        fill: (_, y) => if y == 0 { navy } else { paper },
        table.header(
          text(fill: paper, size: 7pt, weight: "bold")[担当],
          text(fill: paper, size: 7pt, weight: "bold")[階],
          text(fill: paper, size: 7pt, weight: "bold")[内線],
        ),
        ..data.directory.map(row => (
          text(size: 6.6pt)[#row.at(0)],
          text(size: 6.6pt)[#row.at(1)],
          text(size: 6.6pt)[#row.at(2)],
        )).flatten(),
      )
    ],
  )
  v(3.5mm)
  block(width: 100%, stroke: (left: 1.4mm + navy), inset: (x: 3mm, y: 2.2mm))[
    #text(size: 7.6pt)[
      *役場の窓口*　平日 8時30分〜17時15分（土日祝日、12月29日〜1月3日は休み）。\
      #data.town.office　#data.town.postalCode　#data.town.address \
      代表 #data.town.tel　FAX #data.town.fax
    ]
  ]
  v(3mm)
  line(length: 100%, stroke: 0.6pt + navy)
  v(1.2mm)
  text(size: 7.2pt)[
    *広報かすみのもり*　No.#data.no　#{data.month}月号　#data.wareki#{data.monthNum}月#{data.day}日発行 \
    編集・発行　霞ノ杜町 政策推進課 広報情報係　#data.town.tel　FAX #data.town.fax \
    #data.town.postalCode　#data.town.address \
    印刷　杜川印刷　再生紙と植物油インキを使っています。毎月10日に、町内の全世帯へ届けています。
  ]
}

#let cover-index() = {
  let items = data.toc
  if items.len() == 0 { return }
  grid(
    columns: (1fr, 1fr),
    column-gutter: 4mm,
    row-gutter: 0.7mm,
    ..items.map(pair => text(size: 7.2pt)[#text(weight: "bold")[#pair.at(1)]　#pair.at(0)]),
  )
}

#if data.id == "koho-r8-10" {
  include "october-r8-10.typ"
} else {
let feat = data.pages.position(p => p.kind == "articles")

for (pi, pg) in data.pages.enumerate() {
  if pg.kind == "cover" [
    #page(paper: "a4", margin: 0pt, header: none, footer: none)[
      #place(top + left)[
        #box(width: 210mm, height: 297mm, clip: true)[
          #image(data.photo, width: 210mm, height: 297mm, fit: "cover")
        ]
      ]
      #place(top + left, dx: 8mm, dy: 8mm)[
        #block(fill: paper, inset: (x: 3.2mm, y: 2.6mm))[
          #text(font: "BIZ UDPMincho", size: 9pt, fill: navy)[広報]
          #v(0.2mm)
          #text(font: "BIZ UDPMincho", size: 20pt, fill: navy-d)[かすみのもり]
          #v(1mm)
          #text(size: 7.6pt)[#data.wareki#{data.monthNum}月#{data.day}日発行]
          #linebreak()
          #text(size: 8pt, weight: "bold")[No.#data.no]
          #h(2mm)
          #text(size: 8pt)[#data.mark]
        ]
      ]
      #place(top + right, dx: -8mm, dy: 8mm)[
        #block(fill: navy, inset: (x: 3.2mm, y: 1.6mm))[
          #align(center)[
            #text(font: "Zen Kaku Gothic New", weight: "black", fill: paper, size: 28pt)[#data.monthNum]
            #v(-1mm)
            #text(fill: paper, size: 8pt)[月号]
          ]
        ]
      ]
      #place(bottom + left)[
        #block(width: 210mm, fill: paper, inset: (x: 8mm, y: 4mm))[
          #text(size: 8pt, weight: "bold")[▲ #data.caption]
          #v(0.8mm)
          #text(font: "Zen Kaku Gothic New", weight: "black", size: 13pt, fill: navy-d)[#data.feature]
          #v(1.4mm)
          #cover-index()
        ]
      ]
    ]
  ] else if pg.kind == "articles" [
    #page(
      paper: "a4",
      margin: (top: 14mm, bottom: 12mm, x: 11mm),
      header: runbar,
      footer: page-footer,
    )[
      #articles-flow(
        pg.articles,
        feature: pi == feat,
        photo: pg.at("photo", default: none),
        caption: pg.at("photoCaption", default: ""),
      )
      #context if here().page() != pi + 1 { panic("紙面あふれ: " + data.id + " の " + str(pi + 1) + " ページ目") }
    ]
  ] else if pg.kind == "kurashi" [
    #page(
      paper: "a4",
      margin: (top: 14mm, bottom: 12mm, x: 11mm),
      header: runbar,
      footer: page-footer,
    )[
      #render-kurashi(pg)
      #context if here().page() != pi + 1 { panic("紙面あふれ: " + data.id + " の " + str(pi + 1) + " ページ目") }
    ]
  ] else if pg.kind == "calendar" [
    #page(
      paper: "a4",
      margin: (top: 14mm, bottom: 12mm, x: 10mm),
      header: runbar,
      footer: page-footer,
    )[
      #render-calendar(pg)
      #context if here().page() != pi + 1 { panic("紙面あふれ: " + data.id + " の " + str(pi + 1) + " ページ目") }
    ]
  ] else if pg.kind == "back" [
    #page(
      paper: "a4",
      margin: (top: 14mm, bottom: 12mm, x: 11mm),
      header: runbar,
      footer: page-footer,
    )[
      #render-back(pg)
      #context if here().page() != pi + 1 { panic("紙面あふれ: " + data.id + " の " + str(pi + 1) + " ページ目") }
    ]
  ] else {
    panic("未知のページ: " + pg.kind)
  }
}
}
