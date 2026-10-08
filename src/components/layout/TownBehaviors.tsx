"use client";

import { useEffect } from "react";

const GOMI: Record<string, string> = {
  "0291701": "三日月地区：可燃ごみは月曜・木曜、資源ごみは第2水曜です。",
  "0291702": "霞ノ杜地区：可燃ごみは火曜・金曜、資源ごみは第1水曜です。",
  "0291703": "杉並ヶ岡地区：可燃ごみは水曜・土曜、資源ごみは第3水曜です。",
};

export function TownBehaviors() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.id !== "gomi-go") return;
      const field = document.getElementById("gomi-zip");
      const out = document.getElementById("gomi-out");
      if (!(field instanceof HTMLInputElement) || !out) return;
      const code = field.value.replace(/\D/g, "");
      out.textContent = GOMI[code] ?? "その区分コードは見当たりません。ページ内の7桁を入力してください。";
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
