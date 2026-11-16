// 広報かすみのもり。データは prepare.mjs が書いた JSON（pages 配列を上から描く）。
#let data = json(sys.inputs.data)
#let green-d = rgb("#2f5d34")
#let green = rgb("#4f8a3c")
#let wakaba = rgb("#9cc54a")
#let usu = rgb("#eaf3dc")
#let cha = rgb("#8a5a32")
#let kinari = rgb("#f7efdd")
#let ink = rgb("#1a1a1a")
#let white = rgb("#ffffff")
#let table-stroke = 0.3pt + green.lighten(45%)
#let table-fill = usu

#let RIBBON = ("行事", "募集", "文化", "講座", "図書館", "教室", "説明会", "子ども", "相談")

#set text(font: "BIZ UDPGothic", size: 8.6pt, lang: "ja", fill: ink, cjk-latin-spacing: none)
#set par(justify: true, leading: 0.72em, spacing: 0.78em, linebreaks: "optimized")

#let tel-icon = box(width: 8pt, height: 8pt, baseline: 0.15em)[
  #align(center + horizon, text(font: "BIZ UDPGothic", size: 8pt, fill: green)[☎])
]

#let runbar = {
  set text(size: 8pt)
  pad(top: 3mm)[
    #grid(
      columns: (1fr, auto),
      align: horizon,
      text(fill: green-d, weight: "bold")[広報かすみのもり　#{data.month}月10日発行],
      [#tel-icon #h(3pt) #data.town.office　#data.town.tel],
    )
    #v(1.1mm)
    #line(length: 100%, stroke: 0.7mm + green)
    #v(0.4mm)
    #line(length: 100%, stroke: 0.3mm + wakaba)
  ]
}

#let page-footer = context {
  let p = counter(page).get().first()
  set text(size: 8pt, fill: green-d)
  grid(
    columns: (1fr, auto, 1fr),
    align: horizon,
    if calc.even(p) { text(weight: "bold")[広報かすみのもり] } else { [] },
    text[#p],
    align(right, if calc.odd(p) { text(weight: "bold")[広報かすみのもり] } else { [] }),
  )
}

#let dot-row = place(bottom + left, dx: 0mm, dy: 2mm)[
  #box(width: 100%, height: 3.2mm)[#repeat(gap: 1.6mm)[#box(circle(radius: 1.05pt, fill: wakaba))]]
]

#let toc-item(label, pg) = {
  grid(
    columns: (auto, 1fr, auto),
    column-gutter: 1.5mm,
    align: bottom,
    [#box(width: 2.1mm, height: 2.1mm, fill: wakaba) #h(1.2mm) #text(size: 8pt, weight: "bold")[#label]],
    box(width: 100%, repeat(justify: true, gap: 2.2pt)[#text(size: 6.5pt, fill: green)[・]]),
    text(size: 8pt, weight: "bold", fill: green-d)[#pg],
  )
}

#let ribbon(body, size: 11.5pt) = layout(sz => {
  let inner = block(width: sz.width - 10.4mm,
    text(font: "Zen Maru Gothic", weight: "bold", size: size, fill: white)[#body])
  let h = measure(inner).height + 3mm
  block(width: sz.width, height: h + 1.2mm, {
    place(top + left, dy: 1.2mm, polygon(fill: cha.darken(15%),
      (0mm, 0mm), (4mm, 0mm), (4mm, h), (0mm, h), (1.6mm, h / 2)))
    place(top + right, dy: 1.2mm, polygon(fill: cha.darken(15%),
      (0mm, 0mm), (4mm, 0mm), (2.4mm, h / 2), (4mm, h), (0mm, h)))
    place(top + left, dx: 2.4mm, dy: h, polygon(fill: cha.darken(35%),
      (0mm, 0mm), (1.6mm, 0mm), (1.6mm, 1.2mm)))
    place(top + right, dx: -2.4mm, dy: h, polygon(fill: cha.darken(35%),
      (0mm, 0mm), (1.6mm, 0mm), (0mm, 1.2mm)))
    place(top + left, dx: 2.4mm, rect(width: sz.width - 4.8mm, height: h, fill: cha,
      inset: (x: 2.8mm, y: 1.5mm), align(horizon, inner)))
  })
})

#let head-a(a) = {
  v(0.4mm)
  block(
    width: 100%,
    fill: green-d,
    inset: (left: 3.2mm, right: 2.4mm, y: 2.6mm),
    radius: (top-right: 2.4mm),
    stroke: (left: 1.6mm + wakaba),
  )[
    #if a.kicker != none and a.kicker != "" [
      #text(font: "Zen Maru Gothic", weight: "bold", size: 7.6pt, fill: wakaba)[#a.kicker]
      #v(0.5mm)
    ]
    #text(font: "Zen Maru Gothic", weight: "black", size: 11.5pt, fill: white)[#a.h]
  ]
  v(0.8mm)
}

#let head-b(a) = {
  if a.kicker != none and a.kicker != "" [
    #text(font: "BIZ UDPGothic", weight: "bold", size: 7.6pt, fill: cha)[#a.kicker]
    #v(0.4mm)
  ]
  block(width: 100%, fill: cha, inset: (x: 2.4mm, y: 1.4mm))[
    #text(font: "BIZ UDPGothic", weight: "bold", size: 11pt, fill: white)[#a.h]
  ]
  v(0.8mm)
}

