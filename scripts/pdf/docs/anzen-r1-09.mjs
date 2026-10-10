/**
 * 地域安全通信 第112号（令和元年9月号）令和元年8月20日（火）発行 — A4・2ページ・回覧用
 * 正本: r1-docs 3-5-3、r1-world 3.1、consolidated v1 1-2・v3 §1-D、r2-director B-3、r3-docs §3。
 * - p.1 トップ記事の見出しは「烏啼山道付近の立入禁止区域について」（一覧・検索索引と同じ文言）。
 * - 本文の2段落目に合意の文を一字も変えずに置く。名前・学年・日付は書かない。伝承には触れない。
 * - 区域の理由は「落石・地盤のゆるみ」。発行は 総務課 地域安全係・霞ノ杜町防犯協会。問は地域安全係（215）。
 */
import { md, mdRange, mdSeq, officeDay } from "../lib/dates.mjs";
import { safe } from "../lib/html.mjs";

const ISSUE = officeDay("2019-08-20", "第112号の発行日");

/** 立入禁止区域（烏啼山道）の概略図。地名は町の正本だけ。縮尺は正確でない */
const MAP = safe(`<svg viewBox="0 0 300 236" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="立入禁止区域（烏啼山道）の概略図">
<defs>
  <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="7" height="7" fill="#e6edf5"/><line x1="0" y1="0" x2="0" y2="7" stroke="#1f4b7a" stroke-width="2"/>
  </pattern>
</defs>
<rect x="0.5" y="0.5" width="299" height="235" fill="#fff" stroke="#8b98a8"/>
<g fill="none" stroke="#c3cbd4" stroke-width="0.9">
  <path d="M60 40 C110 30 160 8 220 4"/><path d="M70 70 C120 58 170 30 236 18"/><path d="M84 104 C130 92 186 52 240 44"/>
  <path d="M96 140 C150 126 200 92 236 76"/><path d="M120 180 C170 166 214 132 240 112"/>
</g>
<path d="M268 4 C256 40 276 70 262 104 C250 136 270 170 258 206 L254 232" fill="none" stroke="#5f7186" stroke-width="6"/>
<path d="M268 4 C256 40 276 70 262 104 C250 136 270 170 258 206 L254 232" fill="none" stroke="#fff" stroke-width="2.4"/>
<path d="M128 160 L114 122 L130 86 L166 54 L208 28 L244 22 L250 50 L234 84 L204 112 L172 138 L148 160 Z" fill="url(#hatch)" stroke="#1f4b7a" stroke-width="1.2"/>
<path d="M114 122 L130 86 L166 54 M148 160 L172 138 L204 112" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-dasharray="1.6 2.6"/>
<path d="M22 214 C52 204 82 194 104 180 L122 166" fill="none" stroke="#1a1a1a" stroke-width="3.2"/>
<path d="M122 166 L150 140 L176 110 L204 80 L230 52 L244 34" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-dasharray="5 3"/>
<line x1="116" y1="152" x2="142" y2="174" stroke="#1a1a1a" stroke-width="4.2"/>
<g font-family="KN Gothic" font-weight="700" font-size="9" text-anchor="middle">
  <rect x="92" y="172" width="11" height="11" fill="#1a1a1a"/><text x="97.5" y="181" fill="#fff">!</text>
  <rect x="144" y="170" width="11" height="11" fill="#1a1a1a"/><text x="149.5" y="179" fill="#fff">!</text>
  <rect x="98" y="114" width="11" height="11" fill="#1a1a1a"/><text x="103.5" y="123" fill="#fff">!</text>
  <rect x="190" y="128" width="11" height="11" fill="#1a1a1a"/><text x="195.5" y="137" fill="#fff">!</text>
  <rect x="124" y="140" width="11" height="11" fill="#fff" stroke="#1a1a1a" stroke-width="1.4"/><text x="129.5" y="149" fill="#1a1a1a">!</text>
  <rect x="236" y="86" width="11" height="11" fill="#fff" stroke="#1a1a1a" stroke-width="1.4"/><text x="241.5" y="95" fill="#1a1a1a">!</text>
</g>
<rect x="148" y="51" width="76" height="17" rx="2" fill="#fff" fill-opacity="0.92"/>
<g font-family="KN Gothic" font-size="10.5" fill="#1a1a1a">
  <text x="186" y="64" font-weight="700" font-size="11.5" text-anchor="middle">立入禁止区域</text>
  <text x="206" y="168">烏啼山道</text>
  <text x="50" y="146">柵</text>
  <text x="40" y="200">林道</text>
  <text x="8" y="229" font-size="9.5">← 杜ケ丘地区の集落へ</text>
  <text x="270" y="190" font-size="11">杜川</text>
</g>
<line x1="216" y1="158" x2="178" y2="112" stroke="#1a1a1a" stroke-width="0.7"/>
<line x1="60" y1="144" x2="118" y2="156" stroke="#1a1a1a" stroke-width="0.7"/>
<g transform="translate(26 28)" font-family="KN Gothic" font-size="10" font-weight="700" text-anchor="middle">
  <circle r="11" fill="#fff" stroke="#1a1a1a"/><path d="M0 -8 L4 4 L0 1 L-4 4 Z" fill="#1a1a1a"/><text y="-14">北</text>
</g>
</svg>`);

