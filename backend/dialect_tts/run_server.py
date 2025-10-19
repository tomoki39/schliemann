#!/usr/bin/env python3
"""
上海語方言TTSサーバーの起動スクリプト
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    # プロジェクトのルートディレクトリを取得
    project_root = Path(__file__).parent.parent.parent
    backend_dir = Path(__file__).parent
    
    print("🚀 上海語方言TTSサーバーを起動しています...")
    print(f"📁 プロジェクトルート: {project_root}")
    print(f"📁 バックエンドディレクトリ: {backend_dir}")
    
    # 環境変数の確認
    google_cloud_api_key = os.getenv('GOOGLE_CLOUD_API_KEY')
    google_cloud_project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
    
    if not google_cloud_api_key:
        print("❌ エラー: GOOGLE_CLOUD_API_KEYが設定されていません")
        print("💡 以下のコマンドで設定してください:")
        print("   export GOOGLE_CLOUD_API_KEY='your-api-key'")
        return 1
    
    if not google_cloud_project_id:
        print("❌ エラー: GOOGLE_CLOUD_PROJECT_IDが設定されていません")
        print("💡 以下のコマンドで設定してください:")
        print("   export GOOGLE_CLOUD_PROJECT_ID='your-project-id'")
        return 1
    
    print("✅ 環境変数が設定されています")
    print(f"🔑 API Key: {google_cloud_api_key[:10]}...")
    print(f"🏗️ Project ID: {google_cloud_project_id}")
    
    # 依存関係のインストール
    print("\n📦 依存関係をインストールしています...")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], cwd=backend_dir, check=True)
        print("✅ 依存関係のインストールが完了しました")
    except subprocess.CalledProcessError as e:
        print(f"❌ 依存関係のインストールに失敗しました: {e}")
        return 1
    
    # Flaskサーバーの起動
    print("\n🌐 Flaskサーバーを起動しています...")
    print("📍 サーバーURL: http://localhost:5000")
    print("🛑 停止するには Ctrl+C を押してください")
    print("-" * 50)
    
    try:
        # Flaskアプリケーションを起動
        from flask import Flask, request, jsonify
        from unified_tts import UnifiedTTS
        import base64
        
        app = Flask(__name__)
        
        # 統合TTSシステムを初期化
        tts = UnifiedTTS(google_cloud_api_key, google_cloud_project_id)
        
        @app.route('/synthesize', methods=['POST'])
        def synthesize():
            try:
                data = request.get_json()
                text = data.get('text', '')
                dialect = data.get('dialect', 'auto')
                
                if not text:
                    return jsonify({
                        'success': False,
                        'error': 'テキストが空です'
                    }), 400
                
                print(f"🎙️ 音声合成リクエスト: {text[:50]}... (方言: {dialect})")
                
                # 音声合成を実行
                result = tts.synthesize(text, dialect)
                
                if result['success']:
                    print(f"✅ 音声合成成功: {result['provider']} ({result['dialect']})")
                    return jsonify(result)
                else:
                    print(f"❌ 音声合成失敗: {result.get('error', 'Unknown error')}")
                    return jsonify(result), 500
                    
            except Exception as e:
                print(f"❌ サーバーエラー: {e}")
                return jsonify({
                    'success': False,
                    'error': f'サーバーエラー: {str(e)}'
                }), 500
        
        @app.route('/health', methods=['GET'])
        def health():
            return jsonify({
                'status': 'healthy',
                'service': 'Shanghai Dialect TTS',
                'version': '1.0.0'
            })
        
        # サーバーを起動
        app.run(host='0.0.0.0', port=5001, debug=True)
        
    except KeyboardInterrupt:
        print("\n🛑 サーバーを停止しています...")
        return 0
    except Exception as e:
        print(f"❌ サーバー起動エラー: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