#let head-c(a, i) = {
  let bg = if calc.odd(i + 1) { usu } else { kinari }
  let fg = if calc.odd(i + 1) { green-d } else { cha }
  block(width: 100%, fill: bg, radius: 2.4mm, inset: (x: 3mm, y: 1.6mm))[
    #if a.kicker != none and a.kicker != "" [
      #box(fill: green, radius: 1.2mm, inset: (x: 3pt, y: 1.5pt))[
        #text(font: "Zen Maru Gothic", weight: "bold", size: 7.4pt, fill: white)[#a.kicker]
      ]
      #v(0.5mm)
    ]
    #text(font: "Zen Maru Gothic", weight: "bold", size: 11pt, fill: fg)[#a.h]
  ]
  v(0.5mm)
}

#let head-d(a, big) = {
  v(1.4mm)
  if a.kicker != none and a.kicker != "" [
    #box(fill: cha, radius: 1.2mm, inset: (x: 4pt, y: 2pt))[
      #text(font: "Zen Maru Gothic", weight: "bold", size: 7.4pt, fill: white)[#a.kicker]
    ]
    #v(1.2mm)
  ]
  if big {
    text(font: "Kiwi Maru", weight: "medium", size: 16pt, fill: green-d)[#a.h]
  } else {
    text(font: "Zen Maru Gothic", weight: "black", size: 12pt, fill: green-d)[#a.h]
  }
  v(1mm)
  line(length: 100%, stroke: 1.4pt + wakaba)
  v(1.2mm)
}

#let catch-of(k) = {
  if k == none or k == "" { "おしらせ" }
  else if k == "安全" { "要注意" }
  else if k == "税" { "期限あり" }
  else if k == "健康" or k == "予防接種" { "知っ得" }
  else if k == "募集" or k == "講座" or k == "教室" { "募集中" }
  else if k == "行事" or k == "文化" { "出かけよう" }
  else { k }
}

#let catch-pill(k) = box(
  fill: cha,
  radius: 2pt,
  inset: (x: 5pt, y: 2pt),
)[
  #text(font: "Zen Maru Gothic", weight: "bold", size: 8pt, fill: white)[#catch-of(k)]
]

#let head-hero(a, size: 20pt) = {
  v(0.6mm)
  catch-pill(a.at("kicker", default: none))
  v(1.4mm)
  text(font: "Zen Kaku Gothic New", weight: "black", size: size, fill: green-d, tracking: -0.01em)[#a.h]
  v(1.3mm)
  line(length: 100%, stroke: 1.6pt + wakaba)
  v(1.6mm)
}

