# Frontend Quickstart（デモ用）

## 前提
- Node.js 18+

## セットアップ
```bash
# 1) プロジェクト作成（例: Vite）
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# 2) 依存関係
npm i leaflet react-leaflet i18next react-i18next
npm i -D vite-plugin-svgr

# 3) 開発起動
npm run dev
```

## ディレクトリ指針（例）
```
frontend/
  src/
    components/
      Header.tsx
      Sidebar.tsx
      MapView.tsx
      DetailPanel.tsx
      ComparePanel.tsx
    i18n/
      ja.json
    data/
      languages.json
      language_areas.geojson
```

## 注意
- Leaflet CSSのインポートを忘れずに
- 地図の高さ（vh）指定で初期表示調整
