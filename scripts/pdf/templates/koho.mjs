import { blocks } from "../lib/blocks.mjs";
import { full } from "../lib/dates.mjs";
import { css, h, publicFile, t } from "../lib/html.mjs";
import { TOWN } from "../lib/town.mjs";
import { HOLIDAYS, parseIsoDate } from "../../../src/lib/date-ja.mjs";

const HOLIDAY_SHORT = {
  "2026-05-03": "憲法記念日",
  "2026-05-04": "みどりの日",
  "2026-05-05": "こどもの日",
  "2026-05-06": "振替休日",
  "2026-07-20": "海の日",
  "2026-08-11": "山の日",
  "2026-09-21": "敬老の日",
  "2026-09-22": "休日",
  "2026-09-23": "秋分の日",
  "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日",
  "2026-11-23": "勤労感謝の日",
};

const ESSAY = {
  "5": "水を入れた田のうえを、風がひと筋走る。蛙の声は、まだ夜のほうが多い。あぜに腰を下ろすと、水面が空を映している。田植えのあとの町は、しばらくこの音だ。",
  "6": "湖が消える朝がある。対岸の灯が、霧の中で一つだけ残る。駅のホームで人が立ち止まり、汽笛を待っている。霧は、昼前には湖面へ戻る。",
  "7": "橋の下で水の音が変わる。増えた、と教える音だ。欄干に手を置くと、木がひんやりしている。雨の翌日は、橋の上から見るだけでいい。",
  "8": "湖の上に花が開いて、すぐに暗くなる。波の音だけが残る。帰りの道で、誰かの下駄が石を踏む。夏の終わりは、いつも夜のほうから来る。",
  "9": "稲の穂が重くなり、あぜの草が乾く。風のにおいが変わる週だ。朝、バケツの水が冷たい。実りの町は、話す声まで少し低くなる。",
  "10": "新米を炊くと、家の中まで秋になる。茶碗のふちまで、湯気が立つ。窓を開けると、刈ったあとの田が明るい。一年で、台所がいちばん忙しい朝だ。",
};
const EDITOR = {
  "5": "予算の号です。気になる事業は、担当の課へ電話してください。納付書が届いたら、納期限の曜日も見てください。",
  "6": "霧の季節です。朝の外出は、ライトを早めに。納税通知は、届いた週のうちに中を確かめてください。",
  "7": "川は、雨のあとが危ないです。増水のときは橋の上から見てください。保険税の通知も、7月中に届きます。",
  "8": "花火の夜は、湖岸に車を止めないでください。帰りは臨時バスです。職員募集の期限は、9月4日です。",
  "9": "ハザードマップが届いたら、自宅に印をつけてください。敬老の日の案内はがきも、一緒に見てください。",
  "10": "接種と健診の案内が届いているか、もう一度見てください。文化祭の申し込みは、16日が期限です。",
};

function art(a) {
  let lead = true;
  const body = (a.body || []).map((b) => {
    if (lead && typeof b === "string") {
      lead = false;
      return { p: b, cls: "lead" };
    }
    return b;
  });
  return h`<section class="art"><h2 class="art-h">${t(a.h)}</h2><div class="art-body">${blocks(body)}</div></section>`;
}

