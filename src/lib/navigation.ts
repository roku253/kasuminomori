export const MEGA_TOOLS = [
  { href: "/contact/", label: "お問い合わせ" },
  { href: "/shisei/yakuba/", label: "庁舎案内" },
  { href: "/kurashi/tetsuzuki-navi/", label: "手続ナビ" },
  { href: "/kurashi/tetsuzuki-search/", label: "申請・手続早わかり検索" },
  { href: "/kurashi/bus-jikan/", label: "バス時刻表" },
  { href: "/kurashi/bus-roke/", label: "バスロケ" },
  { href: "/kurashi/gomi/", label: "ごみ収集曜日" },
  { href: "/kurashi/gomi-search/", label: "ごみ収集検索" },
  { href: "/kurashi/chizu/", label: "地図から探す" },
  { href: "/anzen/hazard/", label: "ハザードマップ" },
  { href: "/kurashi/denshi-shinsei/", label: "電子申請" },
  { href: "/events/", label: "年間行事" },
  { href: "/shisei/open-data/", label: "オープンデータ" },
  { href: "/sangyo/", label: "事業者のかたへ" },
] as const;

export const MEGA_COLUMNS = [
  {
    title: "くらし・環境",
    href: "/kurashi/",
    links: [
      { href: "/kurashi/gomi/", label: "ごみ・リサイクル" },
      { href: "/kurashi/bus-jikan/", label: "町営バス" },
      { href: "/kurashi/suido/", label: "上下水道" },
      { href: "/kurashi/juminhyo/", label: "住民票・窓口" },
    ],
  },
  {
    title: "安全・緊急",
    href: "/anzen/",
    links: [
      { href: "/anzen/saigai/", label: "緊急・災害情報" },
      { href: "/anzen/bosai/", label: "防災" },
      { href: "/anzen/hazard/", label: "ハザードマップ" },
      { href: "/anzen/koutsuu/", label: "交通安全" },
    ],
  },
  {
    title: "福祉・健康",
    href: "/fukushi/",
    links: [
      { href: "/fukushi/kenko/", label: "健康・医療" },
      { href: "/fukushi/kaigo/", label: "介護" },
      { href: "/fukushi/hoken/", label: "保険" },
    ],
  },
  {
    title: "子ども・教育",
    href: "/kodomo/",
    links: [
      { href: "/kodomo/shogakkou/", label: "小学校" },
      { href: "/kodomo/hoiku/", label: "保育・幼稚園" },
      { href: "/kodomo/toshokan/", label: "図書館" },
    ],
  },
  {
    title: "産業・雇用",
    href: "/sangyo/",
    links: [
      { href: "/sangyo/ringyo/", label: "林業" },
      { href: "/sangyo/kankou-sangyo/", label: "観光産業" },
      { href: "/sangyo/shogyo/", label: "商店街" },
    ],
  },
  {
    title: "文化・スポーツ・観光",
    href: "/bunka/",
    links: [
      { href: "/guide/", label: "町のご案内" },
      { href: "/events/", label: "年間行事" },
      { href: "/history/", label: "町の歴史" },
      { href: "/spot/1/", label: "観光スポット" },
    ],
  },
  {
    title: "市政情報",
    href: "/shisei/",
    links: [
      { href: "/shisei/chijitsu/", label: "町長の部屋" },
      { href: "/shisei/koho/", label: "お知らせ" },
      { href: "/shisei/yakuba/", label: "庁舎案内" },
      { href: "/contact/", label: "お問い合わせ" },
    ],
  },
] as const;

export const TOURISM_SIDEBAR = {
  menu: [
    { href: "/", label: "トップページ" },
    { href: "/guide/", label: "町のご案内" },
    { href: "/access/", label: "アクセス・地図" },
    { href: "/events/", label: "年間行事" },
    { href: "/contact/", label: "お問い合わせ" },
  ],
  spots: [
    { href: "/spot/1/", label: "霞ノ杜神社" },
    { href: "/spot/2/", label: "杜の吊り橋" },
    { href: "/spot/3/", label: "霞ノ杜資料館" },
    { href: "/spot/4/", label: "霧見展望休憩所" },
    { href: "/spot/5/", label: "杜の湯（足湯）" },
  ],
  town: [
    { href: "/history/", label: "町の歴史" },
    { href: "/documents/", label: "資料室" },
  ],
  external: [
    {
      href: "https://roku253.github.io/kasuminomori-shougakkou/",
      label: "霞ノ杜町立第一小学校",
      external: true,
    },
  ],
} as const;
