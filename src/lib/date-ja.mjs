/**
 * 日付の表記（和暦・曜日）と営業日の判定。サイト（React）と Node のスクリプト（build-manifest.mjs、
 * 段階2の PDF 生成）で**同じ関数**を使うため .mjs で書く（TypeScript からは allowJs で読む）。
 *
 * - 日付は ISO 形式の文字列 "2026-10-09" で持ち、表示はここで作る（「令和8年10月9日」「令和8年10月9日（金）」）。
 * - 祝日は作中で使う年だけを表にしている（HOLIDAYS）。表に無い年の祝日は判定しない（土日だけ見る）。
 */

/** 作中の現在（令和8年10月10日（土）。確定版 §2-6）。更新日・お知らせの日付はこれ以前 */
export const STORY_TODAY = "2026-10-10";

/** 国民の祝日・休日（振替休日・国民の休日を含む） */
export const HOLIDAYS = {
  2026: [
    "2026-01-01", // 元日
    "2026-01-12", // 成人の日
    "2026-02-11", // 建国記念の日
    "2026-02-23", // 天皇誕生日
    "2026-03-20", // 春分の日
    "2026-04-29", // 昭和の日
    "2026-05-03", // 憲法記念日
    "2026-05-04", // みどりの日
    "2026-05-05", // こどもの日
    "2026-05-06", // 振替休日
    "2026-07-20", // 海の日
    "2026-08-11", // 山の日
    "2026-09-21", // 敬老の日
    "2026-09-22", // 国民の休日
    "2026-09-23", // 秋分の日
    "2026-10-12", // スポーツの日
    "2026-11-03", // 文化の日
    "2026-11-23", // 勤労感謝の日
  ],
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "2026-10-09" を年・月・日に分ける。暦に無い日（2026-02-30 など）は null。
 * @param {string} iso
 * @returns {{ y: number, m: number, d: number } | null}
 */
export function parseIsoDate(iso) {
  const match = ISO_RE.exec(String(iso ?? ""));
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return { y, m, d };
}

/**
 * 曜日（"日"〜"土"）
 * @param {string} iso
 * @returns {string}
 */
export function weekdayJa(iso) {
  const p = parseIsoDate(iso);
  if (!p) throw new Error(`日付の形が違います: ${iso}`);
  return WEEKDAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
}

/**
 * 和暦の年（"令和8年"・"令和元年"・"平成31年"）
 * @param {string} iso
 * @returns {string}
 */
export function warekiYear(iso) {
  const p = parseIsoDate(iso);
  if (!p) throw new Error(`日付の形が違います: ${iso}`);
  const key = p.y * 10000 + p.m * 100 + p.d;
  let era;
  let n;
  if (key >= 20190501) {
    era = "令和";
    n = p.y - 2018;
  } else if (key >= 19890108) {
    era = "平成";
    n = p.y - 1988;
  } else {
    era = "昭和";
    n = p.y - 1925;
  }
  return `${era}${n === 1 ? "元" : n}年`;
}

/**
 * 「令和8年10月9日」（weekday: true なら「令和8年10月9日（金）」）
 * @param {string} iso
 * @param {{ weekday?: boolean }} [options]
 * @returns {string}
 */
export function formatJaDate(iso, options = {}) {
  const p = parseIsoDate(iso);
  if (!p) throw new Error(`日付の形が違います: ${iso}`);
  const text = `${warekiYear(iso)}${p.m}月${p.d}日`;
  return options.weekday ? `${text}（${weekdayJa(iso)}）` : text;
}

/**
 * 祝日・休日か（HOLIDAYS に載っている年だけ判定）
 * @param {string} iso
 * @returns {boolean}
 */
export function isHoliday(iso) {
  const p = parseIsoDate(iso);
  if (!p) return false;
  return (HOLIDAYS[p.y] ?? []).includes(iso);
}

/**
 * 役場の開いている日（土日・祝日・12月29日〜1月3日 以外）か
 * @param {string} iso
 * @returns {boolean}
 */
export function isOfficeDay(iso) {
  const p = parseIsoDate(iso);
  if (!p) return false;
  const w = weekdayJa(iso);
  if (w === "土" || w === "日") return false;
  if ((p.m === 12 && p.d >= 29) || (p.m === 1 && p.d <= 3)) return false;
  return !isHoliday(iso);
}