#let head-type(i, kicker, feature, ribbons) = {
  if i == 0 and feature { "D" }
  else if i == 0 { "A" }
  else if kicker != none and RIBBON.contains(kicker) and ribbons < 2 { "B" }
  else if i == 3 and not feature { "D" }
  else { "C" }
}

#let render-table(t, inset: 3pt, head-size: 7.4pt, body-size: 7.6pt) = {
  if t == none { [] }
  else {
    let n = t.headers.len()
    let head-cell(h) = text(size: head-size, weight: "bold")[#h]
    let body-cell(c) = text(size: body-size)[#c]
    // 時刻（15時10分など）は行の途中で分けない
    show regex("\d{1,2}時(?:\d{1,2}分)?"): it => box(it)
    v(0.8mm)
    if t.caption != none and t.caption != "" [
      #text(size: 7.6pt, weight: "bold")[#t.caption]
      #v(0.6mm)
    ]
    layout(sz => {
      // 列ごとに、折り返さないときの幅を測る（見出しも含む）
      let natural = range(n).map(j => calc.max(
        measure(head-cell(t.headers.at(j))).width,
        ..t.rows.map(row => measure(body-cell(row.at(j, default: ""))).width),
      ) + 2 * inset + 1pt)
      // 表の幅の3割に収まる列は中身の幅で固定し、残りを伸ばす
      let narrow = natural.map(w => w <= sz.width * 0.3)
      if narrow.all(x => x) {
        let widest = natural.position(w => w == calc.max(..natural))
        narrow = narrow.enumerate().map(((j, x)) => j != widest)
      }
      let fixed = natural.zip(narrow).filter(((w, x)) => x).map(((w, x)) => w).sum(default: 0pt)
      let cols = if fixed > sz.width * 0.75 { (1fr,) * n } else {
        natural.zip(narrow).map(((w, x)) => if x { w } else { 1fr })
      }
      table(
        columns: cols,
        inset: inset,
        stroke: table-stroke,
        fill: (_, y) => if y == 0 { table-fill },
        table.header(..t.headers.map(head-cell)),
        ..t.rows.map(row => row.map(body-cell)).flatten(),
      )
    })
  }
}

#let render-bars(fig) = {
  let items = fig.items
  let max-v = calc.max(..items.map(i => i.value))
  v(0.5mm)
  if fig.caption != none and fig.caption != "" [
    #text(size: 7.4pt, weight: "bold")[#fig.caption]
    #v(0.4mm)
  ]
  for it in items [
    #grid(
      columns: (20mm, 1fr, auto),
      column-gutter: 1.5mm,
      align: horizon,
      text(size: 7.2pt)[#it.label],
      box(height: 3.4mm, width: 100%, fill: usu, {
        box(width: 100% * it.value / max-v, height: 100%, fill: green)
      }),
      text(size: 7.2pt)[#str(it.value)#if fig.unit != none and fig.unit != "" [ #fig.unit]],
    )
    #v(0.35mm)
  ]
}

#let render-steps(fig) = {
  v(0.8mm)
  if fig.caption != none and fig.caption != "" [
    #text(size: 7.6pt, weight: "bold")[#fig.caption]
    #v(0.6mm)
  ]
  for (i, s) in fig.items.enumerate() [
    #grid(
      columns: (auto, 1fr),
      column-gutter: 2.5mm,
      align: horizon,
      box(circle(radius: 6pt, fill: green, align(center + horizon, text(fill: white, size: 7.2pt, weight: "bold")[#i + 1]))),
      text(size: 8.6pt)[#s],
    )
    #v(0.7mm)
  ]
}

#let render-figure(fig) = {
  if fig == none { [] }
  else if fig.type == "bars" { render-bars(fig) }
  else if fig.type == "steps" { render-steps(fig) }
  else { [] }
}

#let photo-block(path, caption, w, h) = {
  stack(spacing: 0.7mm,
    box(width: w, height: h, clip: true, stroke: 0.4pt + cha)[
      #image(path, width: w, height: h, fit: "cover")
    ],
    if caption != none and caption != "" {
      block(width: w)[
        #text(size: 7.2pt)[▲ #caption]
      ]
    },
  )
}

#let mark-facts(body) = {
  show regex("\d{1,2}月\d{1,2}日(?:（.）)?"): it => box(fill: kinari, inset: (x: 1.5pt, y: 0pt), radius: 1.5pt)[#it]
  show regex("\d[\d,]*円"): it => box(fill: usu, inset: (x: 1.5pt, y: 0pt), radius: 1.5pt)[#it]
  show regex("内線\d+"): it => box(fill: usu, inset: (x: 1.5pt, y: 0pt), radius: 1.5pt)[#it]
  body
}

#let article-block(a, i: 0, type: "C", feature: false, show-head: true, photo: none, caption: "", photo-w: 32mm, breakable: false) = {
  set par(spacing: 0.55em, leading: 0.62em)
  let paras = a.paras
  let has-photo = photo != none and photo != "" and paras.len() > 0
  block(breakable: breakable, below: 0pt)[
    #if show-head {
      if type == "A" { head-a(a) }
      else if type == "B" { head-b(a) }
      else if type == "C" { head-c(a, i) }
      else if type == "D" { head-d(a, feature and i == 0) }
    }
    #mark-facts[
      #if has-photo [
        #grid(
          columns: (1fr, photo-w),
          column-gutter: 2.6mm,
          align: top,
          paras.at(0),
          photo-block(photo, caption, photo-w, photo-w),
        )
        #v(0.8mm)
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
        #v(0.6mm)
        #for item in a.list [
          - #item
        ]
      ]
      #render-table(a.table, inset: 2.4pt, head-size: 7.4pt, body-size: 7.6pt)
      #render-figure(a.figure)
    ]
    #if a.toi != none and a.toi != "" [
      #v(0.8mm)
      #text(size: 7.4pt)[
        #box(inset: (x: 1.5pt, y: 0.6pt), fill: green-d, text(fill: white, size: 7.2pt, weight: "bold")[問])
        #h(3pt)
        #a.toi
        #h(4pt)
        #data.town.tel
      ]
    ]
  ]
}

