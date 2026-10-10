/**
 * PDF の日付表記。和暦・曜日はサイトと同じ関数（src/lib/date-ja.mjs）を使い、手で曜日を書かない。
 *
 *   md("2019-09-03")        → "9月3日（火）"
 *   mdPlain("2019-09-03")   → "9月3日"
 *   full("2019-11-01")      → "令和元年11月1日（金）"
 *   fullPlain("2019-11-01") → "令和元年11月1日"
 *   officeDay("2019-11-01", "発行日") → 平日でなければ止める（土日・祝日・年末年始）
 *
 * date-ja.mjs の祝日表は作中の現在（令和8年）だけなので、PDF が使う年の祝日をここで補う（検査用）。
 */
import { formatJaDate, parseIsoDate, warekiYear, weekdayJa } from "../../../src/lib/date-ja.mjs";

/** PDF で使う年の国民の祝日・休日（振替休日・国民の休日を含む） */
const HOLIDAYS = {
  2019: [
    "2019-01-01", "2019-01-14", "2019-02-11", "2019-03-21", "2019-04-29", "2019-04-30", "2019-05-01", "2019-05-02",
    "2019-05-03", "2019-05-04", "2019-05-05", "2019-05-06", "2019-07-15", "2019-08-11", "2019-08-12", "2019-09-16",
    "2019-09-23", "2019-10-14", "2019-10-22", "2019-11-03", "2019-11-04", "2019-11-23",
  ],
  2025: [
    "2025-01-01", "2025-01-13", "2025-02-11", "2025-02-23", "2025-02-24", "2025-03-20", "2025-04-29", "2025-05-03",
    "2025-05-04", "2025-05-05", "2025-05-06", "2025-07-21", "2025-08-11", "2025-09-15", "2025-09-23", "2025-10-13",
    "2025-11-03", "2025-11-23", "2025-11-24",
  ],
};

function parts(iso) {
  const p = parseIsoDate(iso);
  if (!p) throw new Error(`日付の形が違います: ${iso}`);
  return p;
}

export const weekday = (iso) => weekdayJa(iso);
export const md = (iso) => {
  const p = parts(iso);
  return `${p.m}月${p.d}日（${weekdayJa(iso)}）`;
};
export const mdPlain = (iso) => {
  const p = parts(iso);
  return `${p.m}月${p.d}日`;
};
/** 「9月11日（水）・12日（木）」のように同じ月の続く日を並べる */
export const mdSeq = (...isos) =>
  isos
    .map((iso, i) => {
      const p = parts(iso);
      const prev = i > 0 ? parts(isos[i - 1]) : null;
      return prev && prev.m === p.m ? `${p.d}日（${weekdayJa(iso)}）` : md(iso);
    })
    .join("・");
/** 「9月3日（火）〜13日（金）」（月が変わるときは月も書く） */
export const mdRange = (a, b) => {
  const pa = parts(a);
  const pb = parts(b);
  return `${md(a)}〜${pa.m === pb.m ? "" : `${pb.m}月`}${pb.d}日（${weekdayJa(b)}）`;
};
export const full = (iso) => formatJaDate(iso, { weekday: true });
export const fullPlain = (iso) => formatJaDate(iso);
export const year = (iso) => warekiYear(iso);
/** 和暦の年月「令和元年8月」 */
export const ym = (iso) => `${warekiYear(iso)}${parts(iso).m}月`;

export function isHoliday(iso) {
  const p = parts(iso);
  return (HOLIDAYS[p.y] ?? []).includes(iso);
}

/** 役場の開いている日か（土日・祝日・12月29日〜1月3日 以外）。祝日表の無い年は止める（確かめられないため） */
export function isOfficeDay(iso) {
  const p = parts(iso);
  if (!HOLIDAYS[p.y]) throw new Error(`${p.y}年の祝日表がありません（scripts/pdf/lib/dates.mjs に足す）: ${iso}`);
  const w = weekdayJa(iso);
  if (w === "土" || w === "日") return false;
  if ((p.m === 12 && p.d >= 29) || (p.m === 1 && p.d <= 3)) return false;
  return !isHoliday(iso);
}

/** 平日でなければ止める（発行日・会議の日など） */
export function officeDay(iso, label = "") {
  if (!isOfficeDay(iso)) throw new Error(`平日ではありません${label ? `（${label}）` : ""}: ${iso}（${weekdayJa(iso)}）`);
  return iso;
}
