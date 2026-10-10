"use client";

import { useId } from "react";

type Props = {
  /** 入力欄のラベル（例: 区分コード） */
  label: string;
  placeholder?: string;
  /** 送信ボタンの文字（例: 検索） */
  button: string;
  value: string;
  onChange: (value: string) => void;
  /** Enter キーとボタンの両方で呼ばれる */
  onSubmit: (value: string) => void;
  inputMode?: "text" | "numeric" | "search";
  /** 検索ランドマークの名前（省略時はラベル） */
  name?: string;
};

/** ツール共通の入力欄。form の submit で動くので Enter キーでも検索できる。 */
export function ToolForm({ label, placeholder, button, value, onChange, onSubmit, inputMode, name }: Props) {
  const id = useId();
  return (
    <form
      role="search"
      aria-label={name ?? label}
      className="kn-tool-form my-4 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <div className="flex min-w-[12rem] flex-1 flex-col gap-1 sm:max-w-sm">
        <label htmlFor={id} className="text-sm font-semibold text-[#333]">
          {label}
        </label>
        <input
          id={id}
          name="q"
          type="search"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[44px] w-full rounded border border-[#6b7280] bg-white px-3 text-base text-[#1a1a1a] placeholder:text-[#6b7280]"
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-[44px] cursor-pointer items-center rounded border-0 bg-[var(--kasumi-blue)] px-5 text-sm font-semibold text-white hover:bg-[#153d66] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#f2b705]"
      >
        {button}
      </button>
    </form>
  );
}

/** 結果の読み上げ欄（aria-live）。最初から置いておき、文だけを入れ替える。 */
export function ToolStatus({ message }: { message: string }) {
  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="kn-tool-status m-0 min-h-[1.75rem] text-base leading-relaxed text-[#1a1a1a]">
      {message}
    </p>
  );
}
