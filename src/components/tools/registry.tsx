import { Suspense, type ReactNode } from "react";
import { DataTable, type DataTableRow } from "@/components/ui/DataTable";
import bus from "@/content/data/bus.json";
import gomi from "@/content/data/gomi.json";
import procedures from "@/content/data/procedures.json";
import toolNames from "./tool-names.json";
import { FacilityFinder } from "./FacilityFinder";
import { GomiCodeSearch } from "./GomiCodeSearch";
import { ProcedureSearch } from "./ProcedureSearch";
import { NewsList } from "./NewsList";
import { SiteMapList } from "./SiteMapList";
import { SiteSearchPanel, SiteSearchResults } from "./site-search/SiteSearchResults";

/**
 * ページ JSON からツールを呼び出す仕組み。
 *
 * ページ JSON の本文（paragraphs の1項目まるごと・tableHtml まるごと・extraHtml の中）に
 *   <div data-kn-tool="gomi-search"></div>
 * と書くと、その位置にツールが出る。ツールの文言とデータは src/content/data/*.json にある。
 * 使える名前は tool-names.json（scripts/build-manifest.mjs が未登録の名前を検出して止める）。
 * 表のツール（gomi-calendar 等）は、データから表を作る（見た目は従来の tableHtml と同じ）。
 */
export type ToolName = (typeof toolNames)[number];

const MARKER_SOURCE = String.raw`<div\s+data-kn-tool="([a-z0-9-]+)"\s*><\/div>`;
const WHOLE_MARKER = new RegExp(`^\\s*${MARKER_SOURCE}\\s*$`);

export function isToolName(name: string): name is ToolName {
  return (toolNames as readonly string[]).includes(name);
}

/** html が目印1つだけならツール名を返す */
export function toolMarkerName(html?: string): string | null {
  if (!html) return null;
  const m = html.match(WHOLE_MARKER);
  return m ? m[1] : null;
}

export type ContentPart = { type: "html"; html: string } | { type: "tool"; name: string };

/** HTML を目印の前後で分ける（目印が無ければ1つの html 部分だけ） */
export function splitToolMarkers(html: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const re = new RegExp(MARKER_SOURCE, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const before = html.slice(last, m.index);
    if (before.trim()) parts.push({ type: "html", html: before });
    parts.push({ type: "tool", name: m[1] });
    last = m.index + m[0].length;
  }
  const rest = html.slice(last);
  if (rest.trim() || parts.length === 0) parts.push({ type: "html", html: rest });
  return parts;
}

const TABLE_TOOLS: Partial<Record<ToolName, () => DataTableRow[]>> = {
  "gomi-calendar": () => gomi.calendar.map((r) => ({ label: r.area, value: r.schedule })),
  "procedure-navi": () => procedures.navi.map((r) => ({ label: r.scene, value: r.steps })),
  "online-procedures": () => procedures.online.map((r) => ({ label: r.label, value: r.value })),
  "bus-timetable": () => bus.timetable.map((r) => ({ label: r.label, value: r.value })),
  "bus-status": () => bus.status.map((r) => ({ label: r.label, value: r.value })),
};

type ToolContext = {
  /** 表の caption（読み上げ用。従来どおりページの h1） */
  caption?: string;
};

export function renderTool(name: string, ctx: ToolContext = {}): ReactNode {
  if (!isToolName(name)) {
    throw new Error(`未登録のツール "${name}"（src/components/tools/tool-names.json を確認）`);
  }
  const rows = TABLE_TOOLS[name];
  if (rows) return <DataTable rows={rows()} caption={ctx.caption} />;
  switch (name) {
    case "gomi-search":
      return <GomiCodeSearch />;
    case "procedure-search":
      return <ProcedureSearch caption={ctx.caption} />;
    case "facility-finder":
      return <FacilityFinder />;
    case "sitemap":
      return <SiteMapList />;
    case "news-list":
      return <NewsList />;
    case "site-search":
      // ?q= は useSearchParams で読む（静的書き出しでは Suspense が要る。読むまでは空の検索欄を出す）
      return (
        <Suspense fallback={<SiteSearchPanel query="" />}>
          <SiteSearchResults />
        </Suspense>
      );
    default:
      throw new Error(`ツール "${name}" の描き方がありません（registry.tsx）`);
  }
}
