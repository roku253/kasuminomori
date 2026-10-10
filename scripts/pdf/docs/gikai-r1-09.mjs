/**
 * 議会だより 第98号（令和元年9月定例会号）令和元年11月1日発行。A4・8ページ。
 * 5ページの一般質問に合意の語を置く。黒塗りは載せない。町長は肩書きだけ。
 */
import { full, md, officeDay } from "../lib/dates.mjs";
import { h, publicFile, safe } from "../lib/html.mjs";
import { TOWN } from "../lib/town.mjs";

const ISSUED = officeDay("2019-11-01", "議会だより第98号の発行日");
const photo = publicFile("img/photos/photo-town.jpg");

function run(pageTitle) {
  return h`<p class="running"><span>かすみのもり 議会だより　第98号</span><span>${pageTitle}</span></p>`;
}

const cover = h`${""}
<header class="mast">
  <div>
    <p class="sub">霞ノ杜町議会</p>
    <h1>かすみのもり<br>議会だより</h1>
  </div>
    <p class="no">第98号<br>令和元年9月定例会号</p>
</header>
<p class="meta"><span>発行日　${full(ISSUED)}</span><span>編集　議会広報編集委員会</span><span>発行　霞ノ杜町議会</span></p>
<div class="cover-grid">
  <figure>
    <img src="${photo}" alt="杜川と町並み">
    <figcaption style="font-size:8pt;margin-top:1mm">杜川沿いの町並み（広報用写真）</figcaption>
  </figure>
  <div class="toc">
    <h2 class="sec">今号の内容</h2>
    <ul>
      <li><span>9月定例会の概要</span><span class="pg">2</span></li>
      <li><span>平成30年度決算の認定</span><span class="pg">3</span></li>
      <li><span>一般質問</span><span class="pg">4</span></li>
      <li><span>委員会報告・議会日誌</span><span class="pg">7</span></li>
      <li><span>次の定例会・傍聴・奥付</span><span class="pg">8</span></li>
    </ul>
    <p style="margin-top:3mm">会期は${md("2019-09-03")}から${md("2019-09-13")}まででした。</p>
  </div>
</div>
<p style="margin-top:4mm">本号は、9月定例会の審議結果と一般質問の要旨をお伝えします。会議録の全文は、議会事務局と町立図書館でご覧いただけます。</p>`;

const p2 = h`${run("定例会の概要")}
<h2 class="sec">9月定例会の概要</h2>
<p>議長は吉田進、副議長は小松真理です。提出された議案は、次のとおり決しました。</p>
<table class="data">
<thead><tr><th>議案番号</th><th>件名</th><th>結果</th></tr></thead>
<tbody>
<tr><td>第41号</td><td>令和元年度霞ノ杜町一般会計補正予算（第3号）</td><td>可決</td></tr>
<tr><td>第42号</td><td>霞ノ杜町手数料条例の一部を改正する条例</td><td>可決</td></tr>
<tr><td>第43号</td><td>町営バスの運行に関する協定の変更</td><td>可決</td></tr>
<tr><td>第44号</td><td>町道の路線認定</td><td>可決</td></tr>
<tr><td>認定第1号</td><td>平成30年度一般会計歳入歳出決算の認定</td><td>認定</td></tr>
</tbody>
</table>
<h2 class="sec">補正予算（第3号）の主な内容</h2>
<p>財源は、前年度繰越金です。</p>
<table class="data">
<thead><tr><th>項目</th><th>内容</th></tr></thead>
<tbody>
<tr><td>町営バス</td><td>夕方便を1本増便するための運行費</td></tr>
<tr><td>教育施設</td><td>小中学校の空調の設計費</td></tr>
<tr><td>土木</td><td>立入防止柵・注意看板の設置</td></tr>
<tr><td>条例</td><td>消費税率引上げに伴う使用料条例の改正</td></tr>
</tbody>
</table>`;

const p3 = h`${run("決算")}
<h2 class="sec">平成30年度決算の認定</h2>
<p>一般会計の歳入歳出決算を認定しました。歳入総額は48億2,600万円、歳出総額は46億1,400万円です。</p>
<div class="pie-row">
  <div class="pie" style="background:conic-gradient(#1a4d80 0 46%, #2d8a3e 46% 68%, #c4a35a 68% 84%, #8b98a8 84% 100%)"></div>
  <div class="legend">
    <div><span class="sw" style="background:#1a4d80"></span>民生費 46%</div>
    <div><span class="sw" style="background:#2d8a3e"></span>教育費 22%</div>
    <div><span class="sw" style="background:#c4a35a"></span>土木費 16%</div>
    <div><span class="sw" style="background:#8b98a8"></span>その他 16%</div>
  </div>
</div>
<h2 class="sec">監査委員の意見の要旨</h2>
<p>決算書などの計数は関係諸帳簿と符合し、予算の執行は概ね適正と認めます。繰越事業は、年度内の完了に向けて進行を管理されたい。基金の取り崩しは、目的を議会へ説明されたい。</p>`;

const qa = (who, q, answers) => h`<div class="qa"><p class="who">${who}</p><p><b>問</b>　${q}</p>${answers}</div>`;

const p4 = h`${run("一般質問")}
<h2 class="sec">一般質問とは</h2>
<p>本会議で、議員が町の仕事について町長や教育長に質問するものです。今定例会では5人の議員が質問しました。</p>
<h2 class="sec">消費税率の引上げと、町営バス</h2>
${qa(
  "小松 真理 議員",
  "10月からの消費税率引上げで、町の手数料はどう変わりますか。あわせて、夕方の帰宅に間に合うバス便が足りません。",
  h`<p><b>答（町長）</b>　使用料は、国の基準に合わせて改正します。バスは、今定例会の補正で夕方便を1本増やし、10月1日から新しい時刻にします。</p>`,
)}`;

