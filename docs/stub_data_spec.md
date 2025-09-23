# スタブデータ仕様（デモ用）

## files
- `stub/languages.json`
- `stub/language_areas.geojson`

## languages.json（例）
```json
[
  {"id":"jpn","name_ja":"日本語","family":"日本語族","total_speakers":125000000,"center":{"lat":35.68,"lng":139.76}},
  {"id":"eng","name_ja":"英語","family":"インド・ヨーロッパ","total_speakers":1500000000,"center":{"lat":51.50,"lng":-0.12}},
  {"id":"cmn","name_ja":"中国語(官話)","family":"シナ・チベット","total_speakers":1100000000,"center":{"lat":39.90,"lng":116.40}}
]
```

## language_areas.geojson（例・簡略）
```json
{
  "type":"FeatureCollection",
  "features":[
    {"type":"Feature","properties":{"id":"jpn","name":"日本語"},"geometry":{"type":"Point","coordinates":[139.76,35.68]}},
    {"type":"Feature","properties":{"id":"eng","name":"英語"},"geometry":{"type":"Point","coordinates":[-0.12,51.50]}},
    {"type":"Feature","properties":{"id":"cmn","name":"中国語(官話)"},"geometry":{"type":"Point","coordinates":[116.40,39.90]}}
  ]
}
```
