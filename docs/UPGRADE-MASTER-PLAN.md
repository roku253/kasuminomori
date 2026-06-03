# 霞ノ杜町サイト — フル品質アップグレード（マスタープラン）

## ゴール
- **維持:** ナビ構造（タブ/カテゴリ）、各ページの文言・表データ・謎解き（token-gate, footprint, story-clue, kn-print-error）
- **刷新:** 全ページの UI/UX、アニメーション、コンポーネント設計、リポジトリ構成
- **基準:** 日本の市町村公式サイトの現行水準以上（プロデュース〜実装の職種フローで合議）

## 職種フロー（並列 + 反復）

| 役割 | 担当 | 成果物 |
|------|------|--------|
| Webプロデューサー / ディレクター | 評価タスク | ベンチマーク、合格基準、差し戻しリスト |
| UX / UIデザイナー | デザインタスク | トークン、コンポーネント仕様、レイアウト原稿 |
| フロントエンド | 実装タスク | Next コンポーネント、GSAP、削除 legacy |
| テスター | ビルド・a11y | `npm run build`, reduced-motion, gate |

**反復:** 実装 → 評価が差し戻し → 実装が修正（ユーザー承認待ち不要）

## フェーズ

### P0 整理（即時）
- 旧静的資産 `css/`, `js/`, `partials/`, ルート `*.html` カテゴリフォルダ → 削除（`scripts/extract` 用に archive は不要、JSON が source of truth）
- `public/img` 統合、重複 `img/` ルート削除
- dev 用 token-gate バイパス（`NODE_ENV=development`）

### P1 デザインシステム
- `--kasumi-*` トークン、タイポスケール、セクション余白
- 共通: `SiteShell`, `PageHeader`, `GlassCard`, `DataTable`, `RelatedPanel`, `CategoryHub`

### P2 全ページ UI
- `CityPageTemplate` → ヒーロー帯 + カード本文 + 表コンポーネント
- `LegacyGuideLayout` → モダン sidebar + 記事レイアウト
- カテゴリ index（kurashi, anzen…）→ ハブグリッド
- トップ `CinematicHero` + `SiteFooter` 強化

### P3 モーション
- GSAP: ページ遷移感、ScrollTrigger セクション、メガメニュー
- Lucide: ナビ・検索・パンくず・外部リンク

### P4 評価ループ
- 評価タスクが municipal ベンチマークと照合 → 差分を P2/P3 に反映

### P5 納品チェック
- build / 全ルート smoke / gate 本番挙動維持

## 実施済み（2026-06）

- 旧 HTML/CSS/JS 削除 → `src/content/pages/*.json` が正
- デザインシステム + CityPageTemplate / LegacyGuideLayout 刷新
- トップ: お知らせ帯・スライド操作・よく使うページ
- SiteHeader: 庁舎帯 + デスクトップ主要ナビ
- spot 5件 legacy 復元
- dev token-gate バイパス
- `AGENTS.md` / `docs/EVAL-CRITERIA.md` 評価ループ用

## コンテンツの単一ソース
- `src/content/pages/*.json` + `npm run extract`（旧 HTML がある場合のみ）
