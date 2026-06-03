# 霞ノ杜町サイト — マルチロール開発フロー

## 役割と責務

| 役割 | 責務 |
|------|------|
| Webプロデューサー / ディレクター | 市町村HPベンチマーク、合格判定、差し戻し（`docs/EVAL-CRITERIA.md`） |
| UX / UIデザイナー | トークン、コンポーネント、余白・タイポ（`src/app/globals.css`, `src/components/ui/`） |
| フロントエンド | Next.js 実装、GSAP、コンテンツ JSON |
| テスター | `npm run build`、token-gate、reduced-motion |

## 反復ループ

1. 実装タスクが UI / コンポーネントを更新
2. 評価タスクが `docs/UPGRADE-MASTER-PLAN.md` と実サイトを照合
3. P0 が残れば実装へ戻る（ユーザー承認不要）
4. PASS まで繰り返し

## 維持必須（謎解き）

- `TokenGate.tsx` — 本番は `nazo-portal` 検証
- `Footprint.tsx` — `data-kn-story-clue`
- `.kn-print-error` — 印刷用（`globals.css`）
- 文言は `src/content/pages/*.json`

## ローカル開発

- `npm run dev` → gate 自動スキップ（development）
- 本番同等確認: `localStorage.setItem('kasumi_dev_unlock','1')` 後に `npm run build && npx serve out`
- URL: `http://localhost:3000/kasuminomori/`（ポートは環境により異なる）

## コンテンツ更新

JSON が正。旧 HTML は削除済み。再抽出は `archive/` に HTML を置いた場合のみ `npm run extract`。
