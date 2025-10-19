#!/usr/bin/env python3
"""
音声変換システム
標準語音声を上海語方言音声に変換
"""

import torch
import torch.nn as nn
import torch.optim as optim
import librosa
import numpy as np
import soundfile as sf
from pathlib import Path
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import json

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class VoiceConversionConfig:
    """音声変換の設定"""
    sample_rate: int = 22050
    hop_length: int = 256
    n_fft: int = 1024
    n_mels: int = 80
    max_wav_value: float = 32768.0
    segment_length: int = 8192

class VoiceConverter(nn.Module):
    """音声変換ニューラルネットワーク"""
    
    def __init__(self, config: VoiceConversionConfig):
        super().__init__()
        self.config = config
        
        # エンコーダー（音声特徴量抽出）
        self.encoder = nn.Sequential(
            nn.Conv1d(1, 64, kernel_size=15, stride=1, padding=7),
            nn.ReLU(),
            nn.Conv1d(64, 128, kernel_size=15, stride=1, padding=7),
            nn.ReLU(),
            nn.Conv1d(128, 256, kernel_size=15, stride=1, padding=7),
            nn.ReLU(),
            nn.Conv1d(256, 512, kernel_size=15, stride=1, padding=7),
            nn.ReLU()
        )
        
        # 方言特徴抽出器
        self.dialect_encoder = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 64)
        )
        
        # デコーダー（方言音声生成）
        self.decoder = nn.Sequential(
            nn.ConvTranspose1d(512 + 64, 256, kernel_size=15, stride=1, padding=7),
            nn.ReLU(),
            nn.ConvTranspose1d(256, 128, kernel_size=15, stride=1, padding=7),
            nn.ReLU(),
            nn.ConvTranspose1d(128, 64, kernel_size=15, stride=1, padding=7),
            nn.ReLU(),
            nn.ConvTranspose1d(64, 1, kernel_size=15, stride=1, padding=7),
            nn.Tanh()
        )
    
    def forward(self, x, dialect_features):
        """順伝播"""
        # エンコーディング
        encoded = self.encoder(x)
        
        # 方言特徴抽出
        dialect_encoded = self.dialect_encoder(dialect_features)
        
        # 特徴量結合
        combined = torch.cat([encoded, dialect_encoded.unsqueeze(-1).expand(-1, -1, encoded.size(-1))], dim=1)
        
        # デコーディング
        output = self.decoder(combined)
        
        return output

