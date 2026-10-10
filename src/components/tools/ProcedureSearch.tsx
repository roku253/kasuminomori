"use client";

import { useCallback, useMemo, useState } from "react";
import data from "@/content/data/procedures.json";
import { DataTable } from "@/components/ui/DataTable";
import { fillTemplate, normalizeForMatch } from "@/lib/normalize";
import { ToolForm, ToolStatus } from "./ToolForm";
import { replaceQueryParam, useInitialQuery } from "./useToolQuery";

type Props = { caption?: string };

/** 申請・手続早わかり検索。手続き名・担当課で表を絞り込む。データは src/content/data/procedures.json の search。 */
export function ProcedureSearch({ caption }: Props) {
  const { ui, items } = data.search;
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const words = normalizeForMatch(query).split(" ").filter(Boolean);
    if (!words.length) return items;
    return items.filter((item) => {
      const text = normalizeForMatch(`${item.name} ${item.office}`);
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
    <div className="kn-tool" data-kn-tool-ui="procedure-search">
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
      <DataTable rows={results.map((item) => ({ label: item.name, value: item.office }))} caption={caption} />
    </div>
  );
}
