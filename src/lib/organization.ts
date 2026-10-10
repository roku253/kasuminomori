import org from "@/content/data/organization.json";
import type { CityPageContent } from "@/lib/content/types";

/**
 * 町の組織（src/content/data/organization.json＝r2-director B-3）から、ページの担当（課・係・階・内線）と更新日を決める。
 * ページ JSON の owner・updated が優先。無ければ defaults（route の前方一致でいちばん長いもの）。
 */
export type OwnerInfo = {
  /** 例「総務課 地域安全係」「議会事務局」 */
  name: string;
  floor: string;
  ext: string;
};

type Department = (typeof org.departments)[number] & {
  sections?: { name: string; ext: string }[];
  ext?: string;
};

const OWNERS = new Map<string, OwnerInfo>();
for (const dept of org.departments as Department[]) {
  if (dept.sections) {
    for (const s of dept.sections) {
      const name = `${dept.name} ${s.name}`;
      OWNERS.set(name, { name, floor: dept.floor, ext: s.ext });
    }
  } else if (dept.ext) {
    OWNERS.set(dept.name, { name: dept.name, floor: dept.floor, ext: dept.ext });
  }
}

export function ownerNames(): string[] {
  return [...OWNERS.keys()];
}

export function findOwner(name: string): OwnerInfo | undefined {
  return OWNERS.get(name.replace(/\s+/g, " ").trim());
}

function defaultOwnerName(route: string): string {
  let best = { prefix: "", owner: "" };
  for (const d of org.defaults.owners) {
    if (route.startsWith(d.prefix) && d.prefix.length > best.prefix.length) best = d;
  }
  return best.owner;
}

/** ページの担当。JSON の owner（未登録なら build-manifest が止める）→ 既定値の順 */
export function pageOwner(page: Pick<CityPageContent, "route" | "owner">): OwnerInfo {
  const name = page.owner ?? defaultOwnerName(page.route);
  const found = findOwner(name);
  if (!found) throw new Error(`担当「${name}」が organization.json にありません（${page.route}）`);
  return found;
}

/** ページの更新日（ISO）。JSON の updated → お知らせの日付 → 既定値 */
export function pageUpdated(page: Pick<CityPageContent, "updated" | "news">): string {
  return page.updated ?? page.news?.date ?? org.defaults.updated;
}

export const CONTACT_UI = org.ui;
