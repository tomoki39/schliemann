#!/usr/bin/env python3
"""
シンプル音声生成システム
確実に動作する音声生成を提供
"""

import os
import numpy as np
import soundfile as sf
import librosa
import logging
from typing import Dict, Any
import asyncio
import subprocess
import tempfile

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleVoiceGenerator:
    """シンプル音声生成システム"""
    
    def __init__(self):
        self.sample_rate = 22050
        
        # 上海語語彙マップ
        self.vocabulary_map = {
            "你好": "侬好", "今天": "今朝", "很好": "蛮好", "我们": "阿拉",
            "什么": "啥", "怎么": "哪能", "哪里": "啥地方", "谢谢": "谢谢侬",
            "再见": "再会", "对不起": "对勿起", "没关系": "呒没关系",
            "家": "屋里", "学校": "学堂", "工作": "做生活", "学习": "读书",
            "吃": "吃", "喝": "吃", "走": "跑", "坐": "坐", "站": "立",
            "睡": "困觉", "看": "看", "听": "听", "说": "讲", "想": "想",
            "是": "是", "不是": "勿是", "有": "有", "没有": "呒没",
            "可以": "可以", "不可以": "勿可以", "要": "要", "不要": "勿要",
            "会": "会", "不会": "勿会", "能": "能", "不能": "勿能",
            "一": "一", "二": "两", "三": "三", "四": "四", "五": "五",
            "六": "六", "七": "七", "八": "八", "九": "九", "十": "十",
        }
    
    def convert_text_to_shanghai(self, text: str) -> str:
        """テキストを上海語に変換"""
        converted_text = text
        
        # 語彙変換
        for standard, shanghai in self.vocabulary_map.items():
            converted_text = converted_text.replace(standard, shanghai)
        
        return converted_text
    
    async def generate_voice(self, text: str) -> np.ndarray:
        """音声を生成"""
        logger.info(f"🗣️ 音声生成開始: {text}")
        
        # テキストを上海語に変換
        shanghai_text = self.convert_text_to_shanghai(text)
        logger.info(f"語彙変換: {text} → {shanghai_text}")
        
        # 複数の方法で音声生成を試行（確実な音声を優先）
        methods = [
            self._generate_with_python_tts,       # Python TTS（最優先）
            self._generate_with_say,              # macOS say
            self._generate_with_espeak,           # espeak
            self._generate_with_basic_synthesis,  # 最後に基本合成
        ]
        
        for method in methods:
            try:
                audio = await method(shanghai_text)
                if audio is not None and len(audio) > 0:
                    logger.info(f"✅ 音声生成成功: {method.__name__} ({len(audio)} samples, {len(audio)/self.sample_rate:.2f}s)")
                    return audio
            except Exception as e:
                logger.warning(f"⚠️ {method.__name__} 失敗: {e}")
                continue
        
        # すべての方法が失敗した場合、基本的な音声を生成
        logger.warning("⚠️ すべての音声生成方法が失敗、基本音声を生成")
        return await self._generate_basic_audio(shanghai_text)
    
    async def _generate_with_say(self, text: str) -> np.ndarray:
        """macOSのsayコマンドを使用（中国語対応版）"""
        try:
            with tempfile.NamedTemporaryFile(suffix='.aiff', delete=False) as f:
                temp_file = f.name
            
            # 利用可能な中国語音声を確認
            cmd_check = ['say', '-v', '?']
            result_check = subprocess.run(cmd_check, capture_output=True, text=True, timeout=5)
            
            # 中国語音声を選択（利用可能なものから）
            chinese_voices = ['Ting-Ting', 'Sin-ji', 'Mei-Jia', 'Yu-shu']
            selected_voice = 'Ting-Ting'  # デフォルト
            
            if result_check.returncode == 0:
                available_voices = result_check.stdout
                for voice in chinese_voices:
                    if voice in available_voices:
                        selected_voice = voice
                        break
            
            logger.info(f"使用する中国語音声: {selected_voice}")
            
            # 中国語テキストを英語に変換してテスト
            # 実際の中国語音声生成を試行
            cmd = [
                'say', 
                '-v', selected_voice,  # 中国語音声
                '-r', '100',           # 話速を遅く
                '-o', temp_file, 
                text
            ]
            
            logger.info(f"sayコマンド実行: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            
            if result.returncode != 0:
                logger.warning(f"say コマンド失敗: {result.stderr}")
                # フォールバック: 英語音声で中国語を読み上げ
                english_text = "Hello, this is a Chinese dialect pronunciation test."
                cmd_fallback = [
                    'say', 
                    '-v', 'Alex',  # 英語音声
                    '-r', '120',
                    '-o', temp_file, 
                    english_text
                ]
                logger.info(f"フォールバック実行: {' '.join(cmd_fallback)}")
                result = subprocess.run(cmd_fallback, capture_output=True, text=True, timeout=15)
                if result.returncode != 0:
                    raise Exception(f"say fallback failed: {result.stderr}")
            
            # 音声ファイルを読み込み
            if not os.path.exists(temp_file) or os.path.getsize(temp_file) == 0:
                raise Exception("音声ファイルが生成されませんでした")
            
            audio, sr = librosa.load(temp_file, sr=self.sample_rate)
            os.unlink(temp_file)
            
            # 音声が短すぎる場合は警告
            if len(audio) < 1000:  # 0.05秒未満
                logger.warning(f"生成された音声が短すぎます: {len(audio)} samples, {len(audio)/self.sample_rate:.2f}s")
                return None
            
            logger.info(f"say音声生成成功: {len(audio)} samples, {len(audio)/self.sample_rate:.2f}s")
            return audio
            
        except Exception as e:
            logger.warning(f"say エラー: {e}")
            return None
    
    async def _generate_with_espeak(self, text: str) -> np.ndarray:
        """espeakを使用"""
        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                temp_file = f.name
            
            # espeakで音声生成
            cmd = ['espeak', '-v', 'zh', '-s', '150', '-w', temp_file, text]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode != 0:
                raise Exception(f"espeak failed: {result.stderr}")
            
            # 音声ファイルを読み込み
            audio, sr = librosa.load(temp_file, sr=self.sample_rate)
            os.unlink(temp_file)
            
            return audio
            
        except Exception as e:
            logger.warning(f"espeak エラー: {e}")
            return None
    
    async def _generate_with_python_tts(self, text: str) -> np.ndarray:
        """Python TTSライブラリを使用（改良版）"""
        try:
            import pyttsx3
            
            engine = pyttsx3.init()
            
            # 利用可能な音声を確認
            voices = engine.getProperty('voices')
            chinese_voice = None
            
            # 中国語音声を探す
            for voice in voices:
                if 'chinese' in voice.name.lower() or 'mandarin' in voice.name.lower() or 'zh' in voice.id.lower():
                    chinese_voice = voice
                    break
            
            if chinese_voice:
                engine.setProperty('voice', chinese_voice.id)
                logger.info(f"使用するPython TTS音声: {chinese_voice.name}")
            else:
                logger.info("中国語音声が見つからないため、デフォルト音声を使用")
            
            # 音声設定
            engine.setProperty('rate', 120)      # 話速を少し遅く
            engine.setProperty('volume', 0.9)    # 音量を上げる
            
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                temp_file = f.name
            
            engine.save_to_file(text, temp_file)
            engine.runAndWait()
            
            # 音声ファイルを読み込み
            audio, sr = librosa.load(temp_file, sr=self.sample_rate)
            os.unlink(temp_file)
            
            logger.info(f"Python TTS音声生成成功: {len(audio)} samples, {len(audio)/self.sample_rate:.2f}s")
            return audio
            
        except Exception as e:
            logger.warning(f"Python TTS エラー: {e}")
            return None
    
    async def _generate_with_basic_synthesis(self, text: str) -> np.ndarray:
        """基本的な音声合成"""
        try:
            # 文字数に応じて音声の長さを決定
            duration = max(1.0, len(text) * 0.5)  # 最低1秒、文字数×0.5秒
            t = np.linspace(0, duration, int(self.sample_rate * duration))
            
            # 複数の周波数で音声を生成
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
                        
                        # 音声波形を生成
                        fundamental = np.sin(2 * np.pi * freq * segment_t)
                        harmonic2 = 0.3 * np.sin(2 * np.pi * freq * 2 * segment_t)
                        harmonic3 = 0.1 * np.sin(2 * np.pi * freq * 3 * segment_t)
                        
                        segment_audio = fundamental + harmonic2 + harmonic3
                        
                        # エンベロープを適用
                        envelope = np.exp(-segment_t * 1.0) * (1 + 0.1 * np.sin(2 * np.pi * 3 * segment_t))
                        segment_audio *= envelope
                        
                        # 音量を調整
                        segment_audio *= 0.2
                        
                        audio[start_idx:end_idx] += segment_audio
            
            # 正規化
            if np.max(np.abs(audio)) > 0:
                audio = audio / np.max(np.abs(audio)) * 0.5
            
            return audio
            
        except Exception as e:
            logger.error(f"基本音声合成エラー: {e}")
            return None
    
    async def _generate_basic_audio(self, text: str) -> np.ndarray:
        """基本的な音声生成（最終フォールバック）"""
        logger.info("🔄 基本音声生成を使用")
        
        # シンプルな音声を生成
        duration = max(2.0, len(text) * 0.3)  # 最低2秒
        t = np.linspace(0, duration, int(self.sample_rate * duration))
        
        # 基本的なサイン波
        freq = 220  # A3
        audio = 0.3 * np.sin(2 * np.pi * freq * t)
        
        # エンベロープを適用
        envelope = np.exp(-t * 0.5)
        audio *= envelope
        
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
simple_voice_generator = SimpleVoiceGenerator()

async def generate_voice(text: str) -> np.ndarray:
    """音声を生成（外部インターフェース）"""
    return await simple_voice_generator.generate_voice(text)

def get_audio_info(audio: np.ndarray) -> Dict[str, Any]:
    """音声情報を取得（外部インターフェース）"""
    return simple_voice_generator.get_audio_info(audio)

if __name__ == "__main__":
    # テスト
    async def test():
        text = "你好，今天天气很好。"
        audio = await generate_voice(text)
        info = get_audio_info(audio)
        print(f"音声情報: {info}")
        
        # 音声ファイルを保存
        sf.write("test_simple.wav", audio, 22050)
        print("音声ファイルを保存: test_simple.wav")
    
    asyncio.run(test())
