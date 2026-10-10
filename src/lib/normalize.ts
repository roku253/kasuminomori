/**
 * 検索・絞り込み用の文字の正規化（サイト内検索とツールで共通）。
 * 全角英数→半角（NFKC）、英字は小文字、カタカナ→ひらがな、空白は1つに。
 * 同じ規則は scripts/build-search-index.mjs にもある（索引側）。変えるときは両方を直す。
 */
export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/\s+/g, " ")
    .trim();
}

/** "{n}件" のような文の {名前} を埋める */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? String(values[key]) : m));
}
