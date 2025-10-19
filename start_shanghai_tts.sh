#!/bin/bash

echo "🚀 上海語方言TTSシステムを起動しています..."
echo ""

# 環境変数の確認
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

echo "✅ 環境変数が設定されています"
echo "🔑 API Key: ${GOOGLE_CLOUD_API_KEY:0:10}..."
echo "🏗️ Project ID: $GOOGLE_CLOUD_PROJECT_ID"
echo ""

# バックエンドディレクトリに移動
cd backend/dialect_tts

echo "📦 依存関係をインストールしています..."
pip install -r requirements.txt

echo ""
echo "🌐 上海語方言TTSサーバーを起動しています..."
echo "📍 サーバーURL: http://localhost:5000"
echo "🛑 停止するには Ctrl+C を押してください"
echo "----------------------------------------"

# サーバーを起動
python run_server.py
