# -*- coding: utf-8 -*-
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SVG_TEMPLATE = '''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#5a7a5a"/><stop offset="100%" style="stop-color:#2a4a6a"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="48%" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="sans-serif" font-size="{fs}">{label}</text>
  <text x="50%" y="58%" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="11">replace: img/placeholders/{file}</text>
</svg>'''

PLACEHOLDERS = [
    ("hero-01.svg", 1920, 1080, 28, "霞ノ杜の霧"),
    ("hero-02.svg", 1920, 1080, 28, "杜の吊り橋"),
    ("hero-03.svg", 1920, 1080, 28, "神社の参道"),
    ("hero-04.svg", 1920, 1080, 28, "杜川の夕暮れ"),
    ("hero-05.svg", 1920, 1080, 28, "三日月町"),
    ("hero-06.svg", 1920, 1080, 28, "杉並ヶ岡"),
    ("instagram-01.svg", 480, 640, 22, "町民祭"),
    ("instagram-02.svg", 240, 240, 16, "春の霧"),
    ("instagram-03.svg", 240, 240, 16, "吊り橋"),
    ("instagram-04.svg", 240, 240, 16, "神社"),
    ("instagram-05.svg", 240, 240, 16, "足湯"),
    ("banner-01.svg", 200, 56, 11, "杜の湯"),
    ("banner-02.svg", 200, 56, 11, "霧見茶房"),
    ("banner-03.svg", 200, 56, 11, "商店会"),
    ("banner-04.svg", 200, 56, 11, "診療所"),
    ("banner-05.svg", 200, 56, 11, "杜川工房"),
    ("footer-symbol.svg", 200, 200, 14, "霞ノ杜"),
]

def base_for(rel_dir):
    if not rel_dir:
        return "./"
    return "../" * len(rel_dir.split("/"))

def write_svgs():
    d = os.path.join(ROOT, "img", "placeholders")
    os.makedirs(d, exist_ok=True)
    for file, w, h, fs, label in PLACEHOLDERS:
        with open(os.path.join(d, file), "w", encoding="utf-8") as f:
            f.write(SVG_TEMPLATE.format(w=w, h=h, fs=fs, label=label, file=file))

def html_leaf(rel_path, page_title, crumbs, h1, paras, table="", related=None, extra_head="", extra_body=""):
    rel_dir = os.path.dirname(rel_path).replace("\\", "/")
    b = base_for(rel_dir)
    n = len([x for x in rel_dir.split("/") if x]) if rel_dir else 0
    tg = ("../" * n) + "token-gate.js"
    bc = []
    for label, href in crumbs:
        if href is None or href == "":
            bc.append(label)
        else:
            bc.append('<a href="' + href + '">' + label + '</a>')
    bc_html = " &nbsp;›&nbsp; ".join(bc)
    paras_html = "".join("<p>" + x + "</p>" for x in paras)
    rel = related or []
    rel_html = '<aside class="city-related"><h2>関連するページ</h2><ul>'
    for label, href in rel:
        rel_html += '<li><a href="' + href + '">' + label + "</a></li>"
    rel_html += "</ul></aside>"
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{page_title}｜霞ノ杜町</title>
  <meta name="description" content="{h1} — 霞ノ杜町公式。【フィクション】">
  <link rel="stylesheet" href="{b}css/city-common.css">
  <link rel="stylesheet" href="{b}css/city-gate.css">
  {extra_head}
  <script src="{b}js/kasumi-gate-head.js"></script>
  <script src="{tg}" defer></script>
</head>
<body class="city-body">
<div id="site-root">
  <div data-city-include="header"></div>
  <div class="city-page-wrap">
    <main class="city-page" id="city-main">
      <nav class="city-breadcrumb" aria-label="パンくず">{bc_html}</nav>
      <h1>{h1}</h1>
      {paras_html}
      {table}
      {rel_html}
    </main>
  </div>
  <div data-city-include="footer"></div>