class ShanghaiVoiceConverter:
    """上海語音声変換システム"""
    
    def __init__(self, config: VoiceConversionConfig = None):
        self.config = config or VoiceConversionConfig()
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # 音声変換モデル
        self.model = VoiceConverter(self.config).to(self.device)
        
        # 上海語特有の音韻特徴
        self.shanghai_phonetic_features = self._load_shanghai_features()
        
        # 学習済みモデルの読み込み（実際の実装では学習済みモデルを使用）
        self._load_pretrained_model()
    
    def _load_shanghai_features(self) -> Dict[str, float]:
        """上海語特有の音韻特徴を読み込み"""
        return {
            # 声調特徴
            'tone_1_to_5': 0.8,  # 陰平 → 陽平
            'tone_2_to_3': 0.7,  # 陽平 → 上声
            'tone_3_to_1': 0.6,  # 上声 → 陰平
            'tone_4_to_2': 0.9,  # 去声 → 陽平
            
            # 子音特徴
            'zh_to_z': 0.9,      # 巻舌音 → 平舌音
            'ch_to_c': 0.9,
            'sh_to_s': 0.9,
            'r_to_l': 0.8,       # 巻舌音 → 舌側音
            
            # 母音特徴
            'an_to_ang': 0.7,    # 前鼻音 → 後鼻音
            'en_to_eng': 0.7,
            'in_to_ing': 0.7,
            
            # リズム特徴
            'rhythm_trochaic': 0.8,  # 強弱格
            'tempo_slow': 0.9,       # やや遅め
            'pitch_range': 0.7       # 音高範囲
        }
    
    def _load_pretrained_model(self):
        """学習済みモデルを読み込み"""
        model_path = Path("models/shanghai_voice_converter.pth")
        if model_path.exists():
            try:
                self.model.load_state_dict(torch.load(str(model_path), map_location=self.device))
                logger.info("学習済みモデルを読み込みました")
            except Exception as e:
                logger.warning(f"モデル読み込みエラー: {e}")
        else:
            logger.info("学習済みモデルが見つかりません。初期化されたモデルを使用します。")
    
    def extract_audio_features(self, audio: np.ndarray) -> torch.Tensor:
        """音声から特徴量を抽出"""
        # メルスペクトログラムを計算
        mel_spec = librosa.feature.melspectrogram(
            y=audio,
            sr=self.config.sample_rate,
            n_mels=self.config.n_mels,
            n_fft=self.config.n_fft,
            hop_length=self.config.hop_length
        )
        
        # 対数変換
        mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
        
        # テンソルに変換
        mel_tensor = torch.FloatTensor(mel_spec).unsqueeze(0).to(self.device)
        
        return mel_tensor
    
    def generate_dialect_features(self, text: str) -> torch.Tensor:
        """テキストから方言特徴を生成"""
        # 上海語特有の語彙が含まれているかチェック
        shanghai_indicators = ['侬', '阿拉', '今朝', '蛮好', '啥', '哪能']
        shanghai_score = sum(1 for indicator in shanghai_indicators if indicator in text)
        shanghai_ratio = shanghai_score / len(shanghai_indicators)
        
        # 方言特徴ベクトルを生成
        dialect_features = torch.zeros(64).to(self.device)
        
        # 語彙特徴
        dialect_features[0] = shanghai_ratio
        
        # 音韻特徴
        for i, (feature, value) in enumerate(self.shanghai_phonetic_features.items()):
            if i + 1 < 64:
                dialect_features[i + 1] = value
        
        return dialect_features
    
    def convert_audio(self, audio: np.ndarray, text: str) -> np.ndarray:
        """音声を上海語に変換"""
        try:
            # 音声を正規化
            audio = audio / np.max(np.abs(audio))
            
            # 音声特徴量を抽出
            audio_features = self.extract_audio_features(audio)
            
            # 方言特徴を生成
            dialect_features = self.generate_dialect_features(text)
            
            # 音声変換
            self.model.eval()
            with torch.no_grad():
                # 音声をテンソルに変換
                audio_tensor = torch.FloatTensor(audio).unsqueeze(0).unsqueeze(0).to(self.device)
                
                # 変換実行
                converted_tensor = self.model(audio_tensor, dialect_features)
                
                # 音声に変換
                converted_audio = converted_tensor.squeeze().cpu().numpy()
            
            # 正規化
            converted_audio = converted_audio / np.max(np.abs(converted_audio))
            
            return converted_audio
            
        except Exception as e:
            logger.error(f"音声変換エラー: {e}")
            return audio  # エラーの場合は元の音声を返す
    
    def apply_phonetic_conversion(self, audio: np.ndarray, text: str) -> np.ndarray:
        """音韻変換を適用"""
        # 上海語特有の音韻変換ルールを適用
        converted_audio = audio.copy()
        
        # 音高変換（上海語特有の声調パターン）
        converted_audio = self._apply_tone_conversion(converted_audio)
        
        # リズム変換（強弱格パターン）
        converted_audio = self._apply_rhythm_conversion(converted_audio)
        
        # テンポ変換（やや遅め）
        converted_audio = self._apply_tempo_conversion(converted_audio)
        
        return converted_audio
    
    def _apply_tone_conversion(self, audio: np.ndarray) -> np.ndarray:
        """声調変換を適用"""
        # 簡単な音高変換（実際の実装ではより高度な方法を使用）
        # 上海語特有の声調パターンを模擬
        converted_audio = audio.copy()
        
        # 音高を少し上げる（上海語の特徴）
        converted_audio = converted_audio * 1.05
        
        return converted_audio
    
    def _apply_rhythm_conversion(self, audio: np.ndarray) -> np.ndarray:
        """リズム変換を適用"""
        # 強弱格パターンを適用
        converted_audio = audio.copy()
        
        # リズムパターンを適用（簡易実装）
        length = len(converted_audio)
        for i in range(0, length, 1024):  # 1024サンプルごと
            if i + 512 < length:
                # 強弱パターンを適用
                converted_audio[i:i+512] *= 1.1  # 強
                converted_audio[i+512:i+1024] *= 0.9  # 弱
        
        return converted_audio
    
    def _apply_tempo_conversion(self, audio: np.ndarray) -> np.ndarray:
        """テンポ変換を適用"""
        # やや遅めのテンポに変換
        converted_audio = librosa.effects.time_stretch(audio, rate=0.95)
        
        return converted_audio

def main():
    """テスト実行"""
    converter = ShanghaiVoiceConverter()
    
    # テスト音声を生成
    sample_rate = 22050
    duration = 2.0
    t = np.linspace(0, duration, int(sample_rate * duration))
    test_audio = np.sin(2 * np.pi * 440 * t)  # 440Hzのサイン波
    
    # テストテキスト
    test_text = "侬好，今朝天气蛮好"
    
    # 音声変換
    converted_audio = converter.convert_audio(test_audio, test_text)
    
    # 結果保存
    output_path = "output/shanghai_converted.wav"
    sf.write(output_path, converted_audio, sample_rate)
    logger.info(f"変換された音声を保存: {output_path}")

if __name__ == "__main__":
    main()
