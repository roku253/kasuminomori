"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-[#222]">
      <h1 className="text-xl font-bold text-[#1a4d80]">ページを表示できませんでした</h1>
      <p className="mt-4 text-sm leading-relaxed">
        読み込み中に問題が起きました。もう一度開くか、トップページへ戻ってください。
      </p>
      <p className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-[44px] rounded border border-[#1a4d80] bg-[#1a4d80] px-4 text-sm text-white"
        >
          もう一度開く
        </button>
        <Link href="/" className="inline-flex min-h-[44px] items-center text-sm text-[#1a4d80]">
          トップへ戻る
        </Link>
      </p>
    </main>
  );
}
