# 公用語データ取り込み計画（雛形）

## 目的
- 全世界の国・地域ごとの公用語（複数可）を網羅的に取得し、`countries -> official_languages[]` および `language -> countries[]` を同期。

## データ源（優先度順）
1. Wikidata（SPARQL）: 国ごとの公用語 `P37`、地域・準州にも対応
2. Wikipedia（多言語版の表組パース）: 補完と検証
3. CIA World Factbook / Ethnologue ライセンス確認の上で参照

## スキーマ
- countries.json
```
{
  "JP": { "official_languages": ["jpn"] },
  "CH": { "official_languages": ["deu", "fra", "ita", "roh"] }
}
```

- languages.json（既存）
  - 各 `Language` に `countries: string[]` を保持

## 手順
1. SPARQLで`country -> official language (ISO 639-3)`を抽出
2. ISOコード正規化（ISO 3166-1 alpha-2、ISO 639-3/639-1のマッピング）
3. 重複・別名（英語/現地名）統合
4. 既存 `languages.json` と相互参照し `countries[]` を更新
5. 差分レビュー（変更点ログ）
6. 自動テスト（主要国の期待公用語を検証）

## 今後
- 週次更新（Wikidata変更取り込み）
- 地域（自治区・準州）への拡張
- UIフィルタへの国/地域レベル追加
