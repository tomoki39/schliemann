#!/usr/bin/env python3
"""
AI音声変換TTSサーバー
フロントエンドから呼び出されるAPIサーバー
"""

import os
import sys
import asyncio
import logging
import uuid
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import json

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from backend.dialect_tts.enhanced_ai_tts_system import enhanced_tts_system

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flaskアプリケーション
app = Flask(__name__)
CORS(app)

# グローバルTTSシステム（改良版を使用）
tts_system = enhanced_tts_system

def initialize_tts_system():
    """TTSシステムを初期化"""
    try:
        logger.info("✅ 改良版AI音声変換TTSシステムを初期化")
        return True
    except Exception as e:
        logger.error(f"❌ TTSシステム初期化エラー: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェック"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI TTS System',
        'version': '1.0.0'
    })

@app.route('/synthesize', methods=['POST'])
async def synthesize_speech():
    """音声合成API"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        dialect = data.get('dialect', 'shanghai')
        
        if not text:
            return jsonify({'error': 'テキストが指定されていません'}), 400
        
        logger.info(f"🎵 音声合成リクエスト: {text} (方言: {dialect})")
        
        # 方言音声を合成
        audio = await tts_system.synthesize_dialect_audio(text, dialect)
        
        # 一時ファイルに保存（サーバーのルートディレクトリに）
        temp_filename = f"tmp_{uuid.uuid4().hex}.wav"
        temp_path = os.path.join(os.getcwd(), temp_filename)
        import soundfile as sf
        sf.write(temp_path, audio, tts_system.sample_rate)
        
        # 音声情報を取得
        audio_info = tts_system.get_audio_info(audio)
        
        logger.info(f"✅ 音声合成完了: {temp_path}")
        
        # 相対パスに変換（フロントエンドがアクセスしやすいように）
        relative_path = os.path.basename(temp_path)
        
        return jsonify({
            'success': True,
            'audio_path': relative_path,
            'audio_info': audio_info,
            'text': text,
            'dialect': dialect
        })
        
    except Exception as e:
        logger.error(f"❌ 音声合成エラー: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/audio/<path:filename>')
def get_audio(filename):
    """音声ファイルを取得"""
    try:
        return send_file(filename, as_attachment=True)
    except Exception as e:
        logger.error(f"❌ 音声ファイル取得エラー: {e}")
        return jsonify({'error': str(e)}), 404

@app.route('/vocabulary', methods=['GET'])
def get_vocabulary():
    """語彙マップを取得"""
    try:
        vocabulary = tts_system.vocabulary_map
        return jsonify({
            'success': True,
            'vocabulary': vocabulary,
            'count': len(vocabulary)
        })
    except Exception as e:
        logger.error(f"❌ 語彙取得エラー: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/convert-text', methods=['POST'])
def convert_text():
    """テキストを上海語に変換"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'テキストが指定されていません'}), 400
        
        # 上海語に変換
        shanghai_text = tts_system.convert_text_to_shanghai(text)
        
        return jsonify({
            'success': True,
            'original': text,
            'shanghai': shanghai_text,
            'changed': text != shanghai_text
        })
        
    except Exception as e:
        logger.error(f"❌ テキスト変換エラー: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/model-status', methods=['GET'])
def get_model_status():
    """モデルの状態を取得"""
    try:
        return jsonify({
            'success': True,
            'model_loaded': tts_system.is_model_loaded,
            'device': str(tts_system.device),
            'sample_rate': tts_system.sample_rate,
            'vocabulary_count': len(tts_system.vocabulary_map)
        })
    except Exception as e:
        logger.error(f"❌ モデル状態取得エラー: {e}")
        return jsonify({'error': str(e)}), 500

def main():
    """メイン関数"""
    logger.info("🚀 AI音声変換TTSサーバーを起動")
    
    # TTSシステムを初期化
    if not initialize_tts_system():
        logger.error("❌ TTSシステムの初期化に失敗しました")
        return 1
    
    # サーバーを起動
    port = int(os.environ.get('PORT', 5002))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"🌐 サーバーを起動: http://{host}:{port}")
    logger.info("📋 利用可能なエンドポイント:")
    logger.info("  GET  /health - ヘルスチェック")
    logger.info("  POST /synthesize - 音声合成")
    logger.info("  GET  /audio/<filename> - 音声ファイル取得")
    logger.info("  GET  /vocabulary - 語彙マップ取得")
    logger.info("  POST /convert-text - テキスト変換")
    logger.info("  GET  /model-status - モデル状態取得")
    
    app.run(host=host, port=port, debug=True)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
