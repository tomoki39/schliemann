# 詳細テスト仕様

## テスト階層
- Unit（Jest/RTL）: 関数・UIコンポーネント
- Integration（Supertest）: API + DB
- E2E（Playwright）: 主要ユーザーフロー
- Visual Regression: UI差分

## ケース設計
- 検索/フィルタ/詳細/比較/ブックマーク
- エッジケース: 大量データ、ゼロ件、タイムアウト

## データ
- サンプルフィクスチャ（小）
- ベンチデータ（中〜大）

## パフォーマンステスト
- 指標: 初回描画, API応答p95, タイルレイテンシ
- 負荷: k6/Locust 等
