"use client";

import { useEffect } from "react";

const GOMI: Record<string, string> = {
  "0291701": "三日月地区：可燃ごみは月曜・木曜、資源ごみは第2水曜です。",
  "0291702": "霞ノ杜地区：可燃ごみは火曜・金曜、資源ごみは第1水曜です。",
  "0291703": "杉並ヶ岡地区：可燃ごみは水曜・土曜、資源ごみは第3水曜です。",
};

const HAZARD: Record<string, string> = {
  三日月: "三日月地区は杜川の氾濫想定域にかかります。増水時は川沿いを避け、三日月中央公民館へ避難してください。",
  霞ノ杜: "霞ノ杜地区の山裾は土砂災害警戒区域です。北西部の旧整備区域は立ち入れません。",
  杉並ヶ岡: "杉並ヶ岡の一部は急傾斜地の土砂災害警戒区域です。大雨のときは斜面から離れてください。",
};

export function TownBehaviors() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.id === "gomi-go") {
        const field = document.getElementById("gomi-zip");
        const out = document.getElementById("gomi-out");
        if (!(field instanceof HTMLInputElement) || !out) return;
        const code = field.value.replace(/\D/g, "");
        out.textContent = GOMI[code] ?? "その区分コードは見当たりません。ページ内の7桁を入力してください。";
        return;
      }
      if (target.id === "hazard-go") {
        const field = document.getElementById("hazard-area");
        const out = document.getElementById("hazard-out");
        if (!(field instanceof HTMLInputElement) || !out) return;
        const name = field.value.replace(/\s/g, "");
        const key = Object.keys(HAZARD).find((area) => name.includes(area));
        out.textContent = key
          ? HAZARD[key]
          : "三日月、霞ノ杜、杉並ヶ岡のいずれかで検索してください。";
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
