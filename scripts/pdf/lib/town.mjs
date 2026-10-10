/**
 * 町の確定値（住所・電話・組織）。PDF の奥付・記事末の「問」はここから描く。
 *
 * - 組織（課・係・階・内線）は src/content/data/organization.json（r2-director B-3 の正本）を読む。
 * - 住所・電話・FAX は src/lib/site.ts の TOWN と同じ値（.ts は読めないので写し、checkTownConstants() で一致を確かめる）。
 * - メールアドレスは載せない。電話は「0266-12-2111（内線 215）」の形。
 */
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./html.mjs";

export const TOWN = {
  name: "霞ノ杜町",
  office: "霞ノ杜町役場",
  postalCode: "〒392-0391",
  address: "長野県霞郡霞ノ杜町三日月中央2丁目8番1号",
  tel: "0266-12-2111",
  fax: "0266-12-2190",
};

/** src/lib/site.ts の TOWN と食い違っていたら止める */
export function checkTownConstants() {
  const src = fs.readFileSync(path.join(REPO_ROOT, "src", "lib", "site.ts"), "utf8");
  for (const [k, v] of Object.entries(TOWN)) {
    if (!src.includes(`${k}: "${v}"`)) throw new Error(`lib/town.mjs の ${k}「${v}」が src/lib/site.ts の TOWN と違います`);
  }
}

const org = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "src", "content", "data", "organization.json"), "utf8"));

/**
 * 「総務課 地域安全係」「議会事務局」などの名前から、課・係・階・内線を引く。無ければ止める。
 * @param {string} name
 */
export function unit(name) {
  for (const d of org.departments) {
    if (d.name === name && d.ext) return { name: d.name, dept: d.name, section: "", floor: d.floor, ext: d.ext };
    for (const s of d.sections || []) {
      if (`${d.name} ${s.name}` === name) return { name, dept: d.name, section: s.name, floor: d.floor, ext: s.ext };
    }
  }
  throw new Error(`組織の正本（organization.json）に無い名前です: ${name}`);
}

/** 「電話 0266-12-2111（内線 215）」 */
export const telExt = (name) => `電話 ${TOWN.tel}（内線 ${unit(name).ext}）`;
/** 「0266-12-2111（内線 215）」 */
export const telNo = (name) => `${TOWN.tel}（内線 ${unit(name).ext}）`;
