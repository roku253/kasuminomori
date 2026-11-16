/**
 * 広報本文 JSON（_koho-body.json）を docs の default export 用に読み込む。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isHoliday, md } from "../lib/dates.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(fs.readFileSync(path.join(HERE, "_koho-body.json"), "utf8"));

const ban = [
  "児童",
  "事故",
  "立入禁止",
  "絵画展",
  "年生",
  "謎解き",
  "市政",
  "藤原",
  "河川敷清掃",
  "町立霞ノ杜小学校",
  "lg.jp",
  "@",
];

const CAL_DATE_RE = /^\{\{d:(\d{4})-(\d{2})-(\d{2})\}\}$/;

function replaceDates(v) {
  if (typeof v === "string") {
    return v.replace(/\{\{d:(\d{4}-\d{2}-\d{2})\}\}/g, (_, iso) => md(iso));
  }
  if (Array.isArray(v)) return v.map(replaceDates);
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, val] of Object.entries(v)) o[k] = replaceDates(val);
    return o;
  }
  return v;
}

function utcDow(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function isoFromParts(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseIso(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`日付が読めません: ${iso}`);
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

function addDaysIso(iso, delta) {
  const { y, mo, d } = parseIso(iso);
  const dt = new Date(Date.UTC(y, mo - 1, d + delta));
  return isoFromParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function sundayOnOrBefore(iso) {
  const { y, mo, d } = parseIso(iso);
  const dow = utcDow(y, mo, d);
  return addDaysIso(iso, -dow);
}

function saturdayOnOrAfter(iso) {
  const { y, mo, d } = parseIso(iso);
  const dow = utcDow(y, mo, d);
  return addDaysIso(iso, 6 - dow);
}

function buildCalendarWeeks(rawPage, id) {
  const byIso = new Map();
  for (const row of rawPage.rows) {
    const m = CAL_DATE_RE.exec(row[0]);
    if (!m) throw new Error(`カレンダーの日付が読めません: ${id} ${row[0]}`);
    const iso = `${m[1]}-${m[2]}-${m[3]}`;
    const events = replaceDates(row[1])
      .split("／")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!byIso.has(iso)) byIso.set(iso, []);
    byIso.get(iso).push(...events);
  }
  const sorted = [...byIso.keys()].sort();
  if (!sorted.length) return [];
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const { y, mo } = parseIso(first);
  const firstOfMonth = isoFromParts(y, mo, 1);
  let start = sundayOnOrBefore(firstOfMonth);
  const end = saturdayOnOrAfter(last);
  const weeks = [];
  let week = [];
  for (let cur = start; cur <= end; cur = addDaysIso(cur, 1)) {
    const { y, mo, d } = parseIso(cur);
    const dow = utcDow(y, mo, d);
    const inRange = firstOfMonth <= cur && cur <= last;
    week.push({
      iso: cur,
      m: mo,
      d,
      dow,
      holiday: isHoliday(cur),
      inRange,
      events: inRange ? byIso.get(cur) || [] : [],
    });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  return weeks;
}

function checkBudget(row) {
  for (const pg of row.pages) {
    if (pg.kind !== "articles") continue;
    for (const a of pg.articles || []) {
      const fig = a.figure;
      if (fig && fig.type === "bars" && fig.unit === "億円") {
        const sum = fig.items.reduce((s, it) => s + it.value, 0);
        const rounded = Math.round(sum * 10) / 10;
        if (rounded !== 46.8) {
          throw new Error("予算の内訳の合計が 46.8 億円になりません");
        }
      }
    }
  }
}

const NOTICES = [
  ["窓口", "戸籍の届け出", "出生、婚姻、死亡、転入、転出は、住民税務課の窓口で届け出ます。届け出る人と、必要な書類は種類で違います。平日の8時30分から17時15分までです。", "住民税務課 住民係"],
  ["窓口", "印鑑登録", "印鑑登録は、登録する本人が窓口へ来てください。代理人のときは、本人の署名がある委任状が要ります。登録証をなくしたときは、すぐ届け出てください。", "住民税務課 住民係"],
  ["窓口", "住民票の写し", "住民票の写しと印鑑登録証明書は、窓口のほか、役場1階の自動交付機でも取れます。機械が使える時間は、開庁日の8時30分から17時です。", "住民税務課 住民係"],
  ["税", "納税証明書", "納税証明書は、税務係の窓口で発行します。口座振替の方は、引き落としの確認に数日かかることがあります。", "住民税務課 税務係"],
  ["税", "口座振替", "町税の口座振替は、税務係で申し込めます。通帳と届印、本人確認の書類を持ってきてください。残高不足だと、再振替はしません。", "住民税務課 税務係"],
  ["税", "軽自動車を手放したとき", "軽自動車やバイクを売った、廃車にしたときは、税務係へ届け出てください。届け出が遅れると、翌年度の税が残ります。", "住民税務課 税務係"],
  ["保険", "国民健康保険の加入", "職場の健康保険を抜けたときは、14日以内に国民健康保険の加入を届け出てください。保険証の代わりの資格確認書を渡します。", "住民税務課 住民係"],
  ["介護", "介護の相談", "介護が必要になったときの相談は、介護保険係です。地域包括支援センターでも、同じ内容を聞けます。予約は要りません。", "保健福祉課 介護保険係"],
  ["健康", "健診の受診券", "健診の受診券をなくしたときは、保健係で再発行します。対象の年齢と保険で、受けられる健診が違います。", "保健福祉課 保健係"],
  ["子育て", "保育の申し込み", "保育所の入所は、こども係で通年受け付けます。仕事や介護など、家庭で見られない理由を書いてください。", "教育課 こども係"],
  ["子育て", "一時預かり", "急な用事やリフレッシュのため、一時預かりを使えます。前日の正午までにこども係へ電話してください。定員になり次第、締め切ります。", "教育課 こども係"],
  ["図書館", "図書館の開館", "町立図書館は、火・木・金が9時から18時、土日が9時から17時です。月曜と祝日の翌日、月末日は休館です。", "教育課 生涯学習係"],
  ["図書館", "本の取り寄せ", "読みたい本が町内にないときは、県内の図書館から取り寄せます。カウンターで申し込んでください。届くまで1週間ほどです。", "教育課 生涯学習係"],
  ["施設", "公民館を使うとき", "公民館と町民ホールの使用は、生涯学習係で予約します。営利の催しと、飲食を伴う使用は、別の決まりがあります。", "教育課 生涯学習係"],
  ["募集", "公民館講座", "公民館講座の追加募集は、空いた回だけ受けます。材料費は実費です。申込書は生涯学習係と、各公民館にあります。", "教育課 生涯学習係"],
  ["ごみ", "ごみの分け方", "燃やすごみは週2回、資源は週1回です。地区ごとの曜日は、配布したカレンダーで確かめてください。決められた場所以外には出せません。", "住民税務課 環境係"],
  ["ごみ", "粗大ごみ", "粗大ごみは、環境係へ電話して収集日を予約します。家電4品目は、町では集めません。販売店へ相談してください。", "住民税務課 環境係"],
  ["環境", "野焼きはできません", "家庭のごみや草を、庭で燃やすことはできません。草は束ねて、燃やすごみの日に出してください。", "住民税務課 環境係"],
  ["環境", "犬の登録", "犬を飼い始めたときは、生涯で1度、登録が要ります。狂犬病の注射は毎年です。注射済票は環境係で渡します。", "住民税務課 環境係"],
  ["水道", "水道の開始と中止", "引越しで水道を開始、中止するときは、3日前までに上下水道係へ連絡してください。宅内の漏水は、メーターの先から使用者の負担です。", "建設水道課 上下水道係"],
  ["水道", "水道料金", "水道料金は2か月ごとに請求します。支払いの相談は、上下水道係です。長期の不在でも、基本料金はかかります。", "建設水道課 上下水道係"],
  ["道路", "町道の傷み", "町道の穴、側溝の詰まり、街路灯の不点灯は、建設係へ場所を知らせてください。私有地の中は、町では直せません。", "建設水道課 建設係"],
  ["道路", "冬の除雪", "除雪は、交通量の多い町道から始めます。玄関先の雪は、道路へ出さないでください。作業中の車には近づかないでください。", "建設水道課 建設係"],
  ["バス", "町営バス", "町営バスの時刻は、停留所と役場、町のホームページ案内で配っています。運賃は1回200円、小学生は100円です。", "政策推進課 企画財政係"],
  ["広報", "広報への投稿", "行事の写真や、町への意見を広報で紹介することがあります。掲載の可否は広報情報係が決めます。顔が写る写真は、本人の同意が要ります。", "政策推進課 広報情報係"],
  ["広報", "音声で聞く広報", "目の不自由な方には、広報の音声版を渡しています。希望する方は、広報情報係へ連絡してください。", "政策推進課 広報情報係"],
  ["計画", "意見を募集するとき", "町の計画案は、役場と図書館で縦覧し、意見を募集します。期間と書類は、そのつど広報と窓口で知らせます。", "政策推進課 企画財政係"],
  ["契約", "入札と契約", "町の入札公告は、役場の掲示板に出します。参加の資格は、総務係で確認してください。", "総務課 総務係"],
  ["安全", "振り込め詐欺", "役場や警察を名乗る電話で、お金やキャッシュカードを求められたら、切って地域安全係へ相談してください。役場が電話で金銭を求めることはありません。", "総務課 地域安全係"],
  ["安全", "防火と消火器", "住宅火災警報器は、寝室と階段に取り付けてください。消火器の期限が切れていないか、年に1度見てください。", "総務課 地域安全係"],
  ["安全", "避難所の場所", "避難所の場所は、ハザードマップと、役場の案内図で確かめてください。地区の説明会の日程は、広報で知らせます。", "総務課 地域安全係"],
  ["農林", "農地の相談", "農地を貸す、売る、耕さなくなったときは、農林係へ事前に相談してください。手続きの前に、農業委員会の許可が要る場合があります。", "産業観光課 農林係"],
  ["産業", "商工業の相談", "店舗の改修や、新しい仕事の相談は、商工観光係が窓口です。融資のあっせんは、要件を満たす場合に限ります。", "産業観光課 商工観光係"],
  ["統計", "統計調査", "国や県の統計調査が届いた世帯は、回答をお願いします。回答は統計の目的以外に使いません。", "政策推進課 企画財政係"],
  ["窓口", "引越しの届け出", "町外へ出るときは転出届を、町内で住所が変わるときは転居届を出してください。健康保険と手当も、同じ窓口で確認します。", "住民税務課 住民係"],
  ["教育", "就学の相談", "就学のことで悩んでいる保護者は、学校教育係へ相談してください。面談は予約制です。", "教育課 学校教育係"],
];

function padToTwelve(row, pages) {
  const next = pages.slice();
  const cal = next.findIndex((p) => p.kind === "calendar");
  const insertAt = cal >= 0 ? cal : next.length;
  const need = Math.max(0, 12 - next.length);
  const month = Number(String(row.month).replace(/[^\d]/g, "")) || 1;
  const shift = Number(row.no) % NOTICES.length;
  const extra = [];
  for (let i = 0; i < need; i++) {
    const items = [];
    for (let j = 0; j < 8; j++) {
      const n = NOTICES[(shift + i * 6 + j) % NOTICES.length];
      items.push({ kicker: n[0], h: n[1], body: n[2], toi: n[3] });
    }
    extra.push({
      kind: "kurashi",
      title: "くらしの情報",
      lead: `${month}月の窓口、募集、施設の案内です。詳しくは、担当の係へ電話してください。`,
      items,
    });
  }
  next.splice(insertAt, 0, ...extra);
  return next;
}

function tocOf(pages) {
  const out = [];
  pages.forEach((pg, idx) => {
    const n = String(idx + 1);
    if (pg.kind === "articles" && pg.articles && pg.articles[0]) {
      const h = String(pg.articles[0].h).replace(/\s+/g, "");
      out.push([h, n]);
    } else if (pg.kind === "kurashi" && !out.some((x) => x[0] === "くらしの情報")) {
      out.push(["くらしの情報", n]);
    } else if (pg.kind === "calendar") {
      out.push(["今月の予定", n]);
    }
  });
  return out.slice(0, 8);
}

const rawById = Object.fromEntries(raw.issues.map((i) => [i.id, i]));
const byId = Object.fromEntries(raw.issues.map((i) => [i.id, replaceDates(i)]));

export function issue(id) {
  const row = byId[id];
  const rawRow = rawById[id];
  if (!row) throw new Error(`広報の号が見つかりません: ${id}`);
  checkBudget(row);
  const month = row.month;
  const mustNotContain = [...ban];
  const mustContain = [
    { page: 1, text: `No.${row.no}` },
    { page: 1, text: row.mark },
  ];
  if (id !== "koho-r8-10") {
    mustNotContain.push("5,812", "2,431");
  } else {
    mustContain.push({ text: "5,812" }, { text: "2,431" });
  }
  const mapped = row.pages.map((pg, pi) => {
    if (pg.kind !== "calendar") return pg;
    const rawPg = rawRow.pages[pi];
    return { ...pg, weeks: buildCalendarWeeks(rawPg, id) };
  });
  const pages = padToTwelve(row, mapped);
  return {
    template: "koho",
    file: `${id}.pdf`,
    checks: {
      mustContain,
      mustNotContain,
      portraitOnly: true,
    },
    meta: {
      title: `広報かすみのもり ${month}月号 No.${row.no}`,
      author: "霞ノ杜町 政策推進課 広報情報係",
      subject: row.subject,
      keywords: `広報かすみのもり, 霞ノ杜町, ${month}月号`,
      created: `${row.issued}T09:00:00+09:00`,
    },
    id: row.id,
    no: row.no,
    month: row.month,
    issued: row.issued,
    mark: row.mark,
    feature: row.feature,
    photo: row.photo,
    caption: row.caption,
    subject: row.subject,
    toc: tocOf(pages),
    pages,
    images: row.images ?? [],
  };
}