const p5 = h`${run("一般質問")}
<h2 class="sec">烏啼山道付近の立入禁止区域での負傷について</h2>
${qa(
  "小林 恵 議員",
  "夏休み中、烏啼山道付近の立入禁止区域で児童が負傷した事故の経緯と、再発防止策は。関係する保護者から事実確認の申し入れがあったと聞くが、町の対応は。",
  h`<p><b>答（教育長）</b>　個人に関わる事柄のため、答弁は差し控えます。学校を通じて安全指導を徹底しました。</p>
<p><b>答（町長）</b>　立入禁止区域の柵と看板を増やします。</p>
<p><b>再質問</b>　町長室にも照会があったのではないか。</p>
<p><b>答（総務課長）</b>　町長室に照会があった件については、所管課と調整のうえ対応しました。</p>`,
)}
<p class="note">※この質問と答弁の一部は、個人に関わる内容を含むため、議会広報編集委員会で協議のうえ、詳細な記載を見送りました。</p>
<h2 class="sec">小中学校の空調</h2>
${qa(
  "伊藤 正 議員",
  "普通教室への空調の整備は、いつから始まりますか。",
  h`<p><b>答（教育長）</b>　設計を今年度中に終え、工事は来年度に順に進めます。</p>`,
)}`;

const p6 = h`${run("一般質問")}
<h2 class="sec">防災行政無線のデジタル化と豪雨への備え</h2>
${qa(
  "高橋 純 議員",
  "屋外の防災行政無線が聞き取りにくい地区があります。デジタル化の時期と、豪雨のときの伝え方を教えてください。",
  h`<p><b>答（町長）</b>　デジタル化は令和4年度の更新にあわせて検討します。それまでは、戸別受信機の貸与と、区長への連絡を続けます。</p>`,
)}
<h2 class="sec">湖岸の排水</h2>
${qa(
  "木下 裕子 議員",
  "霞湖の水位が上がったとき、湖岸の道路の排水は足りますか。",
  h`<p><b>答（町長）</b>　湖岸の側溝を、冬の前に点検します。増水時は湖岸の道路に車を止めないよう、広報で知らせます。</p>`,
)}`;

const p7 = h`${run("委員会")}
<h2 class="sec">委員会報告</h2>
<p>総務文教常任委員会は、補正予算と使用料条例を審査し、原案のとおり可決すべきものと決しました。経済建設常任委員会は、町道の路線認定を審査し、原案のとおり可決すべきものと決しました。</p>
<h2 class="sec">請願</h2>
<p>今定例会に付議された請願はありません。</p>
<h2 class="sec">議会日誌</h2>
<table class="data">
<tbody>
<tr><th>${md("2019-09-03")}</th><td>本会議（提案説明、一般質問）</td></tr>
<tr><th>${md("2019-09-06")}</th><td>常任委員会</td></tr>
<tr><th>${md("2019-09-13")}</th><td>本会議（採決）</td></tr>
<tr><th>${md("2019-10-21")}</th><td>全員協議会。台風第19号の被害状況の報告</td></tr>
</tbody>
</table>`;

const p8 = h`${run("ご案内")}
<h2 class="sec">次の定例会</h2>
<p>12月定例会は、12月3日（火）から開く予定です。日程が決まり次第、役場の掲示と広報でお知らせします。</p>
<h2 class="sec">傍聴のご案内</h2>
<p>本会議は、どなたでも傍聴できます。議場は役場3階です。当日、入口で住所とお名前をご記入ください。</p>
<div class="two">
  <div>
    <h2 class="sec">編集委員</h2>
    <p>小松真理（委員長）、中村浩、小林恵、伊藤正、高橋純、木下裕子</p>
    <h2 class="sec">編集後記</h2>
    <p>日が短くなる季節です。定例会の内容が、町の仕事を知る手がかりになれば幸いです。</p>
  </div>
  <div class="colophon">
    <p><b>かすみのもり 議会だより</b>　第98号</p>
    <p>令和元年9月定例会号</p>
    <p>発行日　${full(ISSUED)}</p>
    <p>編集　議会広報編集委員会</p>
    <p>発行　霞ノ杜町議会</p>
    <p>${TOWN.postalCode}　${TOWN.address}</p>
    <p>電話 ${TOWN.tel}（代表）　FAX ${TOWN.fax}</p>
    <p>印刷　町内の印刷所</p>
  </div>
</div>`;

export default {
  id: "gikai-r1-09",
  file: "gikai-r1-09.pdf",
  template: "gikai",
  pages: 8,
  meta: {
    title: "かすみのもり 議会だより 第98号（令和元年9月定例会号）",
    author: "霞ノ杜町議会",
    subject: "9月定例会の審議結果、平成30年度決算の認定、一般質問、委員会報告",
    keywords: "議会だより, 霞ノ杜町議会, 第98号, 令和元年",
    created: `${ISSUED}T09:00:00+09:00`,
  },
  sheets: [cover, p2, p3, p4, p5, p6, p7, p8].map((s) => safe(s)),
  checks: {
    mustContain: [
      { page: 5, text: "町長室に照会" },
      { page: 5, text: "詳細な記載を見送りました" },
      { page: 1, text: "第98号" },
    ],
    mustNotContain: ["黒塗り"],
  },
};
