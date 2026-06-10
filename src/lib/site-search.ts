import { sitePath } from "@/lib/site";

export type SearchTier = "noise" | "hub" | "story";

export type SearchIndexDoc = {
  route: string;
  title: string;
  category: string;
  snippet: string;
  keywords: string[];
  tier: SearchTier;
};

export type SearchIndex = {
  generatedAt: string;
  pageCount: number;
  storyQueryTerms: string[];
  idf: Record<string, string | number>;
  docs: SearchIndexDoc[];
};

export type SearchHit = {
  route: string;
  title: string;
  category: string;
  snippet: string;
  score: number;
};

/** クエリ展開（部分一致・類義語） */
export const QUERY_SYNONYMS: Record<string, string[]> = {
  ゴミ: ["ごみ", "廃棄物", "リサイクル", "収集", "分別"],
  ごみ: ["ゴミ", "廃棄物", "リサイクル", "収集"],
  広報: ["広報誌", "霞ノ杜", "配布", "バックナンバー"],
  広報誌: ["広報", "霞ノ杜", "お知らせ"],
  議会: ["町議会", "議会だより", "公報"],
  資料: ["資料室", "公報", "文書", "アーカイブ"],
  伝承: ["言い伝え", "民俗", "昔話", "神隠し"],
  神隠し: ["伝承", "言い伝え", "怪奇"],
  バス: ["町営バス", "路線", "時刻表"],
  祭り: ["行事", "イベント", "例大祭", "夏祭り"],
  観光: ["スポット", "神社", "吊り橋", "足湯"],
  防災: ["避難", "ハザード", "災害", "緊急"],
  小学校: ["教育", "学校", "子ども"],
  2019: ["令和元年", "ローカルニュース", "出来事"],
  事故: ["安全", "登山", "立入禁止"],
  山: ["烏啼", "山道", "登山", "林道"],
};

const TIER_WEIGHT: Record<SearchTier, number> = {
  noise: 1,
  hub: 0.82,
  story: 0.48,
};

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

function tokenizeQuery(query: string): string[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const terms = new Set<string>();
  terms.add(q);
  const words = q.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9]{2,}/gu);
  if (words) words.forEach((w) => terms.add(w));
  for (const ch of q.replace(/\s+/g, "")) {
    if (/[\p{Script=Han}]/u.test(ch)) terms.add(ch);
  }
  for (const [key, syns] of Object.entries(QUERY_SYNONYMS)) {
    const nk = normalize(key);
    if (q.includes(nk) || [...terms].some((t) => nk.includes(t) || t.includes(nk))) {
      terms.add(nk);
      syns.forEach((s) => terms.add(normalize(s)));
    }
  }
  return [...terms].filter((t) => t.length >= 1);
}

function idfWeight(index: SearchIndex, term: string): number {
  const w = index.idf[term];
  if (typeof w === "number") return w;
  return 1;
}

function matchesStoryQuery(query: string, storyTerms: string[]): boolean {
  const q = normalize(query);
  return storyTerms.some((t) => q.includes(normalize(t)));
}

function scoreDoc(
  doc: SearchIndexDoc,
  terms: string[],
  index: SearchIndex,
  storyQuery: boolean
): number {
  const blob = normalize(`${doc.title} ${doc.snippet} ${doc.keywords.join(" ")}`);
  let score = 0;

  for (const term of terms) {
    if (term.length < 2 && !/[\p{Script=Han}]/u.test(term)) continue;
    const idf = idfWeight(index, term);
    if (normalize(doc.title).includes(term)) score += 14 * idf;
    if (blob.includes(term)) score += 9 * idf;
    for (const kw of doc.keywords) {
      const nkw = normalize(kw);
      if (nkw.includes(term) || term.includes(nkw)) score += 5 * idf;
    }
  }

  if (score <= 0) return 0;

  score *= TIER_WEIGHT[doc.tier];

  if (storyQuery && doc.tier === "story") {
    score *= 0.55;
  }

  return score;
}

export function searchSiteIndex(
  index: SearchIndex,
  query: string,
  limit = 8
): SearchHit[] {
  const terms = tokenizeQuery(query);
  if (!terms.length) return [];

  const storyQuery = matchesStoryQuery(query, index.storyQueryTerms || []);

  const hits = index.docs
    .map((doc) => ({
      route: doc.route,
      title: doc.title,
      category: doc.category,
      snippet: doc.snippet,
      score: scoreDoc(doc, terms, index, storyQuery),
    }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score);

  return hits.slice(0, limit);
}

export function searchIndexUrl(): string {
  return sitePath("/search-index.json");
}
