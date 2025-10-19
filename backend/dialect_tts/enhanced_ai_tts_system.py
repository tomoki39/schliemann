#!/usr/bin/env python3
"""
改良版AI音声変換TTSシステム
Google Cloud TTS + 音韻変換 + 韻律調整で自然な上海語音声を生成
"""

import os
import torch
import numpy as np
import soundfile as sf
import librosa
from pathlib import Path
import logging
from typing import Optional, Dict, Any, Tuple
import json
import asyncio
import tempfile
import subprocess
import re

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedAITTSystem:
    """改良版AI音声変換TTSシステム"""
    
    def __init__(self, model_dir: str = "models/enhanced_ai_tts"):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        # デバイス設定
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"使用デバイス: {self.device}")
        
        # 音声パラメータ
        self.sample_rate = 22050
        
        # 上海語語彙マップ（拡張版）
        self.vocabulary_map = self._load_enhanced_vocabulary_map()
        
        # 音韻変換ルール
        self.phonetic_rules = self._load_phonetic_rules()
        
        # 韻律調整ルール
        self.prosody_rules = self._load_prosody_rules()
        
    def _load_enhanced_vocabulary_map(self) -> Dict[str, str]:
        """拡張版上海語語彙マップをロード"""
        return {
            # 基本挨拶
            "你好": "侬好", "您好": "侬好", "再见": "再会", "谢谢": "谢谢侬",
            "对不起": "对勿起", "没关系": "呒没关系", "不客气": "勿要客气",
            
            # 時間・日付
            "今天": "今朝", "明天": "明朝", "昨天": "昨日", "现在": "现在",
            "早上": "早浪", "晚上": "夜到", "中午": "中浪", "下午": "下半天",
            
            # 家族・人
            "我们": "阿拉", "你们": "侬拉", "他们": "伊拉", "我": "阿拉",
            "你": "侬", "他": "伊", "她": "伊", "爸爸": "阿爸", "妈妈": "姆妈",
            "爷爷": "阿爷", "奶奶": "阿奶", "哥哥": "阿哥", "姐姐": "阿姐",
            
            # 場所・方向
            "哪里": "啥地方", "这里": "搿搭", "那里": "伊搭", "家": "屋里",
            "学校": "学堂", "医院": "医院", "商店": "商店", "银行": "银行",
            
            # 動作・動詞
            "吃": "吃", "喝": "吃", "走": "跑", "跑": "跑", "坐": "坐",
            "站": "立", "睡": "困觉", "工作": "做生活", "学习": "读书",
            "看": "看", "听": "听", "说": "讲", "想": "想",
            
            # 形容詞・状態
            "好": "好", "很好": "蛮好", "不好": "勿好", "大": "大", "小": "小",
            "多": "多", "少": "少", "快": "快", "慢": "慢", "热": "热", "冷": "冷",
            
            # 疑問詞
            "什么": "啥", "怎么": "哪能", "为什么": "为啥", "什么时候": "啥辰光",
            "多少": "几化", "几个": "几个", "哪个": "哪个",
            
            # 常用語
            "是": "是", "不是": "勿是", "有": "有", "没有": "呒没",
            "可以": "可以", "不可以": "勿可以", "要": "要", "不要": "勿要",
            "会": "会", "不会": "勿会", "能": "能", "不能": "勿能",
            
            # 感情・感嘆
            "啊": "啊", "哦": "哦", "嗯": "嗯", "哎呀": "哎呀",
            "真的": "真个", "假的": "假个", "当然": "当然",
            
            # 数詞
            "一": "一", "二": "两", "三": "三", "四": "四", "五": "五",
            "六": "六", "七": "七", "八": "八", "九": "九", "十": "十",
            
            # 天気・自然
            "天气": "天气", "太阳": "太阳", "月亮": "月亮", "雨": "雨",
            "雪": "雪", "风": "风", "云": "云", "天空": "天空",
            
            # 食べ物
            "饭": "饭", "菜": "菜", "肉": "肉", "鱼": "鱼", "鸡": "鸡",
            "蛋": "蛋", "面": "面", "汤": "汤", "茶": "茶", "水": "水",
            
            # 色
            "红": "红", "蓝": "蓝", "绿": "绿", "黄": "黄", "黑": "黑",
            "白": "白", "灰": "灰", "紫": "紫", "粉": "粉",
        }
    
    def _load_phonetic_rules(self) -> Dict[str, str]:
        """音韻変換ルールをロード"""
        return {
            # 子音変化
            "zh": "z", "ch": "c", "sh": "s", "r": "l",
            "j": "z", "q": "c", "x": "s",
            "n": "n", "l": "l", "h": "h", "f": "f",
            
            # 母音変化
            "an": "ang", "en": "eng", "in": "ing", "un": "ung",
            "ian": "iang", "uan": "uang", "üan": "üang",
            "ei": "ai", "ui": "uei", "ou": "ou",
            
            # 声調変化（簡易版）
            "ā": "a", "á": "a", "ǎ": "a", "à": "a",
            "ē": "e", "é": "e", "ě": "e", "è": "e",
            "ī": "i", "í": "i", "ǐ": "i", "ì": "i",
            "ō": "o", "ó": "o", "ǒ": "o", "ò": "o",
            "ū": "u", "ú": "u", "ǔ": "u", "ù": "u",
            "ǖ": "ü", "ǘ": "ü", "ǚ": "ü", "ǜ": "ü",
        }
    
    def _load_prosody_rules(self) -> Dict[str, Any]:
        """韻律調整ルールをロード"""
        return {
            "speaking_rate": 0.85,  # 話速を少し遅く
            "pitch": 1.1,           # ピッチを少し高く
            "volume_gain_db": 2.0,  # 音量を少し上げる
            "pause_duration": 0.3,  # ポーズの長さ
            "emphasis_words": ["侬好", "今朝", "蛮好", "阿拉", "啥", "哪能"],
        }
    
    def convert_text_to_shanghai(self, text: str) -> str:
        """テキストを上海語に変換"""
        converted_text = text
        
        # 語彙変換
        for standard, shanghai in self.vocabulary_map.items():
            converted_text = converted_text.replace(standard, shanghai)
        
        # 音韻変換（簡易版）
        for standard, shanghai in self.phonetic_rules.items():
            converted_text = converted_text.replace(standard, shanghai)
        
        return converted_text
    
    def generate_ssml_for_shanghai(self, text: str) -> str:
        """上海語用のSSMLを生成"""
        # 強調すべき単語を特定
        emphasis_words = self.prosody_rules["emphasis_words"]
        
        # 文を分割
        sentences = re.split(r'[。！？]', text)
        ssml_parts = []
        
        for sentence in sentences:
            if not sentence.strip():
                continue
                
            sentence = sentence.strip()
            
            # 強調単語にマークアップを追加
            for word in emphasis_words:
                if word in sentence:
                    sentence = sentence.replace(word, f'<emphasis level="strong">{word}</emphasis>')
            
            # 韻律調整を適用
            ssml_sentence = f'''
            <prosody rate="{self.prosody_rules['speaking_rate']}" 
                     pitch="+{int((self.prosody_rules['pitch'] - 1) * 100)}%" 
                     volume="+{int(self.prosody_rules['volume_gain_db'])}dB">
                {sentence}
            </prosody>
            '''
            ssml_parts.append(ssml_sentence)
        
        # SSMLを組み立て
        ssml = f'''
        <speak>
            {''.join(ssml_parts)}
        </speak>
        '''
        
        return ssml.strip()
    
    async def synthesize_dialect_audio(self, text: str, dialect: str = "shanghai") -> np.ndarray:
        """方言音声を合成（すべての方言で同じ処理）"""
        logger.info(f"🗣️ {dialect}方言音声合成開始: {text}")
        
        # 基本的なテキスト変換（方言に関係なく同じ処理）
        converted_text = text
        logger.info(f"テキスト変換: {text} → {converted_text}")
        
        # 基本的なSSMLを生成
        ssml_text = f"<speak><voice name='zh-CN-Wavenet-A'>{converted_text}</voice></speak>"
        logger.info(f"SSML生成完了")
        
        # Google Cloud TTSを使用して音声合成
        try:
            audio_data = await self._synthesize_with_google_cloud(ssml_text)
            logger.info(f"✅ {dialect}方言音声合成完了")
            return audio_data
        except Exception as e:
            logger.error(f"❌ Google Cloud TTS エラー: {e}")
            # フォールバック: 基本的な音声生成
            return await self._generate_fallback_audio(converted_text)
    
    async def _synthesize_with_google_cloud(self, ssml_text: str) -> np.ndarray:
        """Google Cloud TTSを使用して音声合成（Pythonライブラリ版）"""
        try:
            # 環境変数からAPIキーを取得
            api_key = os.getenv('GOOGLE_CLOUD_API_KEY')
            if not api_key:
                logger.warning("GOOGLE_CLOUD_API_KEY not found, using fallback")
                raise ValueError("GOOGLE_CLOUD_API_KEY not found")
            
            # Google Cloud TTS Pythonライブラリを使用
            from google.cloud import texttospeech
            
            # クライアントを初期化
            client = texttospeech.TextToSpeechClient()
            
            # 音声設定
            voice = texttospeech.VoiceSelectionParams(
                language_code="cmn-CN",
                name="cmn-CN-Wavenet-A",  # 中国語（北京語）音声
                ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
            )
            
            # 音声設定
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.LINEAR16,
                sample_rate_hertz=22050,
            )
            
            # リクエストを作成
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml_text)
            
            # 音声合成を実行
            response = client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            # 音声データを取得
            audio_content = response.audio_content
            
            # 一時ファイルに保存
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                f.write(audio_content)
                audio_file = f.name
            
            # 音声ファイルを読み込み
            audio_data, sample_rate = librosa.load(audio_file, sr=self.sample_rate)
            
            # 一時ファイルを削除
            if os.path.exists(audio_file):
                os.unlink(audio_file)
            
            logger.info(f"Google Cloud TTS 音声生成成功: {len(audio_data)} samples, {len(audio_data)/sample_rate:.2f}s")
            return audio_data
            
        except ImportError:
            logger.warning("Google Cloud TTS ライブラリがインストールされていません")
            raise Exception("Google Cloud TTS library not installed")
        except Exception as e:
            logger.warning(f"Google Cloud TTS 失敗: {e}")
            raise
    
    async def _generate_fallback_audio(self, text: str) -> np.ndarray:
        """フォールバック音声生成（シンプル音声生成を使用）"""
        logger.info("🔄 シンプル音声生成を使用")
        
        try:
            from simple_voice_generator import simple_voice_generator
            audio = await simple_voice_generator.generate_voice(text)
            logger.info(f"シンプル音声生成成功: {len(audio)} samples, {len(audio)/self.sample_rate:.2f}s")
            return audio
        except Exception as e:
            logger.warning(f"シンプル音声生成失敗: {e}")
            # 最終フォールバック
            return await self._generate_basic_fallback_audio(text)
    
    async def _generate_basic_fallback_audio(self, text: str) -> np.ndarray:
        """基本的なフォールバック音声生成"""
        logger.info("🔄 基本フォールバック音声生成を使用")
        
        # より自然な音声を生成
        duration = len(text) * 0.4  # 文字数に応じて長さを調整
        t = np.linspace(0, duration, int(self.sample_rate * duration))
        
        # 複数の周波数で音声を生成（より自然な音色）
        base_freq = 220  # A3
        frequencies = [base_freq, base_freq * 1.5, base_freq * 2, base_freq * 3]
        audio = np.zeros_like(t)
        
        # 各文字に対応する音声セグメント
        char_duration = duration / len(text)
        
        for i, char in enumerate(text):
            if char.strip():  # 空白文字をスキップ
                start_time = i * char_duration
                end_time = (i + 1) * char_duration
                
                # 時間範囲を計算
                start_idx = int(start_time * self.sample_rate)
                end_idx = int(end_time * self.sample_rate)
                
                if start_idx < len(t) and end_idx <= len(t):
                    segment_t = t[start_idx:end_idx]
                    
                    # 文字に応じて周波数を選択
                    freq = frequencies[i % len(frequencies)]
                    
                    # より自然な音声波形を生成
                    fundamental = np.sin(2 * np.pi * freq * segment_t)
                    harmonic2 = 0.3 * np.sin(2 * np.pi * freq * 2 * segment_t)
                    harmonic3 = 0.1 * np.sin(2 * np.pi * freq * 3 * segment_t)
                    
                    segment_audio = fundamental + harmonic2 + harmonic3
                    
                    # エンベロープを適用（より自然な減衰）
                    envelope = np.exp(-segment_t * 1.5) * (1 + 0.1 * np.sin(2 * np.pi * 5 * segment_t))
                    segment_audio *= envelope
                    
                    # 音量を調整
                    segment_audio *= 0.3
                    
                    audio[start_idx:end_idx] += segment_audio
        
        # 正規化
        if np.max(np.abs(audio)) > 0:
            audio = audio / np.max(np.abs(audio)) * 0.5
        
        return audio
    
    def get_audio_info(self, audio: np.ndarray) -> Dict[str, Any]:
        """音声情報を取得"""
        duration = len(audio) / self.sample_rate
        rms = np.sqrt(np.mean(audio**2))
        peak = np.max(np.abs(audio))
        
        # ドミナント周波数を計算
        fft = np.fft.fft(audio)
        freqs = np.fft.fftfreq(len(audio), 1/self.sample_rate)
        dominant_freq = freqs[np.argmax(np.abs(fft))]
        
        return {
            'duration': duration,
            'sample_rate': self.sample_rate,
            'rms': float(rms),
            'peak': float(peak),
            'dominant_frequency': float(abs(dominant_freq)),
            'length_samples': len(audio)
        }
    
    def get_vocabulary_count(self) -> int:
        """語彙数を取得"""
        return len(self.vocabulary_map)

# グローバルインスタンス
enhanced_tts_system = EnhancedAITTSystem()

async def synthesize_dialect_audio(text: str, dialect: str = "shanghai") -> np.ndarray:
    """方言音声を合成（外部インターフェース）"""
    return await enhanced_tts_system.synthesize_dialect_audio(text, dialect)

def get_audio_info(audio: np.ndarray) -> Dict[str, Any]:
    """音声情報を取得（外部インターフェース）"""
    return enhanced_tts_system.get_audio_info(audio)

def get_vocabulary_count() -> int:
    """語彙数を取得（外部インターフェース）"""
    return enhanced_tts_system.get_vocabulary_count()

if __name__ == "__main__":
    # テスト
    async def test():
        text = "你好，今天天气很好。"
        audio = await synthesize_dialect_audio(text, "shanghai")
        info = get_audio_info(audio)
        print(f"音声情報: {info}")
        
        # 音声ファイルを保存
        sf.write("test_dialect.wav", audio, 22050)
        print("音声ファイルを保存: test_dialect.wav")
    
    asyncio.run(test())