function isoOf(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function collectEvents(doc) {
  const month = Number(doc.month);
  const out = [];
  for (const sheet of doc.sheets) {
    for (const a of sheet.articles || []) {
      if (!String(a.h).includes("カレンダー")) continue;
      for (const b of a.body || []) {
        if (!b || !b.table) continue;
        for (const row of b.table.rows) {
          const mm = String(row[0]).match(/(\d+)月(\d+)日/);
          if (mm && Number(mm[1]) === month) out.push({ d: Number(mm[2]), label: String(row[1]) });
        }
      }
    }
  }
  return out;
}

function calendar(iso, events, compact) {
  const { y, m } = parseIsoDate(iso);
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const ev = new Map();
  for (const e of events) {
    const arr = ev.get(e.d) || [];
    arr.push(e.label);
    ev.set(e.d, arr);
  }
  const head = ["日", "月", "火", "水", "木", "金", "土"];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return h`<table class="cal${compact ? " compact" : ""}"><thead><tr>${head.map((w) => h`<th>${w}</th>`)}</tr></thead><tbody>${weeks.map(
    (week) =>
      h`<tr>${week.map((d, i) => {
        if (!d) return h`<td class="out"></td>`;
        const isoDay = isoOf(y, m, d);
        const names = ev.get(d) || [];
        if (!names.length && HOLIDAY_SHORT[isoDay]) names.push(HOLIDAY_SHORT[isoDay]);
        const cls = [i === 0 ? "sun" : "", i === 6 ? "sat" : "", (HOLIDAYS[y] || []).includes(isoDay) ? "hol" : "", names.length ? "ev" : ""]
          .filter(Boolean)
          .join(" ");
        const mark = compact ? "" : names[0] || "";
        return h`<td class="${cls}"><span class="d">${d}</span>${mark ? h`<span class="mark">${t(mark)}</span>` : ""}</td>`;
      })}</tr>`,
  )}</tbody></table>`;
}

function holidayLine(iso) {
  const { y, m } = parseIsoDate(iso);
  const list = (HOLIDAYS[y] || []).filter((d) => parseIsoDate(d).m === m).map((d) => `${parseIsoDate(d).d}日 ${HOLIDAY_SHORT[d] || "休日"}`);
  if (!list.length) return "この月の祝日・休日はありません。土日は閉庁です。";
  return `閉庁は土日と、${list.join("、")}です。`;
}

function comma(n) {
  return n.toLocaleString("ja-JP");
}

function popOf(sheet) {
  const a = (sheet.articles || []).find((x) => x.h === "人口");
  const s = (a?.body || []).find((x) => typeof x === "string") || "";
  const m = s.match(/([0-9,]+)人、([0-9,]+)世帯/);
  if (!m) return null;
  return [Number(m[1].replace(/,/g, "")), Number(m[2].replace(/,/g, ""))];
}

function districts(people, houses) {
  const share = (total, ratios) => {
    const head = ratios.map((r) => Math.round(total * r));
    head.push(total - head.reduce((a, b) => a + b, 0));
    return head;
  };
  const names = ["三日月", "湖畔", "駅前", "杜ケ丘"];
  const p = share(people, [0.362, 0.256, 0.279]);
  const hh = share(houses, [0.366, 0.255, 0.276]);
  return { table: { cls: "data", widths: ["40%", "30%", "30%"], head: ["地区", "人口", "世帯"], rows: names.map((n, i) => [n, `${comma(p[i])}人`, `${comma(hh[i])}世帯`]) } };
}

const DIRECTORY = [
  ["総務課 総務係", "2階", "211"],
  ["総務課 地域安全係", "2階", "215"],
  ["政策推進課 企画財政係", "2階", "241"],
  ["政策推進課 広報情報係", "2階", "244"],
  ["住民税務課 住民係", "1階", "111"],
  ["住民税務課 税務係", "1階", "114"],
  ["住民税務課 環境係", "1階", "117"],
  ["保健福祉課 福祉係", "1階", "121"],
  ["保健福祉課 介護保険係", "1階", "124"],
  ["保健福祉課 保健係", "1階", "127"],
  ["産業観光課 農林係", "2階", "221"],
  ["産業観光課 商工観光係", "2階", "224"],
  ["建設水道課 建設係", "2階", "231"],
  ["建設水道課 上下水道係", "2階", "234"],
  ["教育課 学校教育係", "3階", "311"],
  ["教育課 こども係", "3階", "314"],
  ["教育課 生涯学習係", "3階", "317"],
  ["会計室", "1階", "130"],
  ["議会事務局", "3階", "320"],
];

function Tbus() {
  return {
    table: {
      cls: "data",
      widths: ["28%", "72%"],
      caption: "町営バス（駅前発）",
      rows: [
        ["7:10", "役場・杜ケ丘・成沢まわり"],
        ["9:00", "同"],
        ["11:00", "同"],
        ["13:10", "同"],
        ["15:10", "同"],
        ["17:10", "同"],
        ["運賃", "大人200円・小児100円。支払いは現金。1周約25分"],
      ],
    },
  };
}

function colophon(doc, date) {
  return h`<div class="colo">
    <p><b>広報かすみのもり</b>　No.${doc.no}　${doc.month}月号　${date}発行</p>
    <p>編集・発行　霞ノ杜町 政策推進課 広報情報係　電話 ${TOWN.tel}（代表・内線244）　FAX ${TOWN.fax}</p>
    <p>${TOWN.postalCode}　${TOWN.address}　この広報紙は、毎月10日に町内の各世帯へお届けしています。</p>
  </div>`;
}

function blurb(doc, pageNum) {
  const sheet = doc.sheets[Number(pageNum) - 2];
  const arts = [...(sheet?.articles || []), ...((sheet?.two || []).flat() || [])];
  const first = arts[0]?.body?.find((b) => typeof b === "string") || "";
  const s = first.replace(/\s+/g, "");
  return s.length > 42 ? `${s.slice(0, 42)}…` : s;
}

function contactBar() {
  return h`<div class="contact"><div class="emg"><p>役場の代表</p><p class="big">${TOWN.tel}</p><p>平日 8:30〜17:15</p></div><div class="where"><p>記事の「問」の内線を、代表電話のあとにお伝えください。</p><p>訂正は次の号とホームページ。電子版は直近6か月分、それより前は町立図書館です。</p><p>FAX ${TOWN.fax}　${TOWN.postalCode}　${TOWN.address}</p></div></div>`;
}

function photo(sheet) {
  if (!sheet.photo) return "";
  return h`<figure class="wide"><img src="${publicFile(sheet.photo)}" alt=""><figcaption>${t(sheet.caption || "")}</figcaption></figure>`;
}

function columns(left, right) {
  return h`<div class="grid2"><div class="col">${left.map(art)}</div><div class="col">${right.map(art)}</div></div>`;
}

export default {
  render(doc) {
    const date = full(doc.issued);
    const events = collectEvents(doc);
    const cover = h`<section class="page"><div class="sheet cover">
      <header class="mastbar">
        <div>
          <p class="brand">霞ノ杜町　毎月10日発行</p>
          <h1>広報かすみのもり</h1>
        </div>
        <div class="issuemeta">
          <p class="no">No.${doc.no}</p>
          <p>${doc.month}月号</p>
          <p>${date}</p>
        </div>
      </header>
      <figure class="hero"><img src="${publicFile(doc.cover.photo)}" alt=""><figcaption>${t(doc.cover.caption)}</figcaption></figure>
      <div class="cover-mid">
        <div>
          <h2 class="toc-h">今号のもくじ</h2>
          <ul class="toc">${doc.cover.toc.map(([label, pg]) => h`<li><span class="label">${t(label)}</span><span class="pg">${pg}</span><span class="blurb">${t(blurb(doc, pg))}</span></li>`)}</ul>
        </div>
        <div class="read">
          <h2 class="toc-h">この号の読み方</h2>
          <p>記事の末尾の「問」は、役場の担当係です。代表電話 ${TOWN.tel} のあと、内線を伝えてください。</p>
          <p>電子版は町のホームページに、直近6か月分を載せています。それより前の号は、町立図書館です。</p>
          <p>${holidayLine(doc.issued)}</p>
        </div>
      </div>
      <div class="cal-wrap">
        <h2>${doc.month}月</h2>
        ${calendar(doc.issued, events, true)}
        ${
          events.length
            ? h`<table class="data evlist"><tbody>${events.map((e) => h`<tr><th>${doc.month}月${e.d}日</th><td>${t(e.label)}</td></tr>`)}</tbody></table>`
            : ""
        }
      </div>
      <div class="boxes">
        <div class="box"><b>配布</b><p>毎月10日、町内の全世帯へ。集会所と役場1階にも置きます。</p></div>
        <div class="box"><b>訂正</b><p>間違いは次の号と、ホームページのお知らせに出します。</p></div>
        <div class="box"><b>窓口</b><p>平日 8:30〜17:15。代表 ${TOWN.tel}</p></div>
      </div>
    </div><p class="nombre right">1</p></section>`;

    const rest = doc.sheets.map((sheet, i) => {
      const n = i + 2;
      const isCal = (sheet.articles || []).some((a) => String(a.h).includes("カレンダー"));
      let body;
      if (n === 12) {
        const nums = popOf(sheet);
        const pop = (sheet.articles || []).filter((a) => a.h === "人口");
        body = h`${columns(
          [
            ...pop,
            ...(nums ? [{ h: "地区別", body: ["住民基本台帳の地区別です。人口と世帯の合計は、上の数と一致します。", districts(nums[0], nums[1])] }] : []),
            { h: "町民文芸", body: [ESSAY[doc.month] || ""] },
            { h: "編集後記", body: [EDITOR[doc.month] || ""] },
          ],
          [
            {
              h: "課の電話",
              body: [
                `代表 ${TOWN.tel} のあと、内線を伝えてください。`,
                { table: { cls: "data", widths: ["58%", "18%", "24%"], head: ["担当", "階", "内線"], rows: DIRECTORY } },
              ],
            },
          ],
        )}<div class="below">${art({
          h: "窓口とバス",
          body: [
            "役場は平日 8:30〜17:15です。診療所は平日 9:00〜17:00、土曜 9:00〜12:00。図書館は火〜金 9:00〜18:00、土曜 9:00〜17:00で、日曜・月曜と祝日は休館です。",
            Tbus(),
          ],
        })}</div>${colophon(doc, date)}`;
      } else if (isCal) {
        body = h`<div class="cal-wrap"><h2>${sheet.articles[0].h}</h2>${calendar(doc.issued, events, false)}<p class="hol-note">${t(holidayLine(doc.issued))} 色の付いた日は、この号で案内している日です。</p></div>${art({ ...sheet.articles[0], h: "この月の主な日" })}${sheet.below ? h`<div class="below">${art(sheet.below)}</div>` : ""}${contactBar()}`;
      } else {
        const left = sheet.two ? sheet.two[0] : sheet.articles || [];
        const right = sheet.two ? sheet.two[1] : [...(sheet.side ? [sheet.side] : []), ...(sheet.moreRight || [])];
        body = h`${photo(sheet)}${columns(left, right)}${sheet.below ? h`<div class="below">${art(sheet.below)}</div>` : ""}${contactBar()}`;
      }
      return h`<section class="page"><div class="sheet">
        <p class="running"><span><b>広報かすみのもり</b>　No.${doc.no}　${doc.month}月号</span><span>${date}</span></p>
        ${body}
      </div><p class="nombre ${n % 2 ? "right" : "left"}">${n}</p></section>`;
    });
    return { styles: css("base.css", "koho.css"), pages: [cover, ...rest] };
  },
};