const LEGEND = safe(`<svg viewBox="0 0 300 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><pattern id="hatch2" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#e6edf5"/><line x1="0" y1="0" x2="0" y2="7" stroke="#1f4b7a" stroke-width="2.2"/></pattern></defs>
<g font-family="KN Gothic" font-size="9.5" fill="#1a1a1a">
  <rect x="2" y="3" width="16" height="10" fill="url(#hatch2)" stroke="#1f4b7a"/><text x="22" y="12">立入禁止区域</text>
  <line x1="88" y1="8" x2="106" y2="8" stroke="#1a1a1a" stroke-width="1.8" stroke-dasharray="5 3"/><text x="110" y="12">山道</text>
  <line x1="140" y1="8" x2="158" y2="8" stroke="#1a1a1a" stroke-width="4"/><text x="162" y="12">柵</text>
  <line x1="182" y1="8" x2="200" y2="8" stroke="#1a1a1a" stroke-width="1.6" stroke-dasharray="1.5 2.5"/><text x="204" y="12">ロープ</text>
  <rect x="2" y="18" width="10" height="10" fill="#1a1a1a"/><text x="16" y="27">看板（8月に増設）</text>
  <rect x="110" y="18" width="10" height="10" fill="#fff" stroke="#1a1a1a" stroke-width="1.4"/><text x="124" y="27">看板（以前から）</text>
</g>
</svg>`);

