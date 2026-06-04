import manifest from "../src/content/manifest.json" with { type: "json" };
import { readFileSync } from "fs";

const routes = new Set(manifest.pages.map((p) => p.route));

const hrefs = [
  "/",
  "/kurashi/", "/kurashi/gomi/", "/kurashi/bus-jikan/", "/kurashi/suido/", "/kurashi/juminhyo/",
  "/kurashi/tetsuzuki-navi/", "/kurashi/tetsuzuki-search/", "/kurashi/bus-roke/", "/kurashi/gomi-search/",
  "/kurashi/chizu/", "/kurashi/denshi-shinsei/", "/kurashi/kankyo/", "/kurashi/sumai/",
  "/anzen/", "/anzen/saigai/", "/anzen/bosai/", "/anzen/hazard/", "/anzen/koutsuu/", "/anzen/kinkyu/",
  "/fukushi/", "/fukushi/kenko/", "/fukushi/kaigo/", "/fukushi/hoken/",
  "/kodomo/", "/kodomo/shogakkou/", "/kodomo/hoiku/", "/kodomo/toshokan/", "/kodomo/kosodate/",
  "/sangyo/", "/sangyo/ringyo/", "/sangyo/kankou-sangyo/", "/sangyo/shogyo/", "/sangyo/koyo/",
  "/bunka/", "/bunka/bunka/", "/bunka/sports/", "/bunka/events-calendar/",
  "/guide/", "/events/", "/history/", "/access/", "/contact/", "/documents/",
  "/shisei/", "/shisei/chijitsu/", "/shisei/koho/", "/shisei/yakuba/", "/shisei/shozoku/",
  "/shisei/senkyo/", "/shisei/open-data/", "/shisei/archive/",
  "/spot/1/", "/spot/2/", "/spot/3/", "/spot/4/", "/spot/5/",
  "/blog/2016/", "/blog/2021/",
];

const missing = hrefs.filter((r) => r !== "/" && !routes.has(r));
console.log("Missing routes:", missing);

const thin = manifest.pages
  .filter((p) => {
    const textLen =
      (p.paragraphs?.join("")?.length ?? 0) +
      (p.bodyHtml?.length ?? 0) +
      (p.extraHtml?.length ?? 0);
    return textLen < 400 && p.layout === "city";
  })
  .map((p) => ({ route: p.route, len: p.title }));

console.log("Thin city pages (<400 chars):", thin);
