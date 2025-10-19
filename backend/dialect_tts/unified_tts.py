#!/usr/bin/env python3
"""
統合TTSシステム
標準語と上海語の使い分けができる統合音声合成システム
"""

import logging
from typing import Dict, Optional, Tuple, Union
from pathlib import Path
import json
import asyncio
from dataclasses import dataclass

# 既存のモジュールをインポート
from dialect_detector import DialectDetector, DialectType
from voice_converter import ShanghaiVoiceConverter, VoiceConversionConfig
from googleCloudTTSService import GoogleCloudTTSService

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TTSConfig:
    """TTS設定"""
    google_cloud_api_key: str
    google_cloud_project_id: str
    voice_conversion_enabled: bool = True
    auto_dialect_detection: bool = True
    confidence_threshold: float = 0.3

class UnifiedTTS:
    """統合TTSシステム"""
    
    def __init__(self, config: TTSConfig):
        self.config = config
        
        # 方言判定器
        self.dialect_detector = DialectDetector()
        
        # Google Cloud TTS（標準語用）
        self.google_tts = GoogleCloudTTSService(
            api_key=config.google_cloud_api_key,
            project_id=config.google_cloud_project_id
        )
        
        # 上海語音声変換器
        if config.voice_conversion_enabled:
            self.shanghai_converter = ShanghaiVoiceConverter()
        else:
            self.shanghai_converter = None
        
        # 音声品質設定
        self.voice_settings = {
            'standard': {
                'language_code': 'cmn-CN',
                'voice_name': 'cmn-CN-Wavenet-A',
                'ssml_gender': 'NEUTRAL',
                'speaking_rate': 1.0,
                'pitch': 0.0,
                'volume_gain_db': 0.0
            },
            'shanghai': {
                'language_code': 'cmn-CN',  # ベースは標準語
                'voice_name': 'cmn-CN-Wavenet-A',
                'ssml_gender': 'NEUTRAL',
                'speaking_rate': 0.95,  # やや遅め
                'pitch': 0.2,           # 少し高め
                'volume_gain_db': 0.0
            }
        }
    
    async def synthesize(self, 
                        text: str, 
                        dialect: Optional[DialectType] = None,
                        force_dialect: bool = False) -> Dict[str, any]:
        """
        テキストを音声合成
        
        Args:
            text: 合成するテキスト
            dialect: 指定する方言（Noneの場合は自動判定）
            force_dialect: 強制的に方言変換を適用するか
            
        Returns:
            音声合成結果の辞書
        """
        try:
            # 方言を判定
            if dialect is None and self.config.auto_dialect_detection:
                detected_dialect, confidence = self.dialect_detector.detect_dialect(text)
                dialect = detected_dialect
                logger.info(f"方言自動判定: {dialect.value} (信頼度: {confidence:.2f})")
            elif dialect is None:
                dialect = DialectType.STANDARD
            
            # 方言に応じて音声合成
            if dialect == DialectType.SHANGHAI:
                return await self._synthesize_shanghai(text, force_dialect)
            else:
                return await self._synthesize_standard(text)
                
        except Exception as e:
            logger.error(f"音声合成エラー: {e}")
            return {
                'success': False,
                'error': str(e),
                'dialect': dialect.value if dialect else 'unknown'
            }
    
    async def _synthesize_standard(self, text: str) -> Dict[str, any]:
        """標準語で音声合成"""
        try:
            # Google Cloud TTSで音声合成
            settings = self.voice_settings['standard']
            
            audio_data = await self.google_tts.synthesize_speech(
                text=text,
                language_code=settings['language_code'],
                voice_name=settings['voice_name'],
                ssml_gender=settings['ssml_gender'],
                speaking_rate=settings['speaking_rate'],
                pitch=settings['pitch'],
                volume_gain_db=settings['volume_gain_db']
            )
            
            return {
                'success': True,
                'audio_data': audio_data,
                'dialect': 'standard',
                'provider': 'google_cloud_tts',
                'text': text
            }
            
        except Exception as e:
            logger.error(f"標準語音声合成エラー: {e}")
            return {
                'success': False,
                'error': str(e),
                'dialect': 'standard'
            }
    
    async def _synthesize_shanghai(self, text: str, force_dialect: bool = False) -> Dict[str, any]:
        """上海語で音声合成"""
        try:
            # 1. 標準語で音声合成
            standard_result = await self._synthesize_standard(text)
            
            if not standard_result['success']:
                return standard_result
            
            # 2. 上海語に変換（音声変換が有効な場合）
            if self.shanghai_converter and (force_dialect or self._should_convert_to_dialect(text)):
                try:
                    # 音声データを取得
                    audio_data = standard_result['audio_data']
                    
                    # 上海語に音声変換
                    converted_audio = self.shanghai_converter.convert_audio(audio_data, text)
                    
                    return {
                        'success': True,
                        'audio_data': converted_audio,
                        'dialect': 'shanghai',
                        'provider': 'google_cloud_tts + voice_conversion',
                        'text': text,
                        'converted': True
                    }
                    
                except Exception as e:
                    logger.warning(f"音声変換エラー、標準語音声を返します: {e}")
                    return standard_result
            else:
                # 音声変換なしで標準語音声を返す
                return {
                    **standard_result,
                    'dialect': 'shanghai',
                    'converted': False
                }
                
        except Exception as e:
            logger.error(f"上海語音声合成エラー: {e}")
            return {
                'success': False,
                'error': str(e),
                'dialect': 'shanghai'
            }
    
    def _should_convert_to_dialect(self, text: str) -> bool:
        """方言変換を適用すべきか判定"""
        # 上海語特有の語彙が含まれているかチェック
        shanghai_indicators = ['侬', '阿拉', '今朝', '蛮好', '啥', '哪能', '啥地方', '谢谢侬']
        return any(indicator in text for indicator in shanghai_indicators)
    
    def get_supported_dialects(self) -> list:
        """サポートされている方言のリストを取得"""
        return [dialect.value for dialect in DialectType if dialect != DialectType.AUTO]
    
    def get_dialect_info(self, dialect: DialectType) -> Dict[str, any]:
        """方言の詳細情報を取得"""
        return self.dialect_detector.get_dialect_info(dialect)
    
    def suggest_text_conversion(self, text: str, target_dialect: DialectType) -> str:
        """テキストを指定された方言に変換する提案"""
        return self.dialect_detector.suggest_dialect_conversion(text, target_dialect)
    
    async def batch_synthesize(self, texts: list, dialect: Optional[DialectType] = None) -> list:
        """複数のテキストを一括音声合成"""
        results = []
        
        for text in texts:
            result = await self.synthesize(text, dialect)
            results.append(result)
        
        return results

