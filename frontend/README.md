# Schliemann Frontend (Demo)

## セットアップ

```bash
cd frontend
npm install
npm run dev
```

## Google Maps API キーの設定

1. [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)でAPIキーを取得
2. `.env.local`ファイルを作成：
```bash
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

## 機能
- 言語一覧表示（サイドバー）
- 検索・フィルタ（ファミリー別）
- Google Maps表示
- 言語詳細パネル
- 比較機能
- ブックマーク機能
- 日本語UI（i18next）

## 技術スタック
- React 18 + TypeScript
- Vite
- Google Maps JavaScript API
- Tailwind CSS
- i18next

## データ
- `src/data/languages.json`: スタブ言語データ（10言語）
- `src/data/countries_official_languages.json`: 国別公用語（Wikidata取得）

## 公用語データの更新（Wikidataから）

```bash
# ルートから実行
./scripts/fetch_official_languages.js
# 実行後: frontend/src/data/countries_official_languages.json が更新されます
```