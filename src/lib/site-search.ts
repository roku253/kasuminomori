import { BASE_PATH } from "@/lib/site";
import { normalizeForMatch } from "@/lib/normalize";

/**
 * サイト内検索（ブラウザ内で動く）。索引は scripts/build-search-index.mjs が作る public/search-index.json。
 * - 空白で区切った語をすべて含むページだけを出す（AND）。語ごとに同義語（日常語）のどれかを含めばよい。
 * - 1文字の語は題名だけで照合する（1文字の部分一致は雑音が多いため）。
 * - 順位: 題名 > 検索語 > 見出し > 説明文 > 本文（本文は出現回数に上限つき＋最初に出る位置が前ほど少し加点）。
 * - 結果に出すのは題名・分類・説明文だけ（本文の抜粋は出さない）。
 */
export type SearchDoc = {
  route: string;
  title: string;
  category: string;
  description: string;
  /** 以下は照合用（正規化済み）: 題名・検索語・見出し・説明文・本文 */
  t: string;
  k: string;
  h: string;
  d: string;
  x: string;
};

export type SearchIndex = {
  version: number;
  synonyms: Record<string, string[]>;
  docs: SearchDoc[];
};

export type SearchHit = {
  route: string;
  title: string;
  category: string;
  description: string;
  score: number;
};

let indexPromise: Promise<SearchIndex> | null = null;

/** 索引を一度だけ読み込む（失敗したら次の呼び出しで読み直す） */
export function loadSearchIndex(): Promise<SearchIndex> {
  if (!indexPromise) {
    indexPromise = fetch(`${BASE_PATH}/search-index.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`search-index.json: ${res.status}`);
        return res.json() as Promise<SearchIndex>;
      })
      .catch((error) => {
        indexPromise = null;
        throw error;
      });
  }
  return indexPromise;
}

function countOccurrences(haystack: string, needle: string, max: number): number {
  let count = 0;
  let from = 0;
  while (count < max) {
    const i = haystack.indexOf(needle, from);
    if (i < 0) break;
    count += 1;
    from = i + needle.length;
  }
  return count;
}

function variantScore(doc: SearchDoc, variant: string): number {
  if (!variant) return 0;
  if ([...variant].length === 1) return doc.t.includes(variant) ? 10 : 0;
  let score = 0;
  if (doc.t.includes(variant)) score += 10;
  if (doc.k.includes(variant)) score += 6;
  if (doc.h.includes(variant)) score += 4;
  if (doc.d.includes(variant)) score += 3;
  const n = countOccurrences(doc.x, variant, 5);
  if (n > 0) {
    // 本文: 出現回数（上限5）に加えて、最初に出てくる位置が前ほど少し高くする
    score += 1 + (n - 1) * 0.5 + 0.5 * (1 - doc.x.indexOf(variant) / Math.max(doc.x.length, 1));
  }
  return score;
}

/** 1つの語（と同義語）の得点。どれにも当たらなければ 0 */
function termScore(doc: SearchDoc, term: string, synonyms: Record<string, string[]>): number {
  let best = variantScore(doc, term);
  for (const syn of synonyms[term] ?? []) {
    best = Math.max(best, variantScore(doc, syn) * 0.7);
  }
  return best;
}

function rank(index: SearchIndex, terms: string[], whole: string): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const doc of index.docs) {
    let total = 0;
    let matchedAll = true;
    for (const term of terms) {
      const s = termScore(doc, term, index.synonyms);
      if (s <= 0) {
        matchedAll = false;
        break;
      }
      total += s;
    }
    if (!matchedAll) continue;
    if (doc.t === whole) total += 8;
    hits.push({ route: doc.route, title: doc.title, category: doc.category, description: doc.description, score: total });
  }
  return hits.sort((a, b) => b.score - a.score || a.route.localeCompare(b.route));
}

/** 「ごみの出し方」のように助詞でつながった語を分ける（その語のままでは1件も無いときだけ使う） */
function splitByParticles(term: string): string[] {
  return term.split(/[のをにはがでとへや]/).filter((w) => [...w].length >= 2);
}

export function searchSiteIndex(index: SearchIndex, query: string, limit?: number): SearchHit[] {
  const whole = normalizeForMatch(query);
  if (!whole) return [];
  const terms = [...new Set(whole.split(" ").filter(Boolean))];
  let hits = rank(index, terms, whole);
  if (!hits.length) {
    const split = [
      ...new Set(
        terms.flatMap((t) => {
          const parts = t.length > 2 ? splitByParticles(t) : [];
          return parts.length ? parts : [t];
        })
      ),
    ];
    if (split.length && split.join(" ") !== terms.join(" ")) hits = rank(index, split, whole);
  }
  return typeof limit === "number" ? hits.slice(0, limit) : hits;
}