class TTSManager:
    """TTS管理クラス（シングルトン）"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._tts = None
            self._initialized = True
    
    def initialize(self, config: TTSConfig):
        """TTSシステムを初期化"""
        self._tts = UnifiedTTS(config)
        logger.info("TTSシステムを初期化しました")
    
    def get_tts(self) -> UnifiedTTS:
        """TTSシステムを取得"""
        if self._tts is None:
            raise RuntimeError("TTSシステムが初期化されていません")
        return self._tts

# グローバルTTS管理インスタンス
tts_manager = TTSManager()

def get_tts() -> UnifiedTTS:
    """グローバルTTSインスタンスを取得"""
    return tts_manager.get_tts()

def initialize_tts(config: TTSConfig):
    """TTSシステムを初期化"""
    tts_manager.initialize(config)

async def synthesize_text(text: str, dialect: Optional[DialectType] = None) -> Dict[str, any]:
    """テキストを音声合成（便利関数）"""
    tts = get_tts()
    return await tts.synthesize(text, dialect)

def main():
    """テスト実行"""
    # 設定
    config = TTSConfig(
        google_cloud_api_key="your-api-key",
        google_cloud_project_id="your-project-id",
        voice_conversion_enabled=True,
        auto_dialect_detection=True
    )
    
    # TTSシステム初期化
    initialize_tts(config)
    
    # テストケース
    test_cases = [
        "你好，今天天气很好",  # 標準語
        "侬好，今朝天气蛮好",  # 上海語
        "我们一起去吃饭吧",    # 標準語
        "阿拉一起去吃饭吧"     # 上海語
    ]
    
    async def run_tests():
        tts = get_tts()
        
        for text in test_cases:
            print(f"\nテキスト: {text}")
            
            # 自動判定で音声合成
            result = await tts.synthesize(text)
            
            if result['success']:
                print(f"方言: {result['dialect']}")
                print(f"プロバイダー: {result['provider']}")
                if result.get('converted'):
                    print("音声変換が適用されました")
            else:
                print(f"エラー: {result['error']}")
    
    # テスト実行
    asyncio.run(run_tests())

if __name__ == "__main__":
    main()