#let articles-flow(articles, feature: false, photo: none, caption: "", mode: "spread") = {
  let ribbons = 0
  let types = ()
  for (i, a) in articles.enumerate() {
    let k = a.at("kicker", default: none)
    let t = head-type(i, k, feature, ribbons)
    if t == "B" { ribbons += 1 }
    types.push(t)
  }
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
  let pw = if mode == "hero" { 32mm } else { 28mm }
  let cells = ()
  for (i, a) in articles.enumerate() {
    cells.push(article-block(
      a,
      i: i,
      type: if feature and i == 0 { "A" } else { types.at(i) },
      feature: feature,
      show-head: true,
      photo: if i == photo-at { photo } else { none },
      caption: caption,
      photo-w: pw,
    ))
  }
  if calc.odd(cells.len()) { cells.push([]) }
  grid(
    columns: (1fr, 1fr),
    column-gutter: 5mm,
    row-gutter: 3.2mm,
    ..cells,
  )
}

#let cal-day-num(day, first-iso, first-m) = {
  let show-md = day.iso == first-iso or day.d == 1
  if show-md [#day.m/#day.d] else [#str(day.d)]
}

#let cal-day-fill(day, first-m) = {
  if day.m == first-m { white } else { kinari }
}

#let cal-day-ink(day) = {
  if not day.inRange { luma(150) }
  else if day.dow == 0 or day.holiday or day.events.any(e => e.contains("役場は休み")) { cha }
  else if day.dow == 6 { green }
  else { ink }
}