</div>
<script src="{b}js/site-include.js" data-base="{b}" defer></script>
<script src="{b}js/city-menu.js" defer></script>
<script src="{b}js/kasumi-footprint.js" defer></script>
{extra_body}
</body>
</html>"""

def html_hub(rel_path, page_title, crumbs, h1, intro, cards):
    rel_dir = os.path.dirname(rel_path).replace("\\", "/")
    b = base_for(rel_dir)
    n = len([x for x in rel_dir.split("/") if x]) if rel_dir else 0
    tg = ("../" * n) + "token-gate.js"
    bc_parts = []
    for label, href in crumbs:
        if href is not None and href != "":
            bc_parts.append('<a href="' + b + href + '">' + label + '</a>')
        elif href == "" and label != crumbs[-1][0]:
            bc_parts.append('<a href="' + b + '">' + label + '</a>')
        else:
            bc_parts.append(label)
    cards_html = '<div class="city-hub-cards">'
    for title, href, desc in cards:
        h = href if "://" in href or href.startswith("../") else href
        cards_html += f'<a class="city-hub-card" href="{h}"><strong>{title}</strong><span>{desc}</span></a>'
    cards_html += "</div>"
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{page_title}｜霞ノ杜町</title>
  <link rel="stylesheet" href="{b}css/city-common.css">
  <link rel="stylesheet" href="{b}css/city-gate.css">
  <script src="{b}js/kasumi-gate-head.js"></script>
  <script src="{tg}" defer></script>
</head>
<body class="city-body">
<div id="site-root">
  <div data-city-include="header"></div>
  <div class="city-page-wrap">
    <main class="city-page" id="city-main">
      <nav class="city-breadcrumb" aria-label="パンくず">{" &nbsp;›&nbsp; ".join(bc_parts)}</nav>
      <h1>{h1}</h1>
      <p>{intro}</p>
      {cards_html}
    </main>
  </div>
  <div data-city-include="footer"></div>
</div>
<script src="{b}js/site-include.js" data-base="{b}" defer></script>
</body>
</html>"""

def write(path, content):
    full = os.path.join(ROOT, path.replace("/", os.sep))
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

