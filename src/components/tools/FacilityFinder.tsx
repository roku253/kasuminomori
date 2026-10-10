"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import data from "@/content/data/facilities.json";
import { fillTemplate, normalizeForMatch } from "@/lib/normalize";
import { ToolForm, ToolStatus } from "./ToolForm";
import { replaceQueryParam, useInitialQuery } from "./useToolQuery";

type Facility = { name: string; area?: string; href?: string };

/** 地図から探す: 施設の一覧を施設名で絞り込む。データは src/content/data/facilities.json（href があればリンクにする）。 */
export function FacilityFinder() {
  const { ui } = data;
  const items = data.items as Facility[];
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const words = normalizeForMatch(query).split(" ").filter(Boolean);
    if (!words.length) return items;
    return items.filter((item) => {
      const text = normalizeForMatch(`${item.name} ${item.area ?? ""}`);
      return words.every((w) => text.includes(w));
    });
  }, [items, query]);

  const run = useCallback((raw: string) => setQuery(raw.trim()), []);
  useInitialQuery(
    useCallback(
      (q: string) => {
        setValue(q);
        run(q);
      },
      [run]
    )
  );

  const message = !query
    ? ""
    : results.length
      ? fillTemplate(ui.count, { n: results.length })
      : fillTemplate(ui.notFound, { q: query });

  return (
    <div className="kn-tool" data-kn-tool-ui="facility-finder">
      <ToolForm
        name={ui.formName}
        label={ui.label}
        placeholder={ui.placeholder}
        button={ui.button}
        value={value}
        onChange={setValue}
        onSubmit={(v) => {
          run(v);
          replaceQueryParam(v.trim());
        }}
      />
      <ToolStatus message={message} />
      {results.length > 0 && (
        <ul className="kn-facility-list">
          {results.map((item) => {
            const label = item.area ? `${item.name}（${item.area}）` : item.name;
            return <li key={item.name}>{item.href ? <Link href={item.href}>{label}</Link> : label}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