#let render-calendar(pg) = {
  let weeks = pg.weeks
  let ranged = weeks.map(w => w.filter(d => d.inRange)).flatten()
  let first-m = ranged.at(0).m
  let last-m = ranged.at(ranged.len() - 1).m
  let first-iso = ranged.at(0).iso
  let m1 = first-m
  let m2 = last-m
  head-a((kicker: "広報情報係", h: "くらしのカレンダー"))
  if m1 == m2 [
    #text(font: "Yomogi", size: 11pt, fill: cha)[#{m1}月の予定]
  ] else [
    #text(font: "Yomogi", size: 11pt, fill: cha)[#{m1}月・#{m2}月の予定]
  ]
  v(2mm)
  let h-cell = if weeks.len() <= 5 { 36mm } else { 31mm }
  let dows = ("日", "月", "火", "水", "木", "金", "土")
  grid(
    columns: (1fr,) * 7,
    stroke: 0.4pt + green.lighten(45%),
    ..dows.enumerate().map(((di, name)) => block(
      width: 100%,
      fill: if di == 0 { cha } else { green-d },
      inset: (x: 1mm, y: 1mm),
    )[
      #align(center, text(font: "Zen Maru Gothic", weight: "bold", size: 8pt, fill: white)[#name])
    ]),
    ..weeks.map(w => w.map(day => block(
      width: 100%,
      height: h-cell,
      clip: true,
      fill: cal-day-fill(day, first-m),
      inset: 1.5mm,
    )[
      #text(font: "Zen Maru Gothic", weight: "black", size: 12pt, fill: cal-day-ink(day))[
        #cal-day-num(day, first-iso, first-m)
      ]
      #if day.inRange and day.events.len() > 0 [
        #v(0.8mm)
        #for ev in day.events [
          #grid(
            columns: (auto, 1fr),
            column-gutter: 0.8mm,
            align: top,
            box(width: 1.4mm, height: 1.4mm, fill: wakaba),
            text(size: 7.4pt)[#ev],
          )
          #v(0.25mm)
        ]
      ]
    ])).flatten(),
  )
  v(2mm)
  text(size: 8pt)[#data.holiday　暦の日は、この号で案内している日です。]
}

#let feat = data.pages.position(p => p.kind == "articles")