export default {
  id: "anzen-r1-09",
  file: "anzen-r1-09.pdf",
  template: "anzen",
  pages: 2,
  issue: { no: 112, month: "令和元年9月号", date: ISSUE },
  tagline: "安全で安心な霞ノ杜町を、みんなの力で",
  publisher: "霞ノ杜町 総務課 地域安全係・霞ノ杜町防犯協会",
  office: "総務課 地域安全係",
  cooperation: "霞ノ杜駐在所",
  meta: {
    title: "地域安全通信 第112号（令和元年9月号）",
    author: "霞ノ杜町 総務課 地域安全係・霞ノ杜町防犯協会",
    subject: "烏啼山道付近の立入禁止区域について／夏の地域安全運動の報告／秋の全国交通安全運動／特殊詐欺への注意／クマの目撃情報",
    keywords: "地域安全通信, 霞ノ杜町, 防犯協会, 回覧, 令和元年9月号",
    created: `${ISSUE}T09:00:00+09:00`,
  },
  p1: {
    top: {
      title: "烏啼山道付近の立入禁止区域について",
      body: [
        { p: "町の東、杜ケ丘地区の山すそにある烏啼山道（うていさんどう）付近の山林は、落石や地盤のゆるみのおそれがあるため、町が立入禁止区域としています。区域の入口には、柵と看板を設けています。", cls: "lead" },
        { p: "立入禁止区域に児童3名が入り、うち1名が負傷・搬送されました。", cls: "lead" },
        { p: "町では、区域の入口と山道沿いの看板とロープを増やし、学校や地区の皆さんと見回りを行っています。関係各位のご協力により、周知を進めています。今後も気象・地盤の状況に留意し、立入禁止の徹底に努めます。", cls: "lead" },
        {
          box: {
            cls: "warn",
            title: "ご家庭へのお願い",
            body: [
              {
                ordered: true,
                list: [
                  "柵や看板のある場所には、大人も子どもも入らないでください。",
                  "子どもだけで山や沢へ遊びに行かないよう、ご家庭で声をかけてください。",
                  "区域の近くで子どもを見かけたら声をかけ、役場か駐在所へお知らせください。",
                ],
              },
            ],
          },
        },
        { toi: "総務課 地域安全係" },
      ],
      aside: [
        { html: safe(`<figure class="fig">${MAP}${LEGEND}<figcaption>図　立入禁止区域（烏啼山道）の概略。縮尺は正確ではありません。区域の境には柵とロープ、入口と山道沿いに看板があります。</figcaption></figure>`) },
      ],
    },
    rest: [
      {
        title: `夏の地域安全運動（${mdRange("2019-08-01", "2019-08-10")}）を実施しました`,
        body: [
          "「子どもと女性を犯罪から守る」を重点に、防犯協会・消防団・区の皆さんと町内の見回りを行いました。暑い中のご協力、ありがとうございました。",
          {
            table: {
              cls: "data",
              widths: ["34%", "66%"],
              rows: [
                ["防犯パトロール車の巡回", "10日間・延べ22回（町内全域）"],
                ["地区の夜間見回り", `${mdSeq("2019-08-02", "2019-08-09")}　延べ64人`],
                ["通学路・公園の点検", "危ない場所7か所を確認（町と区で順に対応します）"],
                ["駅前での呼びかけ", `${md("2019-08-05")}　霞ノ杜駅前で防犯の呼びかけとチラシの配布`],
              ],
            },
          },
          { toi: "総務課 地域安全係" },
        ],
      },
      {
        grid: [
          {
            small: true,
            title: "「子ども110番の家」にご協力を",
            body: [
              "子どもが助けを求めて駆け込める「子ども110番の家」は、町内に48か所あります。旗やステッカーが古くなった家には、新しいものをお届けします。",
              "新たにご協力いただける商店・事業所・ご家庭は、地域安全係へご連絡ください。",
              { toi: "総務課 地域安全係" },
            ],
          },
          {
            small: true,
            title: "防犯灯の球切れを見つけたら",
            body: [
              "夜道の安全のため、区と町で防犯灯を管理しています。球切れや点滅を見つけたら、電柱などに付いている番号札の番号を、区長か地域安全係へお知らせください。",
              { toi: "総務課 地域安全係" },
            ],
          },
        ],
      },
    ],
  },
  p2: {
    left: [
      {
        title: "秋の全国交通安全運動",
        sub: `期間　${mdRange("2019-09-21", "2019-09-30")}`,
        body: [
          "**運動の重点**",
          {
            ordered: true,
            list: [
              "子どもと高齢者をはじめとする歩行者の安全確保",
              "夕暮れ時と夜間の歩行者・自転車の事故防止（早めのライト点灯と反射材の活用）",
              "飲酒運転の根絶",
            ],
          },
          `${md("2019-09-30")}は「交通事故死ゼロを目指す日」です。日が短くなる時期です。車は早めにライトをつけ、歩く人は明るい服と反射材を身につけましょう。`,
          {
            table: {
              cls: "data",
              caption: "町内の交通事故（1月〜7月）",
              head: ["", "令和元年", "前年の同期"],
              widths: ["40%", "30%", "30%"],
              rows: [
                ["人身事故", { t: "5件", cls: "r" }, { t: "7件", cls: "r" }],
                ["けがをした人", { t: "6人", cls: "r" }, { t: "9人", cls: "r" }],
                ["亡くなった人", { t: "0人", cls: "r" }, { t: "0人", cls: "r" }],
              ],
            },
          },
          { toi: "総務課 地域安全係" },
        ],
      },
      {
        kicker: "特殊詐欺",
        title: "「還付金があります」は詐欺です",
        body: [
          "7月から8月にかけて、町内で役場の職員や年金事務所を名乗る不審な電話が4件ありました。いずれも被害はありませんでした。",
          {
            box: {
              cls: "tint",
              title: "こんな電話は詐欺です",
              body: [
                {
                  list: [
                    "「医療費の払い戻しがあります。手続きは今日までです」",
                    "「携帯電話を持って、近くのATMへ行ってください」",
                    "「キャッシュカードを預かりに、職員が伺います」",
                  ],
                },
              ],
            },
          },
          "役場や年金事務所が、ATMでお金を返す手続きをお願いすることはありません。電話を切って、家族か駐在所に相談してください。",
          { toi: "総務課 地域安全係" },
        ],
      },
    ],
    right: [
      {
        kicker: "注意",
        title: "クマの目撃が続いています",
        body: [
          "8月に入って、町内で次の目撃がありました。",
          {
            table: {
              cls: "data",
              widths: ["32%", "68%"],
              rows: [
                [md("2019-08-03"), "早朝　成沢地区の林道"],
                [md("2019-08-09"), "夕方　狐塚地区の山すその畑"],
                [md("2019-08-16"), "早朝　三日月北地区の沢沿い"],
              ],
            },
          },
          {
            list: [
              "山や畑に入るときは、鈴やラジオで音を出しましょう。",
              "生ごみや取り残した野菜・果物を、家のまわりに置かないでください。",
              "クマを見かけたら近づかず、静かにその場を離れて、役場か駐在所へ知らせてください。",
            ],
          },
          { toi: "産業観光課 農林係" },
        ],
      },
      {
        kicker: "駐在所から",
        title: "登下校の見守りにご協力を",
        body: [
          "まもなく2学期が始まります。朝の7時15分から8時ごろと、夕方の下校の時間に、通学路で子どもたちを見守ってください。散歩や買い物のついでの「ながら見守り」も大きな力になります。",
          "車を運転する方は、通学路では速度を落とし、子どもの飛び出しに注意してください。",
          { toi: "総務課 地域安全係" },
        ],
      },
      {
        title: "自転車の点検と保険",
        body: [
          "2学期の通学の前に、ブレーキ・ライト・タイヤの空気・反射材を確かめましょう。夕方は早めにライトをつけてください。",
          "自転車で人にけがをさせたときに備え、ご家族で自転車保険（個人賠償責任保険）への加入を確かめておきましょう。",
          { toi: "総務課 地域安全係" },
        ],
      },
    ],
  },
  contact: ["**霞ノ杜駐在所**　困りごとや相談は、お近くの駐在所へ。（不在のときは、入口の電話で警察署につながります）"],
  checks: {
    mustContain: [
      { page: 1, text: "立入禁止区域に児童3名が入り、うち1名が負傷・搬送されました。" },
      { page: 1, text: "烏啼山道付近の立入禁止区域について" },
      { page: 1, text: "第112号" },
      { page: 2, text: "2" },
    ],
    mustNotContain: ["伝承", "町長室", "藤原", "申し入れ", "本件は"],
  },
};
