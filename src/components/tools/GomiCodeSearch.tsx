"use client";

import { useCallback, useState } from "react";
import data from "@/content/data/gomi.json";
import { ToolForm, ToolStatus } from "./ToolForm";
import { replaceQueryParam, useInitialQuery } from "./useToolQuery";

/** ごみの分別検索（品目名）。データは src/content/data/gomi.json の items。 */
export function GomiCodeSearch() {
  const { ui, items } = data;
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  const run = useCallback(
    (raw: string) => {
      const q = raw.normalize("NFKC").trim();
      if (!q) {
        setMessage("");
        return;
      }
      const hits = items.filter((item) => item.name.normalize("NFKC").includes(q));
      if (!hits.length) {
        setMessage(ui.notFound.replace("{q}", q));
        return;
      }
      const shown = hits.slice(0, 8).map((item) => `${item.name}は${item.bin}です`);
      const more = hits.length > 8 ? `ほか${hits.length - 8}件あります。` : "";
      setMessage(`${shown.join(" ")}${more}`);
    },
    [items, ui.notFound]
  );

  useInitialQuery(
    useCallback(
      (q: string) => {
        setValue(q);
        run(q);
      },
      [run]
    )
  );

  return (
    <div className="kn-tool" data-kn-tool-ui="gomi-search">
      <ToolForm
        name={ui.formName}
        label={ui.label}
        placeholder={ui.placeholder}
        button={ui.button}
        value={value}
        onChange={setValue}
        inputMode="search"
        onSubmit={(v) => {
          run(v);
          replaceQueryParam(v.trim());
        }}
      />
      <ToolStatus message={message} />
    </div>
  );
}
