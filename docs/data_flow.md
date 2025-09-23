# データフロー・処理フロー（MVP）

## クライアント → API
1) 検索/フィルタ適用
2) `/languages`・`/languages/:id/areas` 取得
3) タイル `/tiles/language-areas/{z}/{x}/{y}.pbf` 取得
4) 詳細パネルの補助データ取得（文字体系、統計）

## サーバー内フロー
- API（Express）: 入力検証 → キャッシュ（Redis）→ DB（PostGIS）
- タイル: 事前ベクトルタイル（tippecanoe/tegola） or 動的MVT（ST_AsMVT）
- 集計API: マテビュー/集約テーブル参照

## キャッシュ戦略
- CDN: タイル/静的
- Redis: 検索・詳細APIの短期キャッシュ
- ブラウザ: ETag/Cache-Control

## 失敗時
- フォールバック: 概要レベル境界のみ表示
- リトライ: エクスポネンシャルバックオフ
- 監視: 失敗率閾値でアラート
