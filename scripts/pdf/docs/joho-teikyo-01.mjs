/**
 * 情報提供資料。1ページは文字。2〜3ページは写しの画像（黒帯の下に文字はない）。
 * 隠す原文は書かない。帯は行ごとに同じ長さ。
 */
import { officeDay } from "../lib/dates.mjs";
import { h, safe } from "../lib/html.mjs";
import { TOWN } from "../lib/town.mjs";

const DECIDED = officeDay("2019-10-18", "開示決定日");

const bar = safe(`<span class="bar"></span>`);

const copy1 = h`<section class="page"><div class="sheet">
  <div class="memo-head">
    <p class="org">霞ノ杜町教育委員会</p>
    <p class="line">霞教第</p>${bar}<p class="line">号</p>
  </div>
  <p class="line">令和元年8月</p>${bar}<p class="line">日</p>
  <p class="line" style="margin-top:4mm">霞ノ杜町長　様</p>
  <p class="stamp">印</p>
  <p class="line">霞ノ杜町教育委員会教育長</p>
  <p class="line" style="margin-top:5mm"><b>件名</b>　烏啼山道付近立入禁止区域における事案について（報告）</p>
  <p class="line" style="margin-top:4mm"><b>1　日時</b></p>
  <p class="line">令和元年8月</p>${bar}<p class="line">日</p>${bar}
  <p class="line"><b>2　場所</b>　烏啼山道付近（立入禁止区域内）</p>
  <p class="line"><b>3　関係者</b></p>${bar}${bar}${bar}
  <p class="line"><b>4　概要</b></p>${bar}${bar}${bar}
  <p class="line">…搬送された。</p>
</div></section>`;

const copy2 = h`<section class="page"><div class="sheet">
  <p class="line"><b>5　経過</b></p>
  <p class="line">8月</p>${bar}<p class="line">日</p>${bar}
  <p class="line">8月</p>${bar}<p class="line">日</p>
  <p class="line">保護者より事実確認の申し入れがあった。</p>
  <p class="line">（以下）</p>${bar}${bar}
  <p class="line" style="margin-top:4mm"><b>6　対応</b></p>${bar}
  <p class="line">立入禁止区域の柵及び看板を増設する</p>
  <p class="line" style="margin-top:4mm"><b>7</b></p>
  <p class="line">本件は事故として処理し、終了とする。</p>
</div>
<p class="foot">【7条1号】　【7条5号】</p>
</section>`;

const cover = h`<section class="page"><div class="sheet">
  <p style="font-size:9pt;color:#1a4d80">霞ノ杜町　総務課　情報公開担当</p>
  <h1>情報提供資料</h1>
  <p>霞ノ杜町情報公開条例に基づき開示した公文書を、開示した内容のまま掲載しています。個人に関する情報など、条例で不開示とした部分は、写しのとおり一部を不開示としています。</p>
  <h2>書誌</h2>
  <table class="data">
    <tbody>
      <tr><th>件名</th><td>烏啼山道付近立入禁止区域における事案について（報告）</td></tr>
      <tr><th>作成課</th><td>教育委員会</td></tr>
      <tr><th>作成日</th><td>令和元年8月</td></tr>
      <tr><th>開示決定日</th><td>令和元年10月18日</td></tr>
      <tr><th>不開示部分</th><td>氏名、学年、住所、関係者の発言内容など</td></tr>
      <tr><th>理由</th><td>条例第7条第1号（個人に関する情報）、第5号（事務事業に関する情報）</td></tr>
    </tbody>
  </table>
  <p style="margin-top:4mm">次のページからが、開示した写しです。黒い帯の部分は不開示です。</p>
  <p style="margin-top:6mm;font-size:8.5pt">${TOWN.postalCode}　${TOWN.address}<br>電話 ${TOWN.tel}（代表）</p>
</div></section>`;

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
  cover,
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
