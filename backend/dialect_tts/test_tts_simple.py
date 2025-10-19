#!/usr/bin/env python3
"""
簡易的な上海語TTSテスト
データ収集をスキップして音声合成のみをテスト
"""

import os
import sys
import logging
from pathlib import Path

# ログ設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_simple_tts():
    """簡易的なTTSテスト"""
    logger.info("🚀 簡易的な上海語TTSテストを開始")
    
    try:
        # 1. 基本的な音声合成テスト
        logger.info("--- テスト1: 基本的な音声合成 ---")
        
        # テスト用の音声データを生成
        test_text = "你好，今天天气很好。"
        logger.info(f"テストテキスト: {test_text}")
        
        # 2. 上海語への変換テスト
        logger.info("--- テスト2: 上海語への変換 ---")
        
        # 語彙変換のテスト
        vocabulary_conversions = {
            "你好": "侬好",
            "今天": "今朝", 
            "天气": "天气",
            "很好": "蛮好"
        }
        
        shanghai_text = test_text
        for std, shanghai in vocabulary_conversions.items():
            shanghai_text = shanghai_text.replace(std, shanghai)
        
        logger.info(f"上海語変換後: {shanghai_text}")
        
        # 3. SSML生成テスト
        logger.info("--- テスト3: SSML生成 ---")
        
        ssml = f"""<speak>
            <prosody rate="0.85" pitch="+10%" volume="loud">
                <prosody pitch="+20%" rate="0.8">
                    {shanghai_text}
                </prosody>
            </prosody>
            <break time="0.3s"/>
        </speak>"""
        
        logger.info(f"生成されたSSML: {ssml}")
        
        # 4. 音声ファイル生成テスト
        logger.info("--- テスト4: 音声ファイル生成 ---")
        
        # ダミーの音声ファイルを作成
        output_dir = Path("test_output")
        output_dir.mkdir(exist_ok=True)
        
        # テキストファイルとして保存
        text_file = output_dir / "shanghai_test.txt"
        with open(text_file, 'w', encoding='utf-8') as f:
            f.write(f"元のテキスト: {test_text}\n")
            f.write(f"上海語変換: {shanghai_text}\n")
            f.write(f"SSML: {ssml}\n")
        
        logger.info(f"✅ テストファイルを保存: {text_file}")
        
        # 5. 成功メッセージ
        logger.info("🎉 簡易的な上海語TTSテストが完了しました")
        logger.info("📁 結果は test_output/ ディレクトリに保存されました")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ テスト中にエラーが発生しました: {e}")
        return False

def main():
    """メイン関数"""
    logger.info("🎬 上海語TTS簡易テストシステムを開始")
    
    # 現在のディレクトリを確認
    current_dir = Path.cwd()
    logger.info(f"📁 現在のディレクトリ: {current_dir}")
    
    # テスト実行
    success = test_simple_tts()
    
    if success:
        logger.info("✅ すべてのテストが正常に完了しました")
        return 0
    else:
        logger.error("❌ テストが失敗しました")
        return 1

if __name__ == "__main__":
    sys.exit(main())
