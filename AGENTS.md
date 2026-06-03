# 霞ノ杜町サイト — マルチロール開発フロー

**ユーザー指示（必須）:** 変更時は各役職が専門家として調査・意見出し・合議を行い、**合意案をユーザーが確認してから** 実装する。いきなりコードを書かない。

---

## 役割と責務

各役割は **その分野のベストプラクティスを Web 検索で補強** してから発言する（市町村 HP、公共 UX、a11y、Next.js static export 等）。

| 役割 | 責務 | 主な参照 |
|------|------|----------|
| Webプロデューサー / ディレクター | 信頼感・導線・ベンチマーク、PASS/差し戻し | `docs/EVAL-CRITERIA.md`, 他自治体 HP の慣行 |
| UX / UIデザイナー | 余白・タイポ・タップ領域・モバイル・UI 統一 | `src/app/globals.css`, `src/components/ui/` |
| フロントエンド | 実装方針・basePath・パフォーマンス・保守性 | `next.config.ts`, App Router, JSON コンテンツ |
| テスター | 受け入れ条件・E2E・build・謎解き回帰 | `e2e/smoke.spec.ts`, token-gate / footprint |

---

## 変更時の必須フロー（会議 → ユーザー確認 → 実装）

### Phase A — 調査・各役職の意見（実装前）

1. 依頼内容と影響範囲を整理する。
2. **Web 検索** で最新の業界慣行・参考を短くメモ（必要に応じて複数クエリ）。
3. **4 役職それぞれ** が次の形式で意見を出す（1 役職 = 見出し 1 つ、各 5〜10 行程度）:
   - 所見（現状の問題 or 機会）
   - 推奨（具体的に）
   - 懸念（あれば）
   - 優先度の提案（P0 / P1 / P2）
4. **合議サマリー** を書く:
   - 全員一致の項目
   - 意見が割れた項目（選択肢 A/B とトレードオフ）
   - **推奨アクション一覧**（実装する / しない、スコープ）

### Phase B — ユーザー確認（ゲート）

5. 上記を **「会議メモ」としてユーザーに提示** し、次を明示して止まる:
   - 「この内容で実装してよいか」
   - スコープの確認（やらないこと）
6. **ユーザーが OK するまで Phase C に進まない。**

### Phase C — 実装・検証（承認後のみ）

7. 承認されたスコープだけ実装する。
8. `npm run build` と `npm run test:e2e`（可能なら）で検証。
9. 完了報告に **役職別の受け入れメモ**（1 行ずつ）を添える。

### 例外（会議省略可）

- ユーザーが「会議スキップで」と明示したとき
- 誤字 1 行・コメントのみなど、**UI/UX/導線に影響しない** 極小変更

---

## 反復

- Phase A〜B を 1 ラウンドとし、実装後に重大な P0 が出た場合のみ **追加会議（短縮可）** → 再度ユーザー確認 → 修正。
- Cursor Automation / GitHub Actions は **機械チェック**。役職会議の代替にはしない。

---

## 維持必須（謎解き）

- `TokenGate.tsx` — 本番は `nazo-portal` 検証
- `Footprint.tsx` — `data-kn-story-clue`
- `.kn-print-error` — 印刷用（`globals.css`）
- 文言は `src/content/pages/*.json`

---

## ローカル開発

- `npm run dev` → gate 自動スキップ（development）
- 本番同等確認: `localStorage.setItem('kasumi_dev_unlock','1')` 後に `npm run build && npx serve out`
- URL: `http://localhost:3000/kasuminomori/`（ポートは環境により異なる）

## コンテンツ更新

JSON が正。旧 HTML は削除済み。再抽出は `archive/` に HTML を置いた場合のみ `npm run extract`。
