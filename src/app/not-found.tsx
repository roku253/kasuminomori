import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-[#222]">
      <h1 className="text-xl font-bold text-[#1a4d80]">ページが見つかりません</h1>
      <p className="mt-4 text-sm leading-relaxed">アドレスを確認するか、トップページから探してください。</p>
      <p className="mt-6">
        <Link href="/" className="text-sm text-[#1a4d80]">
          トップへ戻る
        </Link>
      </p>
    </main>
  );
}
