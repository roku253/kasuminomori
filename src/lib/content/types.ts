export type BreadcrumbItem = { label: string; href?: string };

export type RelatedLink = { href: string; label: string; storyClue?: boolean };

/**
 * ページ JSON（src/content/pages/*.json。町の文言の正本）の形。manifest.json はこれを集めた生成物。
 * 本文の HTML（paragraphs・tableHtml・extraHtml）には次の目印が書ける:
 *   - ツール: <div data-kn-tool="gomi-search"></div>（src/components/tools/registry.tsx）
 *   - PDF リンク: <a data-pdf="ファイル名.pdf">題名</a>（src/lib/content/pdf-links.ts）
 */
export type CityPageContent = {
  path: string;
  route: string;
  /** 全ページ "city"（CityPageTemplate）。旧型 "legacy"（左メニュー）は 1b で廃止 */
  layout: "city";
  title: string;
  description: string;
  canonical?: string;
  breadcrumbs: BreadcrumbItem[];
  h1?: string;
  paragraphs?: string[];
  bodyHtml?: string;
  tableHtml?: string;
  /** 表（tableHtml）の小見出し（例「指定避難所」「開館時間」）。無ければ見出しなし（旧「一覧・詳細」は廃止） */
  tableTitle?: string;
  extraHtml?: string;
  related?: RelatedLink[];
  /** サイト内検索で照合に加える語（本文に無い言い換えなど） */
  searchKeywords?: string[];
  /** true ならサイト内検索の索引に入れない（移転の案内・検索ページ自身など） */
  searchExclude?: boolean;
  /**
   * 担当（「このページに関するお問い合わせ」）。src/content/data/organization.json の「課 係」の名前
   * （例 "総務課 地域安全係"・"教育委員会 教育課 こども係"・"議会事務局"）。無ければ route から決まる既定値。
   */
  owner?: string;
  /** 更新日（ISO "2026-08-01"）。作中の現在（2026-10-10）以前。無ければお知らせの日付か既定値 */
  updated?: string;
  /** お知らせ（/shisei/koho/〜/）なら掲載日（ISO。開庁日）。トップと「お知らせ」一覧に日付順で出る */
  news?: { date: string };
  /** true のページだけ、印刷すると .kn-print-error の文だけが出る（謎解きの仕掛け。PrintError.tsx） */
  printError?: boolean;
};

export type ContentManifest = {
  pages: CityPageContent[];
  categories: Record<string, string[]>;
  spots: string[];
};
