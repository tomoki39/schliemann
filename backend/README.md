# AI音声変換API モックサーバー

## 概要
実際のAI音声変換サービスが利用できない場合のテスト用モックサーバーです。

## セットアップ

### 1. 依存関係のインストール
```bash
cd backend
pip install -r requirements.txt
```

### 2. サーバーの起動
```bash
python mock_server.py
```

サーバーは `http://localhost:8000` で起動します。

## APIエンドポイント

### ヘルスチェック
```
GET /health
```
サービスが正常に動作しているかチェックします。

### 方言リスト取得
```
GET /dialects
```
利用可能な方言のリストを取得します。

### 音声変換
```
POST /voice/convert
Content-Type: application/json

{
  "text": "変換したいテキスト",
  "source_language": "ja",
  "target_dialect": "osaka",
  "voice_settings": {
    "rate": 1.0,
    "pitch": 1.0,
    "volume": 1.0
  }
}
```

### サービス状態取得
```
GET /voice/status
```
音声変換サービスの詳細な状態を取得します。

## 対応方言
- tokyo (東京)
- osaka (大阪)
- kyoto (京都)
- hiroshima (広島)
- fukuoka (福岡)
- sendai (仙台)
- nagoya (名古屋)
- sapporo (札幌)
- okinawa (沖縄)
- kagoshima (鹿児島)

## 注意事項
- このモックサーバーは実際のAI音声変換は行いません
- 生成される音声は正弦波によるテスト用の音声です
- 実際のプロダクション環境では、適切なAI音声変換サービスに置き換えてください

