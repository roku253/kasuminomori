/**
 * 情報提供資料。1ページは文字。2〜3ページは写しの画像（黒帯の下に文字はない）。
 * 隠す原文は書かない。帯は行ごとに同じ長さ。
 */
import { officeDay } from "../lib/dates.mjs";
import { h, safe } from "../lib/html.mjs";

const DECIDED = officeDay("2019-10-18", "開示決定日");

const bar = safe(`<span class="bar"></span>`);

const copy1 = h`<section class="page"><div class="sheet">
  <div class="memo-head">
    <p class="org">霞ノ杜町教育委員会</p>
    <p class="line">霞教第${bar}号</p>
  </div>
  <p class="line">令和元年8月${bar}日</p>
  <p class="line" style="margin-top:4mm">霞ノ杜町長　様</p>
  <p class="stamp">印</p>
  <p class="line">霞ノ杜町教育委員会教育長</p>
  <p class="line" style="margin-top:5mm"><b>件名</b>　烏啼山道付近立入禁止区域における事案について（報告）</p>
  <p class="line" style="margin-top:4mm"><b>1　日時</b></p>
  <p class="line">令和元年8月${bar}日</p>
  <p class="line"><b>2　場所</b>　烏啼山道付近（立入禁止区域内）</p>
  <p class="line"><b>3　関係者</b></p>
  <p class="line">${bar}</p>
  <p class="line">${bar}</p>
  <p class="line">${bar}</p>
  <p class="line"><b>4　概要</b></p>
  <p class="line">${bar}</p>
  <p class="line">${bar}</p>
  <p class="line">${bar}</p>
  <p class="line">…搬送された。</p>
</div></section>`;

const copy2 = h`<section class="page"><div class="sheet">
  <p class="line"><b>5　経過</b></p>
  <p class="line">8月${bar}日</p>
  <p class="line">${bar}</p>
  <p class="line">8月${bar}日</p>
  <p class="line">保護者より事実確認の申し入れがあった。</p>
  <p class="line">（以下）</p>
  <p class="line">${bar}</p>
  <p class="line">${bar}</p>
  <p class="line" style="margin-top:4mm"><b>6　対応</b></p>
  <p class="line">${bar}</p>
  <p class="line">立入禁止区域の柵及び看板を増設する</p>
  <p class="line" style="margin-top:4mm"><b>7</b></p>
  <p class="line">本件は事故として処理し、終了とする。</p>
</div>
<p class="foot">【7条1号】　【7条5号】</p>
</section>`;

const notice = {
  date: "令和元年10月18日",
  paras: [
    "霞ノ杜町情報公開条例に基づき開示した公文書を、開示した内容のまま掲載しています。個人に関する情報など、条例で不開示とした部分は、写しのとおり一部を不開示としています。",
    "この資料は、同じ公文書について開示請求が繰り返されたため、請求のたびに写しを渡すのではなく、開示した内容をそのまま町のホームページに置くものです。新しい事実を書き足したり、不開示の部分を推測で埋めたりはしていません。",
    "次のページからが、開示した写しです。黒い帯は、行ごとに同じ長さで、不開示の部分を示します。帯の下に文字は残していません。見える行は、開示した部分だけです。",
  ],
  rows: [
    ["件名", "烏啼山道付近立入禁止区域における事案について（報告）"],
    ["作成課", "教育委員会"],
    ["作成日", "令和元年8月"],
    ["開示決定日", "令和元年10月18日"],
    ["不開示の部分", "氏名、学年、住所、関係者の発言内容など"],
    ["理由", "条例第7条第1号（個人に関する情報）、第5号（事務事業に関する情報）"],
  ],
  ask: "写しの閲覧で不明な点は、総務課総務係（情報公開、内線211）へ、平日8時30分から17時15分のあいだに電話してください。開示請求そのものの用紙も、同係の窓口にあります。",
};

export default {
  id: "joho-teikyo-01",
  file: "joho-teikyo-01.pdf",
  template: "joho",
  pages: 3,
  meta: {
    title: "情報提供資料 烏啼山道付近立入禁止区域における事案について（報告）",
    author: "霞ノ杜町 総務課",
    subject: "部分開示した公文書の写し",
    keywords: "情報公開, 情報提供資料, 霞ノ杜町, 部分開示",
    created: `${DECIDED}T09:00:00+09:00`,
  },
  notice,
  copyPages: [copy1, copy2],
  checks: {
    mustContain: [
      { page: 1, text: "一部を不開示としています" },
      { page: 1, text: "烏啼山道付近立入禁止区域における事案について（報告）" },
    ],
    mustNotContain: ["町長室", "渡辺", "児童"],
    textlessPages: [2, 3],
  },
};
