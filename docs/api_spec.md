# API仕様（匿名利用ファースト）

## 共通
- ベースURL: `/api`
- 形式: JSON（UTF-8）
- 認証: 不要（GET系）。管理系/投稿系のみ認証必須
- レート制限: IPベース（例: 60 req/min）
- エラー: `{ "error": { "code": string, "message": string } }`

## 言語（Linguistics）

### GET /languages
- クエリ: `q`（部分一致）, `family`, `status`, `limit`, `offset`
- 200: `{ items: Language[], total: number }`

### GET /languages/:id
- 200: `Language`（基本情報 + 派生リンク）

### GET /languages/:id/areas
- クエリ: `year?`, `level?`
- 200: `{ items: LanguageArea[] }`

### GET /languages/:id/writing-systems
- 200: `{ items: WritingSystem[] }`

### GET /search
- 横断検索: `q`, `type?=language|dialect`, `limit`, `offset`
- 200: `{ items: SearchHit[] }`

## 地図・可視化

### GET /tiles/language-areas/{z}/{x}/{y}.pbf
- Vector Tile（MVT）
- 200: application/vnd.mapbox-vector-tile

### GET /stats/languages
- 集計（国/系統など）: `by=country|family`, `year?`
- 200: `{ items: Aggregation[] }`

## UGC/管理（将来。認証必須）
- POST /contrib/languages/:id/areas  // 提案投稿
- GET  /contrib/reviews               // モデレーション一覧
- POST /admin/approve                 // 承認

## 型（抜粋）
- Language: `{ id, name_ja, name_en, family, branch, subgroup, total_speakers, vitality_status }`
- LanguageArea: `{ id, language_id, level, area_name, speaker_count, centroid{lat,lng}, boundary(GeoJSON), source, valid_from, valid_to }`
- WritingSystem: `{ id, system, type, usage, characters_count }`