#for (pi, pg) in data.pages.enumerate() {
  if pg.kind == "cover" [
    #page(paper: "a4", margin: 0pt, header: none, footer: none)[
      #block(width: 100%, height: 64mm, clip: true, inset: (x: 12mm, top: 6mm, bottom: 2mm))[
        #grid(
          columns: (1fr, 26mm),
          column-gutter: 4mm,
          align: bottom,
          [
            #text(size: 8pt, fill: green-d, weight: "bold")[霞ノ杜町]
            #v(0.3mm)
            #text(size: 9pt, fill: green, tracking: 0.08em)[かすみのもり]
            #v(0.4mm)
            #text(font: "Zen Kaku Gothic New", weight: "black", size: 28pt, fill: ink)[広報 #h(2mm) かすみのもり]
          ],
          align(center, circle(
            radius: 12.5mm,
            fill: green-d,
            align(center + horizon)[
              #set text(fill: white, font: "Zen Kaku Gothic New")
              #text(size: 7.2pt, weight: "bold")[#data.wareki] \
              #text(size: 14pt, weight: "black")[#data.monthNum.#data.day] \
              #text(size: 7.2pt)[No.#data.no]
            ],
          )),
        )
        #v(2.2mm)
        #text(font: "Yomogi", size: 10pt, fill: cha)[もくじ]
        #v(1mm)
        #grid(
          columns: (1fr, 1fr),
          column-gutter: 5mm,
          row-gutter: 1.1mm,
          ..data.toc.map(pair => toc-item(pair.at(0), pair.at(1))),
        )
      ]
      #place(top + left, dy: 64mm)[
        #box(width: 210mm, height: 233mm, clip: true)[
          #image(data.photo, width: 210mm, height: 233mm, fit: "cover")
          #place(bottom + left)[
            #block(width: 210mm, inset: (x: 12mm, y: 6mm), fill: green-d)[
              #text(font: "Zen Maru Gothic", weight: "bold", fill: white, size: 11pt)[#data.mark]
              #v(1mm)
              #text(font: "Kiwi Maru", weight: "medium", fill: white, size: 22pt)[#data.feature]
              #v(1.2mm)
              #text(fill: white, size: 8pt)[▲ #data.caption]
            ]
          ]
        ]
      ]
    ]
  ] else if pg.kind == "articles" and pg.paper != "a4" [
    #panic("横のページは作らない: " + data.id)
  ] else if pg.kind == "articles" [
    #page(
      paper: "a4",
      margin: (top: 16mm, bottom: 13mm, x: 10mm),
      header: runbar,
      footer: page-footer,
    )[
      #let nart = pg.articles.len()
      #let mode = if pi == feat { "hero" } else if nart >= 5 { "news" } else { "spread" }
      #articles-flow(
        pg.articles,
        feature: pi == feat,
        photo: pg.at("photo", default: none),
        caption: pg.at("photoCaption", default: ""),
        mode: mode,
      )
      #context if here().page() != pi + 1 { panic("紙面あふれ: " + data.id + " の " + str(pi + 1) + " ページ目") }
    ]
  ] else if pg.kind == "calendar" [
    #page(
      paper: "a4",
      margin: (top: 16mm, bottom: 16mm, x: 11mm),
      header: runbar,
      footer: page-footer,
    )[
      #render-calendar(pg)
      #context if here().page() != pi + 1 { panic("紙面あふれ: " + data.id + " の " + str(pi + 1) + " ページ目") }
    ]
  ] else if pg.kind == "back" [
    #page(
      paper: "a4",
      margin: (top: 16mm, bottom: 16mm, x: 11mm),
      header: runbar,
      footer: page-footer,
    )[
      #grid(
        columns: (1fr, 1fr),
        column-gutter: 5.5mm,
        [
          #head-c((kicker: none, h: "お知らせ"), 1)
          #pg.note
        ],
        [
          #head-c((kicker: none, h: "課の電話"), 1)
          #v(0.4mm)
          #text(size: 8pt)[代表 #data.town.tel のあと、内線を伝えてください。]
          #v(1mm)
          #table(
            columns: (1.6fr, 0.5fr, 0.5fr),
            inset: 3pt,
            stroke: table-stroke,
            fill: (_, y) => if y == 0 { table-fill },
            table.header(text(size: 7.4pt, weight: "bold")[担当], text(size: 7.4pt, weight: "bold")[階], text(size: 7.4pt, weight: "bold")[内線]),
            ..data.directory.map(row => (text(size: 7.2pt)[#row.at(0)], text(size: 7.2pt)[#row.at(1)], text(size: 7.2pt)[#row.at(2)])).flatten(),
          )
        ],
      )
      #v(4mm)
      #block(width: 100%, fill: usu, radius: 2.4mm, inset: 8pt)[
        #text(size: 8pt)[
          *役場の窓口*　平日 8時30分〜17時15分（土日祝日、12月29日〜1月3日は休み）。\
          #data.town.office　#data.town.postalCode　#data.town.address \
          代表 #data.town.tel　FAX #data.town.fax　内線は、代表につながってから伝えてください。
        ]
      ]
      #v(4mm)
      #line(length: 100%, stroke: 0.4mm + green)
      #v(1.2mm)
      #text(size: 7.6pt)[
        *広報かすみのもり*　No.#data.no　#{data.month}月号　#{data.wareki}#{data.monthNum}月#{data.day}日発行 \
        編集・発行　霞ノ杜町 政策推進課 広報情報係　電話 #data.town.tel　FAX #data.town.fax \
        #data.town.postalCode　#data.town.address \
        印刷　霞ノ杜印刷　再生紙を使用しています。毎月10日に町内の全世帯へお届けしています。
      ]
      #context if here().page() != pi + 1 { panic("紙面あふれ: " + data.id + " の " + str(pi + 1) + " ページ目") }
    ]
  ]
}
