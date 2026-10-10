import { blocks } from "../lib/blocks.mjs";
import { full } from "../lib/dates.mjs";
import { css, h, publicFile, t } from "../lib/html.mjs";
import { TOWN } from "../lib/town.mjs";

function art(a) {
  return h`<section class="art"><h2>${t(a.h)}</h2><div>${blocks(a.body)}</div></section>`;
}

const ESSAY = {
  "5": "水を入れた田のうえを、風がひと筋走る。蛙の声は、まだ夜のほうが多い。",
  "6": "湖が消える朝がある。対岸の灯が、霧の中で一つだけ残る。",
  "7": "橋の下で水の音が変わる。増えた、と教える音だ。",
  "8": "湖の上に花が開いて、すぐに暗くなる。波の音だけが残る。",
  "9": "稲の穂が重くなり、あぜの草が乾く。風のにおいが変わる週だ。",
  "10": "新米を炊くと、家の中まで秋になる。茶碗のふちまで、湯気が立つ。",
};
const EDITOR = {
  "5": "予算の号です。気になる事業は、担当の課へ電話してください。",
  "6": "霧の季節です。朝の外出は、ライトを早めに。",
  "7": "川は、雨のあとが危ないです。増水のときは橋の上から見てください。",
  "8": "花火の夜は、湖岸に車を止めないでください。帰りは臨時バスです。",
  "9": "ハザードマップが届いたら、自宅に印をつけてください。",
  "10": "接種と健診の案内が届いているか、もう一度見てください。",
};

function colophon(doc, date) {
  return h`<div class="colo">
    <p><b>広報かすみのもり</b>　No.${doc.no}　${doc.month}号　${date}発行</p>
    <p>編集・発行　霞ノ杜町 政策推進課 広報情報係</p>
    <p>${TOWN.postalCode}　${TOWN.address}</p>
    <p>電話 ${TOWN.tel}（代表）　FAX ${TOWN.fax}</p>
    <p>この広報紙は、毎月10日に町内の各世帯へお届けしています。</p>
  </div>`;
}

export default {
  render(doc) {
    const date = full(doc.issued);
    const cover = h`<section class="page"><div class="sheet cover">
      <p class="brand">霞ノ杜町</p>
      <h1>広報<br>かすみのもり</h1>
      <p class="issue"><span>No.${doc.no}</span><span>${doc.month}号</span><span>${date}発行</span></p>
      <figure><img src="${publicFile(doc.cover.photo)}" alt=""><figcaption>${t(doc.cover.caption)}</figcaption></figure>
      <ul class="toc">${doc.cover.toc.map(([label, pg]) => h`<li><span>${t(label)}</span><span>${pg}</span></li>`)}</ul>
    </div><p class="nombre right">1</p></section>`;

    const rest = doc.sheets.map((sheet, i) => {
      const n = i + 2;
      return h`<section class="page"><div class="sheet">
        <p class="running"><span><b>広報かすみのもり</b>　No.${doc.no}　${doc.month}号</span><span>${date}</span></p>
        ${sheet.photo ? h`<figure class="wide"><img src="${publicFile(sheet.photo)}" alt=""><figcaption>${t(sheet.caption || "")}</figcaption></figure>` : ""}
        ${sheet.two ? h`<div class="two">${sheet.two.map((col) => h`<div>${col.map(art)}</div>`)}</div>` : sheet.articles.map(art)}
        ${
          n === 12
            ? h`${art({ h: "町民文芸", body: [ESSAY[doc.month] || ""] })}${art({ h: "編集後記", body: [EDITOR[doc.month] || ""] })}${colophon(doc, date)}`
            : h`<p class="pagefoot">開庁は平日 8:30〜17:15。代表電話 ${TOWN.tel}。この号の訂正は、次の号とホームページでお知らせします。</p>`
        }
      </div><p class="nombre ${n % 2 ? "right" : "left"}">${n}</p></section>`;
    });
    return { styles: css("base.css", "koho.css"), pages: [cover, ...rest] };
  },
};
