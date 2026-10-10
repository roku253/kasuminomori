/**
 * 地域安全通信（回覧用・A4 両面1枚＝2ページ）の組版。データは docs/anzen-*.mjs。
 *
 * p1: 題字・回覧欄・発行情報、トップ記事（本文と図の2段）、その下の記事
 * p2: 柱、2段の記事、緊急の連絡先、奥付、ノンブル
 */
import { blocks } from "../lib/blocks.mjs";
import { full } from "../lib/dates.mjs";
import { css, h, t } from "../lib/html.mjs";
import { TOWN, telExt, unit } from "../lib/town.mjs";

function article(a, extraCls = "") {
  if (a.grid) return h`<div class="grid2 row">${a.grid.map((x) => h`<div class="col">${article(x)}</div>`)}</div>`;
  return h`<section class="art ${extraCls}">
  <h2 class="art-h ${a.small ? "small" : ""}">${a.kicker ? h`<span class="kicker">${a.kicker}</span>` : ""}<span>${t(a.title)}</span></h2>
  ${a.sub ? h`<p class="art-sub">${t(a.sub)}</p>` : ""}
  <div class="art-body">${blocks(a.body)}</div>
</section>`;
}

export default {
  render(doc) {
    const date = full(doc.issue.date);
    const office = unit(doc.office);
    const p1 = h`<section class="page">
<div class="sheet">
  <header class="mast">
    <div class="mast-title">
      <p class="tag">${doc.tagline}</p>
      <h1>地域安全通信</h1>
      <p class="issue"><span class="no">第${doc.issue.no}号</span><span>${doc.issue.month}</span><span>${date}発行</span></p>
    </div>
    <div class="kairan">
      <div class="k-head"><span class="k-big">回覧</span><span class="k-sub">見たら印を押して次へ</span></div>
      <table><thead><tr><th>区長</th><th>組長</th><th>各戸</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr></tbody></table>
    </div>
  </header>
  <p class="pubinfo"><span><b>発行</b>　${doc.publisher}</span><span><b>協力</b>　${doc.cooperation}</span></p>
  <section class="art top">
    <h2 class="art-h">${t(doc.p1.top.title)}</h2>
    <div class="top-grid">
      <div class="art-body">${blocks(doc.p1.top.body)}</div>
      <div class="art-body">${blocks(doc.p1.top.aside)}</div>
    </div>
  </section>
  ${doc.p1.rest.map((a) => article(a))}
</div>
</section>`;

    const p2 = h`<section class="page">
<div class="sheet">
  <p class="running"><span><b>地域安全通信</b>　第${doc.issue.no}号（${doc.issue.month}）</span><span>${date}発行</span></p>
  <div class="grid2">
    <div class="col">${doc.p2.left.map((a) => article({ small: true, ...a }))}</div>
    <div class="col">${doc.p2.right.map((a) => article({ small: true, ...a }))}</div>
  </div>
  <div class="spacer"></div>
  <div class="contact">
    <div class="emg">
      <p>事件・事故は　<span class="big">110番</span></p>
      <p>火事・救急は　<span class="big">119番</span></p>
    </div>
    <div class="where">${blocks(doc.contact)}
      <p><b>${office.name}</b>（役場${office.floor}）　<span class="nowrap">${telExt(doc.office)}</span>　<span class="nowrap">FAX ${TOWN.fax}</span></p>
    </div>
  </div>
  <p class="kaiten">回覧が終わりましたら、次の方へお回しください。</p>
  <div class="colophon">
    <span>地域安全通信　第${doc.issue.no}号（${doc.issue.month}）　${date}発行<br>編集・発行　${doc.publisher}<br>${TOWN.postalCode}　${TOWN.address}（${TOWN.office}内）　電話 ${TOWN.tel}（代表）</span>
    <span style="text-align:right">この通信は再生紙を使用しています。</span>
  </div>
</div>
<p class="nombre right">2</p>
</section>`;
    return { styles: css("base.css", "anzen.css"), pages: [p1, p2] };
  },
};
