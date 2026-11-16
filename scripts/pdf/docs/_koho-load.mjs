/**
 * 広報本文 JSON（_koho-body.json）を docs の default export 用に読み込む。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isHoliday, md } from "../lib/dates.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(fs.readFileSync(path.join(HERE, "_koho-body.json"), "utf8"));

const ban = [
  "児童",
  "事故",
  "立入禁止",
  "絵画展",
  "年生",
  "謎解き",
  "市政",
  "藤原",
  "河川敷清掃",
  "町立霞ノ杜小学校",
  "lg.jp",
  "@",
];

const CAL_DATE_RE = /^\{\{d:(\d{4})-(\d{2})-(\d{2})\}\}$/;

function replaceDates(v) {
  if (typeof v === "string") {
    return v.replace(/\{\{d:(\d{4}-\d{2}-\d{2})\}\}/g, (_, iso) => md(iso));
  }
  if (Array.isArray(v)) return v.map(replaceDates);
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, val] of Object.entries(v)) o[k] = replaceDates(val);
    return o;
  }
  return v;
}

function utcDow(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function isoFromParts(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseIso(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`日付が読めません: ${iso}`);
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

function addDaysIso(iso, delta) {
  const { y, mo, d } = parseIso(iso);
  const dt = new Date(Date.UTC(y, mo - 1, d + delta));
  return isoFromParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function sundayOnOrBefore(iso) {
  const { y, mo, d } = parseIso(iso);
  const dow = utcDow(y, mo, d);
  return addDaysIso(iso, -dow);
}

function saturdayOnOrAfter(iso) {
  const { y, mo, d } = parseIso(iso);
  const dow = utcDow(y, mo, d);
  return addDaysIso(iso, 6 - dow);
}

function buildCalendarWeeks(rawPage, id) {
  const byIso = new Map();
  for (const row of rawPage.rows) {
    const m = CAL_DATE_RE.exec(row[0]);
    if (!m) throw new Error(`カレンダーの日付が読めません: ${id} ${row[0]}`);
    const iso = `${m[1]}-${m[2]}-${m[3]}`;
    const events = replaceDates(row[1])
      .split("／")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!byIso.has(iso)) byIso.set(iso, []);
    byIso.get(iso).push(...events);
  }
  const sorted = [...byIso.keys()].sort();
  if (!sorted.length) return [];
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  let start = sundayOnOrBefore(first);
  const end = saturdayOnOrAfter(last);
  const weeks = [];
  let week = [];
  for (let cur = start; cur <= end; cur = addDaysIso(cur, 1)) {
    const { y, mo, d } = parseIso(cur);
    const dow = utcDow(y, mo, d);
    const inRange = first <= cur && cur <= last;
    week.push({
      iso: cur,
      m: mo,
      d,
      dow,
      holiday: isHoliday(cur),
      inRange,
      events: inRange ? byIso.get(cur) || [] : [],
    });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  return weeks;
}

function checkBudget(row) {
  for (const pg of row.pages) {
    if (pg.kind !== "articles") continue;
    for (const a of pg.articles || []) {
      const fig = a.figure;
      if (fig && fig.type === "bars" && fig.unit === "億円") {
        const sum = fig.items.reduce((s, it) => s + it.value, 0);
        const rounded = Math.round(sum * 10) / 10;
        if (rounded !== 46.8) {
          throw new Error("予算の内訳の合計が 46.8 億円になりません");
        }
      }
    }
  }
}

const rawById = Object.fromEntries(raw.issues.map((i) => [i.id, i]));
const byId = Object.fromEntries(raw.issues.map((i) => [i.id, replaceDates(i)]));

export function issue(id) {
  const row = byId[id];
  const rawRow = rawById[id];
  if (!row) throw new Error(`広報の号が見つかりません: ${id}`);
  checkBudget(row);
  const month = row.month;
  const mustNotContain = [...ban];
  const mustContain = [
    { page: 1, text: `No.${row.no}` },
    { page: 1, text: row.mark },
  ];
  if (id !== "koho-r8-10") {
    mustNotContain.push("5,812", "2,431");
  } else {
    mustContain.push({ text: "5,812" }, { text: "2,431" });
  }
  const pages = row.pages.map((pg, pi) => {
    if (pg.kind !== "calendar") return pg;
    const rawPg = rawRow.pages[pi];
    return { ...pg, weeks: buildCalendarWeeks(rawPg, id) };
  });
  return {
    template: "koho",
    file: `${id}.pdf`,
    checks: {
      mustContain,
      mustNotContain,
      portraitOnly: true,
    },
    meta: {
      title: `広報かすみのもり ${month}月号 No.${row.no}`,
      author: "霞ノ杜町 政策推進課 広報情報係",
      subject: row.subject,
      keywords: `広報かすみのもり, 霞ノ杜町, ${month}月号`,
      created: `${row.issued}T09:00:00+09:00`,
    },
    id: row.id,
    no: row.no,
    month: row.month,
    issued: row.issued,
    mark: row.mark,
    feature: row.feature,
    photo: row.photo,
    caption: row.caption,
    subject: row.subject,
    toc: row.toc,
    pages,
    images: row.images ?? [],
  };
}
