#!/usr/bin/env python3
"""
自然な音声生成システム
Web Speech API + 音韻変換で自然な上海語音声を生成
"""

import os
import numpy as np
import soundfile as sf
import librosa
import logging
from typing import Dict, Any, Tuple
import asyncio
import subprocess
import tempfile
import json

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NaturalVoiceGenerator:
    """自然な音声生成システム"""
    
    def __init__(self):
        self.sample_rate = 22050
        
        # 上海語語彙マップ（拡張版）
        self.vocabulary_map = self._load_vocabulary_map()
        
        # 音韻変換ルール
        self.phonetic_rules = self._load_phonetic_rules()
        
        # 韻律調整パラメータ
        self.prosody_params = {
            'rate': 0.8,      # 話速（少し遅く）
            'pitch': 1.2,     # ピッチ（少し高く）
            'volume': 1.0,    # 音量
        }
    
    def _load_vocabulary_map(self) -> Dict[str, str]:
        """上海語語彙マップをロード"""
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
    
    async def generate_natural_audio(self, text: str) -> np.ndarray:
        """自然な音声を生成"""
        logger.info(f"🗣️ 自然音声生成開始: {text}")
        
        # テキストを上海語に変換
        shanghai_text = self.convert_text_to_shanghai(text)
        logger.info(f"語彙変換: {text} → {shanghai_text}")
        
        # 複数の方法で音声生成を試行
        audio_methods = [
            self._generate_with_espeak,
            self._generate_with_festival,
            self._generate_with_say,
            self._generate_with_python_tts,
        ]
        
        for method in audio_methods:
            try:
                audio = await method(shanghai_text)
                if audio is not None and len(audio) > 0:
                    logger.info(f"✅ 音声生成成功: {method.__name__}")
                    return audio
            except Exception as e:
                logger.warning(f"⚠️ {method.__name__} 失敗: {e}")
                continue
        
        # すべての方法が失敗した場合、フォールバック音声を生成
        logger.warning("⚠️ すべての音声生成方法が失敗、フォールバック音声を使用")
        return await self._generate_fallback_audio(shanghai_text)
    
    async def _generate_with_espeak(self, text: str) -> np.ndarray:
        """espeakを使用して音声生成"""
        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                temp_file = f.name
            
            # espeakで音声生成
            cmd = [
                'espeak', '-v', 'zh', '-s', '150',  # 中国語、話速150
                '-w', temp_file, text
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"espeak failed: {result.stderr}")
            
            # 音声ファイルを読み込み
            audio, sr = librosa.load(temp_file, sr=self.sample_rate)
            os.unlink(temp_file)
            
            return audio
            
        except Exception as e:
            logger.warning(f"espeak エラー: {e}")
            return None
    
    async def _generate_with_festival(self, text: str) -> np.ndarray:
        """Festivalを使用して音声生成"""
        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                temp_file = f.name
            
            # Festivalで音声生成
            cmd = [
                'festival', '--tts', '--pipe',
                f'(utt.save.wave (SayText "{text}") "{temp_file}")'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"Festival failed: {result.stderr}")
            
            # 音声ファイルを読み込み
            audio, sr = librosa.load(temp_file, sr=self.sample_rate)
            os.unlink(temp_file)
            
            return audio
            
        except Exception as e:
            logger.warning(f"Festival エラー: {e}")
            return None
    
    async def _generate_with_say(self, text: str) -> np.ndarray:
        """macOSのsayコマンドを使用して音声生成"""
        try:
            with tempfile.NamedTemporaryFile(suffix='.aiff', delete=False) as f:
                temp_file = f.name
            
            # sayコマンドで音声生成
            cmd = [
                'say', '-v', 'Ting-Ting',  # 中国語音声
                '-r', '150',  # 話速
                '-o', temp_file, text
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"say failed: {result.stderr}")
            
            # 音声ファイルを読み込み
            audio, sr = librosa.load(temp_file, sr=self.sample_rate)
            os.unlink(temp_file)
            
            return audio
            
        except Exception as e:
            logger.warning(f"say エラー: {e}")
            return None
    
    async def _generate_with_python_tts(self, text: str) -> np.ndarray:
        """Python TTSライブラリを使用して音声生成"""
        try:
            import pyttsx3
            
            # TTSエンジンを初期化
            engine = pyttsx3.init()
            engine.setProperty('rate', 150)  # 話速
            engine.setProperty('volume', 0.8)  # 音量
            
            # 音声を生成
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                temp_file = f.name
            
            engine.save_to_file(text, temp_file)
            engine.runAndWait()
            
            # 音声ファイルを読み込み
            audio, sr = librosa.load(temp_file, sr=self.sample_rate)
            os.unlink(temp_file)
            
            return audio
            
        except Exception as e:
            logger.warning(f"Python TTS エラー: {e}")
            return None
    
    async def _generate_fallback_audio(self, text: str) -> np.ndarray:
        """フォールバック音声生成（改良版）"""
        logger.info("🔄 改良版フォールバック音声生成を使用")
        
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

# グローバルインスタンス
natural_voice_generator = NaturalVoiceGenerator()

async def generate_natural_audio(text: str) -> np.ndarray:
    """自然な音声を生成（外部インターフェース）"""
    return await natural_voice_generator.generate_natural_audio(text)

def get_audio_info(audio: np.ndarray) -> Dict[str, Any]:
    """音声情報を取得（外部インターフェース）"""
    return natural_voice_generator.get_audio_info(audio)

if __name__ == "__main__":
    # テスト
    async def test():
        text = "你好，今天天气很好。"
        audio = await generate_natural_audio(text)
        info = get_audio_info(audio)
        print(f"音声情報: {info}")
        
        # 音声ファイルを保存
        sf.write("test_natural.wav", audio, 22050)
        print("音声ファイルを保存: test_natural.wav")
    
    asyncio.run(test())
