# 公開品質チェックリスト（プロデューサー用）

## PASS 条件（すべて満たす）

- [ ] トップ: お知らせ帯 + ヒーロー + よく使うページ + フッター信頼情報
- [ ] 下層: 帯付き PageHero + 白カード本文 + 表（DataTable）+ 関連リンク
- [ ] カテゴリ index: CategoryHub カードグリッド（8項目前後）
- [ ] legacy（guide/history/spot）: 統一ヘッダー + サイドナビ
- [ ] デスクトップ: 主要カテゴリへの横リンク（SiteHeader）
- [ ] モバイル: メガメニュー操作可能
- [ ] a11y: ヒーロー alt、スキップリンク、自動スライドはホバー/reduce で抑制
- [ ] 謎解き: token-gate / footprint / print error 維持
- [ ] `npm run build` 成功

## ベンチマーク意識

焼津市型 — 生活便利ナビ相当は MEGA_COLUMNS + CategoryHub で代替。  
信頼 — 電話番号、庁舎、お知らせ、フッターポリシーリンク。

## 差し戻し時

`docs/UPGRADE-MASTER-PLAN.md` の P0 に追記し、該当コンポーネントパスを明記すること。
