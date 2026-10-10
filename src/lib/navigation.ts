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
    title: "町政情報",
    href: "/shisei/",
    links: [
      { href: "/shisei/chijitsu/", label: "町長の部屋" },
      { href: "/shisei/koho/", label: "お知らせ" },
      { href: "/shisei/yakuba/", label: "庁舎案内" },
      { href: "/contact/", label: "お問い合わせ" },
    ],
  },
] as const;

/**
 * ローカルナビ（ページ下部・横の「このカテゴリのページ」。src/lib/local-nav.ts）の規則。
 *
 * - 同じカテゴリ（パンくずの2番目）の直下のページを並べる。今いる枝（例: 資料室）の下位ページは入れ子で出す。
 * - LOCAL_NAV_EXCLUDE に当たるページは並べない（過去の記事は「お知らせ」のリニューアル告知から辿る＝物語の導線。
 *   サイト内検索・お知らせの詳細は一覧に要らない）。
 * - 物語ページ同士の相互リンクを作らない（確定版 ★・受け入れ条件 K-11）: 今のページが STORY_LINK_GROUPS の
 *   ある群に入るとき、ほかの群のページは並べない（例: 過去の記事のページに「資料室」を出さない）。
 * WP3a が物語のページ（過去の記事の一覧・情報提供資料など）を足したら、ここの前方一致も見直すこと。
 */
export const LOCAL_NAV_EXCLUDE: readonly string[] = ["/blog/", "/search/"];

/** お知らせの詳細（/shisei/koho/〜/）はローカルナビに並べない */
export function isNewsDetailRoute(route: string): boolean {
  return /^\/shisei\/koho\/[^/]+\/$/.test(route);
}

/**
 * サイトマップ（/sitemap/。全ページのフッターからリンク）に**下位ページを並べない**入口。
 * 確定版 ★: 共通の案内は物語ページ（議会だより・地域安全通信・情報提供資料・過去の記事・町の歴史の伝承節）へ直接リンクしない。
 * 入口（資料室）は並べ、その下の文書は並べない。過去の記事（/blog/）とお知らせの詳細は LOCAL_NAV_EXCLUDE と同じく出さない。
 */
export const SITEMAP_NO_CHILDREN: readonly string[] = ["/documents/"];

export const STORY_LINK_GROUPS: readonly (readonly string[])[] = [
  ["/documents/"],
  ["/blog/", "/history/"],
];
