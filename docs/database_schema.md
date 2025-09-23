# データベーススキーマ（言語マップ・MVP）

## 方針
- PostgreSQL + PostGIS を採用
- 区画は MULTIPOLYGON、代表点は POINT（SRID: 4326）
- 読み取り中心（匿名利用ファースト）。書き込みは将来のUGC導入時に拡張

## エンティティ

### languages（言語）
- id: TEXT（ISO 639-3 など）PK
- name_ja: TEXT
- name_en: TEXT
- alternative_names: TEXT[]
- family: TEXT
- branch: TEXT
- subgroup: TEXT
- total_speakers: BIGINT
- vitality_status: TEXT  // Safe/Vulnerable/...
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### language_areas（言語分布領域）
- id: BIGSERIAL PK
- language_id: TEXT FK -> languages.id
- level: TEXT  // country|region|city|settlement
- area_name: TEXT
- speaker_count: BIGINT
- centroid: GEOGRAPHY(POINT, 4326)
- boundary: GEOGRAPHY(MULTIPOLYGON, 4326)
- source: TEXT  // データソース名
- valid_from: DATE
- valid_to: DATE NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### writing_systems（文字体系）
- id: BIGSERIAL PK
- language_id: TEXT FK
- system: TEXT  // Latin|Kanji|Cyrillic...
- type: TEXT    // Alphabet|Syllabary|Logographic...
- usage: TEXT
- characters_count: INT

### dialects（方言・変種）
- id: BIGSERIAL PK
- language_id: TEXT FK
- name: TEXT
- region: TEXT
- speakers: BIGINT
- status: TEXT  // Official|Vigorous|Vulnerable ...

### language_stats（統計・時系列）
- id: BIGSERIAL PK
- language_id: TEXT FK
- year: INT
- total_speakers: BIGINT
- urban_ratio: NUMERIC(5,3)
- growth_rate: NUMERIC(6,3)

## インデックス
- language_areas.boundary: GIST
- language_areas.centroid: GIST
- language_areas(language_id, level, valid_to)
- languages(family), languages(vitality_status)

## 権限
- 読み取り: PUBLIC（匿名可）
- 書き込み: 管理／モデレーションロールのみ（将来）

## 将来拡張（多分野）
- anthropology_areas / religion_areas など同型テーブルを追加
- cross_reference テーブルで分野横断の関連性を格納
