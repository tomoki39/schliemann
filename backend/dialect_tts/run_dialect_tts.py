#!/usr/bin/env python3
"""
方言TTS実行スクリプト
上海語音声変換システムのテストとデモ
"""

import asyncio
import logging
import sys
from pathlib import Path

# 現在のディレクトリをパスに追加
sys.path.append(str(Path(__file__).parent))

from dialect_detector import DialectDetector, DialectType
from voice_converter import ShanghaiVoiceConverter, VoiceConversionConfig
from unified_tts import UnifiedTTS, TTSConfig

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DialectTTSTester:
    """方言TTSテストクラス"""
    
    def __init__(self):
        self.dialect_detector = DialectDetector()
        self.voice_converter = ShanghaiVoiceConverter()
        
        # TTS設定（実際の値に置き換え）
        self.tts_config = TTSConfig(
            google_cloud_api_key="your-api-key",
            google_cloud_project_id="your-project-id",
            voice_conversion_enabled=True,
            auto_dialect_detection=True,
            confidence_threshold=0.3
        )
        
        self.unified_tts = UnifiedTTS(self.tts_config)
    
    async def test_dialect_detection(self):
        """方言判定のテスト"""
        logger.info("=== 方言判定テスト ===")
        
        test_cases = [
            "你好，今天天气很好",      # 標準語
            "侬好，今朝天气蛮好",      # 上海語
            "我们一起去吃饭吧",        # 標準語
            "阿拉一起去吃饭吧",        # 上海語
            "巴适得很，要得不",        # 四川語
            "오이소, 모하노?",         # 慶尚方言
            "혼저 옵서예"              # 済州方言
        ]
        
        for text in test_cases:
            dialect, confidence = self.dialect_detector.detect_dialect(text)
            logger.info(f"テキスト: {text}")
            logger.info(f"判定結果: {dialect.value} (信頼度: {confidence:.2f})")
            logger.info("-" * 50)
    
    async def test_text_conversion(self):
        """テキスト変換のテスト"""
        logger.info("=== テキスト変換テスト ===")
        
        test_texts = [
            "你好，今天天气很好",
            "我们一起去吃饭吧",
            "谢谢你的帮助",
            "再见，明天见"
        ]
        
        for text in test_texts:
            # 上海語に変換
            shanghai_text = self.dialect_detector.suggest_dialect_conversion(
                text, DialectType.SHANGHAI
            )
            
            logger.info(f"元のテキスト: {text}")
            logger.info(f"上海語変換: {shanghai_text}")
            logger.info("-" * 30)
    
    async def test_voice_conversion(self):
        """音声変換のテスト"""
        logger.info("=== 音声変換テスト ===")
        
        # テスト音声を生成（簡易実装）
        import numpy as np
        sample_rate = 22050
        duration = 2.0
        t = np.linspace(0, duration, int(sample_rate * duration))
        test_audio = np.sin(2 * np.pi * 440 * t)  # 440Hzのサイン波
        
        test_text = "侬好，今朝天气蛮好"
        
        try:
            # 音声変換
            converted_audio = self.voice_converter.convert_audio(test_audio, test_text)
            
            # 結果保存
            import soundfile as sf
            output_path = "output/voice_conversion_test.wav"
            sf.write(output_path, converted_audio, sample_rate)
            
            logger.info(f"音声変換テスト完了: {output_path}")
            
        except Exception as e:
            logger.error(f"音声変換テストエラー: {e}")
    
    async def test_unified_tts(self):
        """統合TTSのテスト"""
        logger.info("=== 統合TTSテスト ===")
        
        test_cases = [
            ("你好，今天天气很好", "standard"),
            ("侬好，今朝天气蛮好", "shanghai"),
            ("我们一起去吃饭吧", "auto"),
            ("阿拉一起去吃饭吧", "auto")
        ]
        
        for text, dialect in test_cases:
            try:
                logger.info(f"音声合成テスト: {text} (方言: {dialect})")
                
                # 音声合成
                result = await self.unified_tts.synthesize(
                    text, 
                    DialectType(dialect) if dialect != "auto" else None
                )
                
                if result['success']:
                    logger.info(f"✅ 成功: {result['dialect']} - {result['provider']}")
                    if result.get('converted'):
                        logger.info("  音声変換が適用されました")
                else:
                    logger.error(f"❌ 失敗: {result['error']}")
                
                logger.info("-" * 50)
                
            except Exception as e:
                logger.error(f"統合TTSテストエラー: {e}")
    
    async def run_all_tests(self):
        """全テストを実行"""
        logger.info("方言TTSシステムテスト開始")
        
        try:
            # 1. 方言判定テスト
            await self.test_dialect_detection()
            
            # 2. テキスト変換テスト
            await self.test_text_conversion()
            
            # 3. 音声変換テスト
            await self.test_voice_conversion()
            
            # 4. 統合TTSテスト
            await self.test_unified_tts()
            
            logger.info("全テスト完了！")
            
        except Exception as e:
            logger.error(f"テスト実行エラー: {e}")

def main():
    """メイン実行関数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="方言TTSシステムテスト")
    parser.add_argument("--test", type=str, 
                       choices=["detection", "conversion", "voice", "tts", "all"],
                       default="all", help="実行するテスト")
    
    args = parser.parse_args()
    
    # テスト実行
    tester = DialectTTSTester()
    
    async def run_test():
        if args.test == "detection":
            await tester.test_dialect_detection()
        elif args.test == "conversion":
            await tester.test_text_conversion()
        elif args.test == "voice":
            await tester.test_voice_conversion()
        elif args.test == "tts":
            await tester.test_unified_tts()
        elif args.test == "all":
            await tester.run_all_tests()
    
    # 非同期実行
    asyncio.run(run_test())

if __name__ == "__main__":
    main()
