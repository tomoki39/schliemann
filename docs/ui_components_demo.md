# デモ用UIコンポーネント仕様（最小）

## 構成
- Header: ロゴ / 検索バー / 言語切替（ja）
- Sidebar: 言語一覧 / フィルタ（ファミリー）
- MapView: Leaflet地図 / マーカー / ホバー
- DetailPanel: 言語の基本情報
- ComparePanel: 2言語の簡易比較（タブ切替）

## Props（概略）
- LanguageList: `items: Language[]`, `onSelect(id)`
- MapView: `markers: {id, lat, lng, name}[]`, `onClick(id)`
- DetailPanel: `language: Language | null`
- ComparePanel: `left: Language | null`, `right: Language | null`

## 型（抜粋）
```ts
type Language = {
  id: string;
  name_ja: string;
  family: string;
  total_speakers?: number;
  center?: { lat: number; lng: number };
};
```
