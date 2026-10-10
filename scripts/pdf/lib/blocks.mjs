/**
 * 記事の中身（ブロック）を HTML にする。文書のデータ（docs/*.mjs）は次の形の配列で本文を書く。
 *
 *   "文字列"                          → 段落（**太字** と \n の改行が使える）
 *   { p: "…", cls: "lead" }           → 段落（class 付き）
 *   { list: ["…", …], ordered: true } → 箇条（ordered で ①②③）
 *   { checks: ["…", …] }              → チェック欄つきの箇条（□）
 *   { table: { head: [...], rows: [[...], …], cls, widths: ["30%", …] } } → 表（セルは文字列か { t, cls, colspan }）
 *   { dl: [["見出し", "内容"], …] }    → 見出しと内容の組
 *   { box: { title, body: [ブロック…], cls } } → 囲み
 *   { note: "…" }                     → 注（※）
 *   { html: safe(...) }               → そのまま（図など）
 *   { toi: "総務課 地域安全係" }        → 記事末の「問」（課・係は organization.json の名前。内線を引く）
 */
import { h, isSafe, safe, t } from "./html.mjs";
import { telNo, unit } from "./town.mjs";

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

function cell(c, tag) {
  if (isSafe(c)) return safe(`<${tag}>${c}</${tag}>`);
  if (c && typeof c === "object") {
    const attrs = `${c.cls ? ` class="${c.cls}"` : ""}${c.colspan ? ` colspan="${c.colspan}"` : ""}${c.rowspan ? ` rowspan="${c.rowspan}"` : ""}`;
    return safe(`<${tag}${attrs}>${t(c.t ?? "")}</${tag}>`);
  }
  return safe(`<${tag}>${t(c ?? "")}</${tag}>`);
}

export function table({ head, rows, cls = "", widths, caption }) {
  return h`<table class="${cls}">${caption ? h`<caption>${t(caption)}</caption>` : ""}${
    widths ? h`<colgroup>${widths.map((w) => h`<col style="width:${w}">`)}</colgroup>` : ""
  }${head ? h`<thead><tr>${head.map((c) => cell(c, "th"))}</tr></thead>` : ""}<tbody>${rows.map(
    (r) => h`<tr>${r.map((c, i) => cell(c, i === 0 && r.length > 1 && !head?.length ? "th" : "td"))}</tr>`,
  )}</tbody></table>`;
}

/** 「問 総務課 地域安全係 0266-12-2111（内線 215）」 */
export function toi(name, extra = "") {
  const u = unit(name);
  return h`<p class="toi"><span class="toi-mark">問</span><span>${u.name}${extra ? `（${extra}）` : ""}　${telNo(name)}</span></p>`;
}

export function block(b) {
  if (b == null) return "";
  if (typeof b === "string") return h`<p>${t(b)}</p>`;
  if (isSafe(b)) return b;
  if (b.p !== undefined) return h`<p class="${b.cls || ""}">${t(b.p)}</p>`;
  if (b.list) {
    if (b.ordered) return h`<ol class="olist ${b.cls || ""}">${b.list.map((x, i) => h`<li><span class="mark">${CIRCLED[i]}</span><span>${t(x)}</span></li>`)}</ol>`;
    return h`<ul class="ulist ${b.cls || ""}">${b.list.map((x) => h`<li><span class="mark">・</span><span>${t(x)}</span></li>`)}</ul>`;
  }
  if (b.checks) return h`<ul class="checks ${b.cls || ""}">${b.checks.map((x) => h`<li><span class="mark">□</span><span>${t(x)}</span></li>`)}</ul>`;
  if (b.table) return table(b.table);
  if (b.dl) return h`<dl class="pairs ${b.cls || ""}">${b.dl.map(([k, v]) => h`<div><dt>${t(k)}</dt><dd>${t(v)}</dd></div>`)}</dl>`;
  if (b.box) return h`<div class="box ${b.box.cls || ""}">${b.box.title ? h`<p class="box-title">${t(b.box.title)}</p>` : ""}${blocks(b.box.body)}</div>`;
  if (b.note) return h`<p class="note">${t(b.note)}</p>`;
  if (b.html) return b.html;
  if (b.toi) return toi(b.toi, b.extra);
  throw new Error(`知らないブロック: ${JSON.stringify(b).slice(0, 80)}`);
}

export const blocks = (list = []) => list.map(block);
