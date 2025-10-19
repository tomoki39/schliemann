#!/bin/bash

echo "🚀 高品質方言TTSシステムを起動しています..."

# 環境変数が設定されているか確認
if [ -z "$GOOGLE_CLOUD_API_KEY" ]; then
  echo "❌ エラー: GOOGLE_CLOUD_API_KEYが設定されていません"
  echo "💡 以下のコマンドで設定してください:"
  echo "   export GOOGLE_CLOUD_API_KEY='your-api-key'"
  exit 1
fi

if [ -z "$GOOGLE_CLOUD_PROJECT_ID" ]; then
  echo "❌ エラー: GOOGLE_CLOUD_PROJECT_IDが設定されていません"
  echo "💡 以下のコマンドで設定してください:"
  echo "   export GOOGLE_CLOUD_PROJECT_ID='your-project-id'"
  exit 1
fi

# バックエンドディレクトリに移動
cd backend/dialect_tts || exit

# 依存関係をインストール
echo "📦 依存関係をインストールしています..."
pip install -r requirements.txt

# 高品質方言TTSシステムを実行
echo "🎵 高品質方言TTSシステムを実行しています..."
python run_advanced_tts.py --phase all

echo "🎉 高品質方言TTSシステムの実行が完了しました"
