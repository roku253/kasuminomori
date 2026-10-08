"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, background: "#f4f6f8", color: "#222", fontFamily: "sans-serif" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 16px" }}>
          <h1 style={{ fontSize: 20, color: "#1a4d80" }}>ページを表示できませんでした</h1>
          <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.7 }}>
            読み込み中に問題が起きました。もう一度開くか、トップページへ戻ってください。
          </p>
          <p style={{ marginTop: 24 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: 44,
                padding: "8px 16px",
                background: "#1a4d80",
                color: "#fff",
                border: 0,
                borderRadius: 4,
              }}
            >
              もう一度開く
            </button>
            <Link href="/" style={{ marginLeft: 16, color: "#1a4d80" }}>
              トップへ戻る
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
