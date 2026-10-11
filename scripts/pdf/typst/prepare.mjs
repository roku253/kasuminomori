/**
 * 文書データ（docs/*.mjs）を Typst が読む JSON にする。
 * 広報はページ構成までここで決め、.typ は組版だけを行う。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOWN, unit } from "../lib/town.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..", "..");

const DIRECTORY = [
  ["総務課 総務係", "2階", "211"],
  ["総務課 地域安全係", "2階", "215"],
  ["政策推進課 企画財政係", "2階", "241"],
  ["政策推進課 広報情報係", "2階", "244"],
  ["住民税務課 住民係", "1階", "111"],
  ["住民税務課 税務係", "1階", "114"],
  ["住民税務課 環境係", "1階", "117"],
  ["保健福祉課 福祉係", "1階", "121"],
  ["保健福祉課 介護保険係", "1階", "124"],
  ["保健福祉課 保健係", "1階", "127"],
  ["産業観光課 農林係", "2階", "221"],
  ["産業観光課 商工観光係", "2階", "224"],
  ["建設水道課 建設係", "2階", "231"],
  ["建設水道課 上下水道係", "2階", "234"],
  ["教育課 学校教育係", "3階", "311"],
  ["教育課 こども係", "3階", "314"],
  ["教育課 生涯学習係", "3階", "317"],
  ["会計室", "1階", "130"],
  ["議会事務局", "3階", "320"],
];

function strip(s) {
  return String(s)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h\d|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function asText(v) {
  if (v == null) return "";
  if (typeof v === "string") return strip(v);
  if (typeof v === "object" && typeof v.toString === "function" && v.s) return strip(v.toString());
  return "";
}

function parasOf(body) {
  const paras = [];
  let toi = "";
  for (const b of body || []) {
    if (typeof b === "string" && b.trim()) paras.push(b.trim());
    else if (b && typeof b === "object") {
      if (b.toi) {
        try {
          const u = unit(b.toi);
          toi = `${u.name}　${TOWN.tel}（内線 ${u.ext}）`;
        } catch {
          toi = String(b.toi);
        }
      } else if (typeof b.p === "string") paras.push(b.p.trim());
      else if (b.list) paras.push((b.list || []).join("\n"));
      else if (b.table?.rows) {
        for (const row of b.table.rows) paras.push(row.map((c) => (typeof c === "string" ? c : c?.t || "")).join("　"));
      }
    }
  }
  return { paras, toi };
}

function deptOf(toiName, fallback) {
  if (!toiName) return fallback;
  return toiName.split(/\s+/)[0] || fallback;
}

function flattenKoho(doc) {
  const arts = [];
  let calRows = [];
  let population = "";
  for (const sheet of doc.sheets || []) {
    const all = [
      ...(sheet.articles || []),
      ...((sheet.two || []).flat()),
      ...(sheet.side ? [sheet.side] : []),
      ...(sheet.moreRight || []),
      ...(sheet.moreLeft || []),
      ...(sheet.below ? [sheet.below] : []),
    ];
    for (const a of all) {
      if (!a?.h) continue;
      if (String(a.h).includes("カレンダー")) {
        const table = (a.body || []).find((b) => b?.table);
        calRows = (table?.table?.rows || []).map((row) => row.map((c) => String(c)));
      } else if (a.h === "人口") {
        population = (a.body || []).find((b) => typeof b === "string") || "";
      } else {
        const { paras, toi } = parasOf(a.body);
        arts.push({ h: a.h, dept: deptOf(toi, "広報情報係"), paras, toi });
      }
    }
  }
  const per = 4;
  const groups = [];
  for (let i = 0; i < arts.length; i += per) groups.push(arts.slice(i, i + per));
  return { arts, groups, calRows, population };
}

function holidayLine(iso) {
  const [y, m] = iso.split("-").map(Number);
  const names = {
    "2026-05-03": "憲法記念日",
    "2026-05-04": "みどりの日",
    "2026-05-05": "こどもの日",
    "2026-05-06": "振替休日",
    "2026-07-20": "海の日",
    "2026-08-11": "山の日",
    "2026-09-21": "敬老の日",
    "2026-09-22": "休日",
    "2026-09-23": "秋分の日",
    "2026-10-12": "スポーツの日",
    "2026-11-03": "文化の日",
    "2026-11-23": "勤労感謝の日",
  };
  const list = Object.entries(names)
    .filter(([d]) => {
      const [yy, mm] = d.split("-").map(Number);
      return yy === y && mm === m;
    })
    .map(([d, name]) => `${Number(d.slice(8))}日 ${name}`);
  if (!list.length) return "この月の祝日・休日はありません。土日は閉庁です。";
  return `閉庁は土日と、${list.join("、")}です。`;
}

export function prepareKoho(doc) {
  const { groups, calRows, population } = flattenKoho(doc);
  const [y, m, d] = doc.issued.split("-").map(Number);
  const photo = "/public/" + String(doc.cover.photo || "").replace(/\\/g, "/").replace(/^\/?public\//, "");
  return {
    kind: "koho",
    id: doc.id,
    no: doc.no,
    month: Number(doc.month),
    year: y,
    monthNum: m,
    day: d,
    mark: doc.mark,
    feature: groups[0]?.[0]?.h || doc.mark,
    photo,
    caption: doc.cover.caption || "",
    note: doc.cover.note || "",
    town: TOWN,
    groups,
    calRows,
    population,
    holiday: holidayLine(doc.issued),
    directory: DIRECTORY,
    pages: 1 + groups.length + 2,
  };
}

function collectStrings(v, out, seen) {
  if (v == null) return;
  const text = asText(v);
  if (text && typeof v !== "object") {
    if (text.length > 1) out.push(text);
    return;
  }
  if (typeof v === "object" && v.s) {
    if (text.length > 1) out.push(text);
    return;
  }
  if (typeof v !== "object") return;
  if (seen.has(v)) return;
  seen.add(v);
  if (Array.isArray(v)) {
    for (const x of v) collectStrings(x, out, seen);
    return;
  }
  for (const [k, val] of Object.entries(v)) {
    if (k === "checks" || k === "meta" || k === "file" || k === "template") continue;
    collectStrings(val, out, seen);
  }
}

export function prepareFlow(doc) {
  const raw = [];
  collectStrings(doc, raw, new Set());
  const bits = raw
    .flatMap((s) => s.split(/\n+/))
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  const unique = [];
  const seen = new Set();
  for (const s of bits) {
    if (seen.has(s)) continue;
    seen.add(s);
    unique.push(s);
  }
  const per = 10;
  const pages = [];
  for (let i = 0; i < unique.length; i += per) pages.push(unique.slice(i, i + per));
  return {
    kind: "flow",
    title: doc.meta?.title || doc.id,
    pages: pages.length ? pages : [[doc.meta?.title || doc.id]],
  };
}

function projectPath(abs) {
  const rel = path.relative(ROOT, abs).split(path.sep).join("/");
  return rel.startsWith("/") ? rel : `/${rel}`;
}

export function prepareJoho(doc, copy1, copy2) {
  const cover = asText(doc.cover);
  const paras = cover.split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 4);
  return { kind: "joho", paras, copy1, copy2 };
}

export function writePayload(dir, id, payload) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${id}.json`);
  fs.writeFileSync(file, JSON.stringify(payload));
  return file;
}

export const REPO = ROOT;