def main():
    write_svgs()
    T = [("トップ", ""), ]

    # HUBS
    write("kurashi/index.html", html_hub("kurashi/index.html", "くらし・環境",
        [("トップ", "../"), ("くらし・環境", None)], "くらし・環境",
        "ごみ・水道・交通・住民手続など、町民生活の案内です。",
        [("ごみ・リサイクル", "gomi.html", "収集曜日・分別"), ("町営バス", "bus-jikan.html", "時刻・運賃"),
         ("上下水道", "suido.html", "料金・休止水"), ("住民票・窓口", "juminhyo.html", "手続と持ち物"),
         ("住まい・移住", "sumai.html", "空き家・土地"), ("環境・自然", "kankyo.html", "杜川・保全区域"),
         ("手続ナビ", "tetsuzuki-navi.html", "Q&A"), ("地図から探す", "chizu.html", "町内マップ")]))

    write("anzen/index.html", html_hub("anzen/index.html", "安全・緊急",
        [("トップ", "../"), ("安全・緊急", None)], "安全・緊急",
        "防災・交通安全・救急のご案内です。",
        [("緊急・災害情報", "saigai.html", "現在の状況"), ("防災", "bosai.html", "避難・備蓄"),
         ("ハザードマップ", "hazard.html", "立入制限・土砂"), ("交通安全", "koutsuu.html", "吊り橋・霧"),
         ("救急・夜間診療", "kinkyu.html", "連絡先一覧")]))

    write("fukushi/index.html", html_hub("fukushi/index.html", "福祉・健康",
        [("トップ", "../"), ("福祉・健康", None)], "福祉・健康",
        "医療・介護・保険に関する情報です。",
        [("健康・医療", "kenko.html", "健診・診療所"), ("介護", "kaigo.html", "要介護認定"),
         ("保険", "hoken.html", "国保・後期高齢者")]))

    write("kodomo/index.html", html_hub("kodomo/index.html", "子ども・教育",
        [("トップ", "../"), ("子ども・教育", None)], "子ども・教育",
        "保育・学校・子育て支援の案内です。",
        [("小学校", "shogakkou.html", "町立第一小学校"), ("保育・幼稚園", "hoiku.html", "施設一覧"),
         ("図書館", "toshokan.html", "開館時間"), ("子育て支援", "kosodate.html", "相談・手当")]))

    write("sangyo/index.html", html_hub("sangyo/index.html", "産業・雇用",
        [("トップ", "../"), ("産業・雇用", None)], "産業・雇用",
        "林業・観光・商店街・雇用の情報です。",
        [("林業", "ringyo.html", "間伐・素材"), ("観光産業", "kankou-sangyo.html", "協会・受入"),
         ("三日月町商店街", "shogyo.html", "店舗・イベント"), ("雇用・季節工", "koyo.html", "募集情報")]))

    write("bunka/index.html", html_hub("bunka/index.html", "文化・スポーツ・観光",
        [("トップ", "../"), ("文化・スポーツ・観光", None)], "文化・スポーツ・観光",
        "観光・行事・歴史・スポーツイベントへの入口です。",
        [("町のご案内", "../guide/", "自然と産業"), ("年間行事", "../events/", "祭り・マラソン"),
         ("観光スポット", "../spot/1/", "神社から足湯まで"), ("町の歴史", "../history/", "写真と年表"),
         ("スポーツ", "sports.html", "町民大会"), ("伝統文化", "bunka.html", "祭・伝承"),
         ("イベントカレンダー", "events-calendar.html", "月間予定")]))

    write("shisei/index.html", html_hub("shisei/index.html", "市政情報",
        [("トップ", "../"), ("市政情報", None)], "市政情報",
        "町政・組織・広報・選挙の情報です。",
        [("町長の部屋", "chijitsu.html", "ご挨拶"), ("組織・開庁", "shozoku.html", "課別一覧"),
         ("お知らせ", "koho.html", "最新一覧"), ("庁舎案内", "yakuba.html", "アクセス"),
         ("選挙", "senkyo.html", "日程・投票所"), ("オープンデータ", "open-data.html", "公開データ"),
         ("広報アーカイブ", "archive.html", "過去ログ"), ("お問い合わせ", "../contact/", "フォーム")]))

    def ck(title):
        return [("トップ", "../"), ("くらし・環境", "index.html"), (title, None)]
    write("kurashi/gomi.html", html_leaf("kurashi/gomi.html", "ごみ・リサイクル", ck("ごみ・リサイクル"),
        "ごみ・リサイクル", ["地区ごとに収集曜日が異なります。分別は町公式パンフレットに準拠します。"],
        '<table class="city-data"><tr><th>三日月町</th><td>燃やす:火金 / 資源:水 / プラ:第1・3木</td></tr><tr><th>霞ノ杜</th><td>燃やす:月木 / 資源:水 / プラ:第2・4木</td></tr><tr><th>杉並ヶ岡</th><td>燃やす:火 / 資源:金 / プラ:第2水</td></tr></table>',
        [("ごみ収集検索", "gomi-search.html"), ("環境", "kankyo.html"), ("お知らせ", "../shisei/koho.html"), ("問合せ", "../contact/")]))

    write("kurashi/bus-jikan.html", html_leaf("kurashi/bus-jikan.html", "バス時刻表", ck("バス時刻表"),
        "町営バス時刻表", ["三日月町中心部と霞ノ杜地区を結ぶ町営バスは、平日・土曜に1日6往復です。詳細な停留所位置はアクセス・地図をご覧ください。"],
        '<table class="city-data"><tr><th>三日月発</th><td>7:10 / 9:30 / 11:40 / 14:00 / 16:20 / 18:10</td></tr><tr><th>霞ノ杜発</th><td>7:45 / 10:05 / 12:15 / 14:35 / 16:55 / 18:45</td></tr><tr><th>運賃</th><td>大人200円・小児100円（IC未対応）</td></tr></table>',
        [("バスロケ", "bus-roke.html"), ("地図", "chizu.html"), ("アクセス詳細", "../access/"), ("観光", "../bunka/")]))

    write("kurashi/bus-roke.html", html_leaf("kurashi/bus-roke.html", "バスロケ", ck("バスロケ"),
        "バスロケ・運行状況", ["豪雨・積雪時は運休・遅延が発生することがあります。最新情報は町公式お知らせまたは三日月庁舎代表へお問い合わせください。"],
        '<table class="city-data"><tr><th>運行区間</th><td>三日月町中心 ⇄ 霞ノ杜神社前</td></tr><tr><th>運休時</th><td>0123-45-6700（代表）内線 213</td></tr></table>',
        [("時刻表", "bus-jikan.html"), ("防災", "../anzen/bosai.html"), ("お知らせ", "../shisei/koho.html"), ("アクセス", "../access/")]))

    write("kurashi/suido.html", html_leaf("kurashi/suido.html", "上下水道", ck("上下水道"),
        "上下水道", ["町営水道は杜川系の水源を利用しています。休止水・水質検査結果はお知らせで告知します。"],
        '<table class="city-data"><tr><th>水道料金</th><td>メーター検針・2ヶ月ごと請求</td></tr><tr><th>休止水連絡</th><td>総務課 0123-45-6702</td></tr></table>',
        [("環境", "kankyo.html"), ("手続ナビ", "tetsuzuki-navi.html"), ("問合せ", "../contact/"), ("くらしトップ", "index.html")]))

    write("kurashi/juminhyo.html", html_leaf("kurashi/juminhyo.html", "住民票・窓口", ck("住民票・窓口"),
        "住民票・窓口案内", ["転入・転出・世帯変更は三日月庁舎1階 住民課で受け付けます。平日8:30〜17:15（12:00〜13:00は窓口休止）。"],
        '<table class="city-data"><tr><th>住民票交付</th><td>本人確認書類・手数料300円</td></tr><tr><th>転入</th><td>14日以内に届出（前住所の転出証明がある場合）</td></tr></table>',
        [("手続ナビ", "tetsuzuki-navi.html"), ("早わかり検索", "tetsuzuki-search.html"), ("庁舎案内", "../shisei/yakuba.html"), ("電子申請", "denshi-shinsei.html")]))

    write("kurashi/sumai.html", html_leaf("kurashi/sumai.html", "住まい・移住", ck("住まい・移住"),
        "住まい・移住", ["空き家バンク・移住相談を町建設課で行っています。林業や観光と組み合わせた二地域居住の事例もあります。"],
        "", [("環境", "kankyo.html"), ("産業", "../sangyo/"), ("町のご案内", "../guide/"), ("問合せ", "../contact/")]))

    write("kurashi/kankyo.html", html_leaf("kurashi/kankyo.html", "環境・自然", ck("環境・自然"),
        "環境・自然", ["杜川流域の保全協定に基づき、岸辺の伐採・キャンプ火は制限されています。北西部旧整備区域は立入禁止です。"],
        "", [("ハザード", "../anzen/hazard.html"), ("ごみ", "gomi.html"), ("アクセス", "../access/"), ("観光", "../bunka/")]))

    write("kurashi/tetsuzuki-navi.html", html_leaf("kurashi/tetsuzuki-navi.html", "手続ナビ", ck("手続ナビ"),
        "手続ナビ", ["よくあるライフイベントから、必要な手続と窓口を案内します。（静的ナビ・フィクション）"],
        '<table class="city-data"><tr><th>転入した</th><td>住民票転入 → 国民健康保険 → ごみ収集登録</td></tr><tr><th>引っ越す</th><td>転出届 → 各種証明の変更</td></tr><tr><th>子どもが生まれた</th><td>出生届 → 児童手当 → 保育所申込</td></tr></table>',
        [("早わかり検索", "tetsuzuki-search.html"), ("住民票", "juminhyo.html"), ("子育て", "../kodomo/kosodate.html"), ("庁舎", "../shisei/yakuba.html")]))

    write("kurashi/tetsuzuki-search.html", html_leaf("kurashi/tetsuzuki-search.html", "手続早わかり検索", ck("手続早わかり検索"),
        "申請・手続早わかり検索", ["手続名から担当課を検索できます。"],
        '<table class="city-data"><tr><th>住民票</th><td>住民課 / 1階</td></tr><tr><th>建築確認</th><td>建設課 / 2階</td></tr><tr><th>観光協力</th><td>産業観光課 / 2階</td></tr><tr><th>国民健康保険</th><td>福祉課 / 1階</td></tr></table>',
        [("手続ナビ", "tetsuzuki-navi.html"), ("電子申請", "denshi-shinsei.html"), ("組織", "../shisei/shozoku.html"), ("問合せ", "../contact/")]))

    write("kurashi/chizu.html", html_leaf("kurashi/chizu.html", "地図から探す", ck("地図から探す"),
        "地図から探す", ["町内の主要施設・観光スポットの位置は、アクセス・地図ページの簡易図をご利用ください。"],
        '<p><a href="../access/">アクセス・地図ページを開く</a></p>',
        [("アクセス", "../access/"), ("観光スポット", "../spot/1/"), ("ハザード", "../anzen/hazard.html"), ("バス", "bus-jikan.html")]))

    write("kurashi/denshi-shinsei.html", html_leaf("kurashi/denshi-shinsei.html", "電子申請", ck("電子申請"),
        "電子申請", ["一部手続はオンラインで受付可能です。印鑑登録・住民票の一部は来庁が必要です。"],
        '<table class="city-data"><tr><th>オンライン可</th><td>各種証明の請求予約・観光イベント申込</td></tr><tr><th>来庁必須</th><td>初回の転入・印鑑登録</td></tr></table>',
        [("手続ナビ", "tetsuzuki-navi.html"), ("窓口", "juminhyo.html"), ("問合せ", "../contact/"), ("くらし", "index.html")]))

    gomi_search_extra = """
<script>
(function(){
  var map = { "0291701": "三日月町中心 — 燃やす:火・金", "0291702": "霞ノ杜 — 燃やす:月・木", "0291703": "杉並ヶ岡 — 燃やす:火" };
  var btn = document.getElementById("gomi-go");
  var out = document.getElementById("gomi-out");
  if (btn) btn.addEventListener("click", function(){
    var v = (document.getElementById("gomi-zip") || {}).value || "";
    out.textContent = map[v.trim()] || "該当する収集区分が見つかりません。町役場へお問い合わせください。";
  });
})();
</script>"""
    write("kurashi/gomi-search.html", html_leaf("kurashi/gomi-search.html", "ごみ収集検索", ck("ごみ収集検索"),
        "ごみ収集検索", ["町内区分コード（7桁・フィクション）を入力して収集曜日を表示します。"],
        '<p><label>区分コード <input id="gomi-zip" type="text" maxlength="7" placeholder="0291701"></label> <button type="button" id="gomi-go">検索</button></p><p id="gomi-out"></p><p>例: 0291701（三日月） / 0291702（霞ノ杜） / 0291703（杉並ヶ岡）</p>',
        [("収集曜日", "gomi.html"), ("環境", "kankyo.html"), ("問合せ", "../contact/"), ("くらし", "index.html")],
        extra_body=gomi_search_extra))

    # ANZEN
    def ca(title):
        return [("トップ", "../"), ("安全・緊急", "index.html"), (title, None)]
    write("anzen/saigai.html", html_leaf("anzen/saigai.html", "緊急情報", ca("緊急・災害情報"),
        "緊急・災害情報", ["現在、町に関する緊急情報は発表されていません。"], '<p><strong>状況:</strong> 特になし（最終更新: 令和8年4月1日）</p>',
        [("防災", "bosai.html"), ("ハザード", "hazard.html"), ("救急", "kinkyu.html"), ("トップ", "index.html")]))

    write("anzen/bosai.html", html_leaf("anzen/bosai.html", "防災", ca("防災"),
        "防災", ["指定避難所は三日月町公民館・霞ノ杜地区集会所です。防災無線は町内4か所に設置しています。"],
        '<table class="city-data"><tr><th>避難所</th><td>三日月公民館 / 霞ノ杜集会所</td></tr><tr><th>砂袋配布</th><td>建設課倉庫前（災害時のみ）</td></tr></table>',
        [("ハザード", "hazard.html"), ("緊急", "saigai.html"), ("交通", "koutsuu.html"), ("くらし", "../kurashi/")]))

    write("anzen/hazard.html", html_leaf("anzen/hazard.html", "ハザードマップ", ca("ハザードマップ"),
        "ハザードマップ", ["北西部旧整備区域は土砂・旧施設跡のため立入禁止。杜川沿いは増水に注意。霧による視界不良に留意してください。"],
        "", [("アクセス注意", "../access/"), ("防災", "bosai.html"), ("吊り橋", "../spot/2/"), ("観光", "../bunka/")]))

    write("anzen/koutsuu.html", html_leaf("anzen/koutsuu.html", "交通安全", ca("交通安全"),
        "交通安全", ["杜の吊り橋は同時通行10名程度。雨天・濃霧時は通行止めとなる場合があります。"],
        "", [("吊り橋", "../spot/2/"), ("アクセス", "../access/"), ("緊急", "saigai.html"), ("イベント", "../events/")]))

    write("anzen/kinkyu.html", html_leaf("anzen/kinkyu.html", "救急・夜間", ca("救急・夜間診療"),
        "救急・夜間診療", ["町内の夜間・休日救急は、県北医療圏の当番医制度に準じます（架空）。"],
        '<table class="city-data"><tr><th>救急</th><td>119</td></tr><tr><th>町代表</th><td>0123-45-6700</td></tr><tr><th>診療所</th><td>霞ノ杜診療所（平日のみ・詳細は健康ページ）</td></tr></table>',
        [("健康", "../fukushi/kenko.html"), ("防災", "bosai.html"), ("庁舎", "../shisei/yakuba.html"), ("安全", "index.html")]))

    # FUKUSHI
    def cf(title):
        return [("トップ", "../"), ("福祉・健康", "index.html"), (title, None)]
    write("fukushi/kenko.html", html_leaf("fukushi/kenko.html", "健康・医療", cf("健康・医療"),
        "健康・医療", ["40歳以上の町民健診は毎年秋に実施。霞ノ杜診療所は平日9:00〜17:00（土日祝休診）。"],
        "", [("保険", "hoken.html"), ("救急", "../anzen/kinkyu.html"), ("介護", "kaigo.html"), ("問合せ", "../contact/")]))

    write("fukushi/kaigo.html", html_leaf("fukushi/kaigo.html", "介護", cf("介護"),
        "介護", ["要介護認定の申請は福祉課。地域包括支援センター「杜のいろは」が相談を受け付けます。"],
        "", [("健康", "kenko.html"), ("保険", "hoken.html"), ("手続ナビ", "../kurashi/tetsuzuki-navi.html"), ("福祉", "index.html")]))

    write("fukushi/hoken.html", html_leaf("fukushi/hoken.html", "保険", cf("国民健康保険・後期高齢者"),
        "国民健康保険・後期高齢者", ["国保の加入・変更は転入・転出と同時に届出。料金は所得に応じて算定されます。"],
        "", [("健康", "kenko.html"), ("住民票", "../kurashi/juminhyo.html"), ("福祉", "index.html"), ("問合せ", "../contact/")]))

    # KODOMO
    def cko(title):
        return [("トップ", "../"), ("子ども・教育", "index.html"), (title, None)]
    write("kodomo/shogakkou.html", html_leaf("kodomo/shogakkou.html", "小学校", cko("町立第一小学校"),
        "町立第一小学校", ["霞ノ杜町立第一小学校の公式サイトは別ページでご覧いただけます。"],
        '<p><a href="https://roku253.github.io/kasuminomori-shougakkou/" target="_blank" rel="noopener">霞ノ杜町立第一小学校 公式サイト</a></p>',
        [("保育", "hoiku.html"), ("図書館", "toshokan.html"), ("子育て", "kosodate.html"), ("教育", "index.html")]))

    write("kodomo/hoiku.html", html_leaf("kodomo/hoiku.html", "保育・幼稚園", cko("保育・幼稚園"),
        "保育・幼稚園", ["町内に認定こども園1、保育所2、幼稚園（連携型）1があります。空き状況は子育て支援課へ。"],
        '<table class="city-data"><tr><th>杜保育園</th><td>定員60 / 三日月町</td></tr><tr><th>霞ヶ丘こども園</th><td>定員45 / 霞ノ杜</td></tr></table>',
        [("小学校", "shogakkou.html"), ("子育て", "kosodate.html"), ("手続ナビ", "../kurashi/tetsuzuki-navi.html"), ("教育", "index.html")]))

    write("kodomo/toshokan.html", html_leaf("kodomo/toshokan.html", "図書館", cko("町立図書館"),
        "町立図書館", ["三日月庁舎別館2階。一般書・町史コーナー・児童書を所蔵。火・水は休館。"],
        '<table class="city-data"><tr><th>開館</th><td>9:30〜18:00（土曜〜17:00）</td></tr></table>',
        [("歴史", "../history/"), ("資料室", "../documents/"), ("小学校", "shogakkou.html"), ("教育", "index.html")]))

    write("kodomo/kosodate.html", html_leaf("kodomo/kosodate.html", "子育て支援", cko("子育て支援"),
        "子育て支援", ["児童手当・医療費助成・一時預かりの案内は子育て支援課。相談は杜のいろはと連携。"],
        "", [("保育", "hoiku.html"), ("手続ナビ", "../kurashi/tetsuzuki-navi.html"), ("福祉", "../fukushi/"), ("問合せ", "../contact/")]))

    # SANGYO
    def cs(title):
        return [("トップ", "../"), ("産業・雇用", "index.html"), (title, None)]
    write("sangyo/ringyo.html", html_leaf("sangyo/ringyo.html", "林業", cs("林業"),
        "林業", ["町面積の約七成が森林。間伐・素材販売は林業組合と建設課が窓口。"],
        "", [("環境", "../kurashi/kankyo.html"), ("雇用", "koyo.html"), ("観光", "kankou-sangyo.html"), ("産業", "index.html")]))

    write("sangyo/kankou-sangyo.html", html_leaf("sangyo/kankou-sangyo.html", "観光産業", cs("観光産業"),
        "観光産業", ["宿泊・体験・受入の届出、協会との連携は産業観光課。観光情報は文化・観光カテゴリへ。"],
        "", [("観光入口", "../bunka/"), ("商店街", "shogyo.html"), ("イベント", "../events/"), ("問合せ", "../contact/")]))

    write("sangyo/shogyo.html", html_leaf("sangyo/shogyo.html", "商店街", cs("三日月町商店街"),
        "三日月町商店街", ["老舗の雑貨・食堂・土産店が旧街道沿いに並びます。毎月第3土曜は夜市。"],
        "", [("観光", "../bunka/"), ("アクセス", "../access/"), ("雇用", "koyo.html"), ("産業", "index.html")]))

    write("sangyo/koyo.html", html_leaf("sangyo/koyo.html", "雇用", cs("雇用・季節工"),
        "雇用・季節工", ["ハウスメーカー・林業・観光の季節求人を町ハローワーク掲示板で公開（架空）。"],
        '<table class="city-data"><tr><th>林業作業</th><td>4〜11月 / 要相談</td></tr><tr><th>観光案内</th><td>夏期アルバイト</td></tr></table>',
        [("林業", "ringyo.html"), ("商店街", "shogyo.html"), ("事業者", "index.html"), ("問合せ", "../contact/")]))

    # BUNKA extra
    def cb(title):
        return [("トップ", "../"), ("文化・スポーツ・観光", "index.html"), (title, None)]
    write("bunka/sports.html", html_leaf("bunka/sports.html", "スポーツ", cb("スポーツ・レクリエーション"),
        "スポーツ・レクリエーション", ["町民体育祭（5月）、杜川マラソン（10月）などを開催。詳細は年間行事へ。"],
        "", [("年間行事", "../events/"), ("観光", "index.html"), ("吊り橋", "../spot/2/"), ("問合せ", "../contact/")]))

    write("bunka/bunka.html", html_leaf("bunka/bunka.html", "伝統文化", cb("伝統文化・祭り"),
        "伝統文化・祭り", ["霞ノ杜神社の例大祭、霧見祭など。伝承については町の歴史ページもご覧ください。"],
        "", [("歴史", "../history/"), ("神社", "../spot/1/"), ("行事", "../events/"), ("観光", "index.html")]))

    write("bunka/events-calendar.html", html_leaf("bunka/events-calendar.html", "イベント", cb("イベントカレンダー"),
        "イベントカレンダー", ["月ごとの主な行事は年間行事ページに掲載しています。"],
        '<p><a href="../events/">年間行事ページへ</a></p>',
        [("行事", "../events/"), ("スポーツ", "sports.html"), ("観光", "index.html"), ("お知らせ", "../shisei/koho.html")]))

    # SHISEI
    def csh(title):
        return [("トップ", "../"), ("市政情報", "index.html"), (title, None)]
    write("shisei/chijitsu.html", html_leaf("shisei/chijitsu.html", "町長", csh("町長の部屋"),
        "町長の部屋", ["町長 藤原 誠一（ふじわら せいいち）— 杜と人をつなぐまちづくりを目指して。（架空）"],
        "", [("組織", "shozoku.html"), ("お知らせ", "koho.html"), ("選挙", "senkyo.html"), ("市政", "index.html")]))

    write("shisei/shozoku.html", html_leaf("shisei/shozoku.html", "組織", csh("組織・開庁時間"),
        "組織・開庁時間", ["三日月庁舎は平日8:30〜17:15。住民課・福祉課は1階、建設・産業観光は2階。"],
        '<table class="city-data"><tr><th>代表</th><td>0123-45-6700</td></tr><tr><th>観光・産業</th><td>内線 220</td></tr></table>',
        [("庁舎", "yakuba.html"), ("手続検索", "../kurashi/tetsuzuki-search.html"), ("町長", "chijitsu.html"), ("問合せ", "../contact/")]))

    write("shisei/koho.html", html_leaf("shisei/koho.html", "お知らせ", csh("お知らせ"),
        "お知らせ", ["町からの最新情報です。"],
        '<ul><li><strong>R8.4.1</strong> 公式サイトをリニューアル</li><li><strong>R8.3.15</strong> 杜の吊り橋 — 雨天注意</li><li><strong>R8.2.1</strong> 冬季閉鎖区間の案内更新</li></ul>',
        [("緊急", "../anzen/saigai.html"), ("広報アーカイブ", "archive.html"), ("イベント", "../events/"), ("問合せ", "../contact/")]))

    write("shisei/yakuba.html", html_leaf("shisei/yakuba.html", "庁舎案内", csh("庁舎案内"),
        "庁舎案内", ["〒029-17XX 吾妻郡霞ノ杜町三日月中央2-8-1。JR最寄「三日月町」駅から町営バス20分。"],
        "", [("アクセス", "../access/"), ("組織", "shozoku.html"), ("地図", "../kurashi/chizu.html"), ("市政", "index.html")]))

    write("shisei/senkyo.html", html_leaf("shisei/senkyo.html", "選挙", csh("選挙"),
        "選挙", ["投票所は三日月公民館・霞ノ杜集会所。期日前投票は庁舎1階ロビー（選挙期間中のみ）。"],
        "", [("町長", "chijitsu.html"), ("お知らせ", "koho.html"), ("組織", "shozoku.html"), ("市政", "index.html")]))

    write("shisei/open-data.html", html_leaf("shisei/open-data.html", "オープンデータ", csh("オープンデータ"),
        "オープンデータ", ["町営バス停留所、ごみ収集区、観光施設の位置データをCSV形式で公開（架空）。"],
        '<table class="city-data"><tr><th>bus_stops.csv</th><td>停留所座標</td></tr><tr><th>tourism_spots.csv</th><td>観光スポット</td></tr></table>',
        [("地図から探す", "../kurashi/chizu.html"), ("観光", "../bunka/"), ("市政", "index.html"), ("問合せ", "../contact/")]))

    archive_body = '<p class="kn-print-error" aria-hidden="true">[ SYS_ERR ] 旧・烏啼地区ログ復元失敗 — 地区コード [ 67-B地区 ] はマスタから削除済み。開発凍結: 2021-07-20</p>'
    write("shisei/archive.html", html_leaf("shisei/archive.html", "広報アーカイブ", csh("広報・過去ログ"),
        "広報・過去ログ", ["過去の広報・ローカルニュースへ。"],
        '<ul><li data-kn-story-clue="1"><a href="../blog/2021/">2021年ローカルニュース</a></li><li><a href="../blog/2016/">2016年アーカイブ</a></li><li><a href="../documents/">資料室</a></li><li><a href="../history/">町の歴史</a></li></ul>' + archive_body,
        [("お知らせ", "koho.html"), ("歴史", "../history/"), ("2021", "../blog/2021/"), ("市政", "index.html")]))

    print("Generated", len(PLACEHOLDERS), "SVGs and category pages.")

if __name__ == "__main__":
    main()
