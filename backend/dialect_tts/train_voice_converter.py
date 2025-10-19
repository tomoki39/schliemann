#!/usr/bin/env python3
"""
音声変換モデルの学習システム
実際の音声データから上海語の特徴を学習
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
import torchaudio
import numpy as np
import librosa
import soundfile as sf
from pathlib import Path
import logging
from typing import List, Tuple, Dict, Any
import json
from dataclasses import dataclass
from torch.utils.data import Dataset, DataLoader
import matplotlib.pyplot as plt

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AudioPair:
    """音声ペア（標準中国語と上海語）"""
    standard_audio: np.ndarray
    shanghai_audio: np.ndarray
    text: str
    duration: float

class VoiceConverterDataset(Dataset):
    """音声変換用データセット"""
    
    def __init__(self, audio_pairs: List[AudioPair], sample_rate: int = 22050):
        self.audio_pairs = audio_pairs
        self.sample_rate = sample_rate
        
    def __len__(self):
        return len(self.audio_pairs)
    
    def __getitem__(self, idx):
        pair = self.audio_pairs[idx]
        
        # 音声を正規化
        standard = pair.standard_audio / np.max(np.abs(pair.standard_audio))
        shanghai = pair.shanghai_audio / np.max(np.abs(pair.shanghai_audio))
        
        # 長さを揃える（短い方に合わせる）
        min_length = min(len(standard), len(shanghai))
        standard = standard[:min_length]
        shanghai = shanghai[:min_length]
        
        return {
            'standard': torch.FloatTensor(standard),
            'shanghai': torch.FloatTensor(shanghai),
            'text': pair.text,
            'duration': pair.duration
        }

class VoiceConverterModel(nn.Module):
    """音声変換モデル"""
    
    def __init__(self, input_dim: int = 80, hidden_dim: int = 256, output_dim: int = 80):
        super().__init__()
        
        # エンコーダー
        self.encoder = nn.Sequential(
            nn.Conv1d(input_dim, 128, 15, 3, 7),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Conv1d(128, 256, 5, 2, 2),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Conv1d(256, 512, 3, 2, 1),
            nn.BatchNorm1d(512),
            nn.ReLU(),
        )
        
        # 変換層
        self.converter = nn.Sequential(
            nn.Linear(512, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, 512),
            nn.ReLU(),
        )
        
        # デコーダー
        self.decoder = nn.Sequential(
            nn.ConvTranspose1d(512, 256, 3, 2, 1, 1),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.ConvTranspose1d(256, 128, 5, 2, 2, 1),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.ConvTranspose1d(128, output_dim, 15, 3, 7, 0),
            nn.Tanh(),
        )
        
        # 話者識別器（敵対的学習用）
        self.speaker_discriminator = nn.Sequential(
            nn.Conv1d(output_dim, 64, 15, 3, 7),
            nn.LeakyReLU(0.2),
            nn.Conv1d(64, 128, 5, 2, 2),
            nn.LeakyReLU(0.2),
            nn.Conv1d(128, 256, 3, 2, 1),
            nn.LeakyReLU(0.2),
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten(),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        # エンコード
        encoded = self.encoder(x)
        
        # 変換
        batch_size, channels, length = encoded.shape
        encoded_flat = encoded.view(batch_size, channels, -1).transpose(1, 2)
        converted_flat = self.converter(encoded_flat)
        converted = converted_flat.transpose(1, 2).view(batch_size, 512, length)
        
        # デコード
        output = self.decoder(converted)
        
        return output
    
    def discriminate_speaker(self, x):
        """話者を識別"""
        return self.speaker_discriminator(x)

class VoiceConverterTrainer:
    """音声変換モデルの学習器"""
    
    def __init__(self, model: VoiceConverterModel, device: str = "cpu"):
        self.model = model.to(device)
        self.device = device
        
        # オプティマイザー
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.0002, betas=(0.5, 0.999))
        self.discriminator_optimizer = optim.Adam(
            self.model.speaker_discriminator.parameters(), 
            lr=0.0001, betas=(0.5, 0.999)
        )
        
        # 損失関数
        self.mse_loss = nn.MSELoss()
        self.bce_loss = nn.BCELoss()
        
        # 学習履歴
        self.train_losses = []
        self.discriminator_losses = []
        
    def extract_features(self, audio: np.ndarray) -> torch.Tensor:
        """音声から特徴量を抽出"""
        # メルスペクトログラムを計算
        mel_spec = librosa.feature.melspectrogram(
            y=audio,
            sr=22050,
            n_fft=1024,
            hop_length=256,
            win_length=1024,
            n_mels=80
        )
        
        # 対数変換
        log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
        
        return torch.FloatTensor(log_mel_spec).unsqueeze(0)
    
    def train_step(self, standard_features: torch.Tensor, shanghai_features: torch.Tensor):
        """1ステップの学習"""
        standard_features = standard_features.to(self.device)
        shanghai_features = shanghai_features.to(self.device)
        
        # 生成器の学習
        self.optimizer.zero_grad()
        
        # 音声変換
        converted_features = self.model(standard_features)
        
        # 再構成損失
        recon_loss = self.mse_loss(converted_features, shanghai_features)
        
        # 敵対的損失
        fake_pred = self.model.discriminate_speaker(converted_features)
        real_labels = torch.ones_like(fake_pred)
        adv_loss = self.bce_loss(fake_pred, real_labels)
        
        # 総損失
        generator_loss = recon_loss + 0.1 * adv_loss
        
        generator_loss.backward()
        self.optimizer.step()
        
        # 識別器の学習
        self.discriminator_optimizer.zero_grad()
        
        # 本物の音声
        real_pred = self.model.discriminate_speaker(shanghai_features)
        real_labels = torch.ones_like(real_pred)
        real_loss = self.bce_loss(real_pred, real_labels)
        
        # 偽物の音声
        fake_pred = self.model.discriminate_speaker(converted_features.detach())
        fake_labels = torch.zeros_like(fake_pred)
        fake_loss = self.bce_loss(fake_pred, fake_labels)
        
        discriminator_loss = (real_loss + fake_loss) / 2
        discriminator_loss.backward()
        self.discriminator_optimizer.step()
        
        return {
            'generator_loss': generator_loss.item(),
            'discriminator_loss': discriminator_loss.item(),
            'recon_loss': recon_loss.item(),
            'adv_loss': adv_loss.item()
        }
    
    def train(self, dataloader: DataLoader, epochs: int = 100):
        """学習を実行"""
        logger.info(f"🚀 学習を開始: {epochs}エポック")
        
        for epoch in range(epochs):
            epoch_generator_loss = 0
            epoch_discriminator_loss = 0
            num_batches = 0
            
            for batch in dataloader:
                standard_audio = batch['standard']
                shanghai_audio = batch['shanghai']
                
                # 特徴量抽出
                standard_features = torch.stack([
                    self.extract_features(audio.numpy()) for audio in standard_audio
                ]).squeeze(1)
                
                shanghai_features = torch.stack([
                    self.extract_features(audio.numpy()) for audio in shanghai_audio
                ]).squeeze(1)
                
                # 学習ステップ
                losses = self.train_step(standard_features, shanghai_features)
                
                epoch_generator_loss += losses['generator_loss']
                epoch_discriminator_loss += losses['discriminator_loss']
                num_batches += 1
            
            # エポック平均損失
            avg_generator_loss = epoch_generator_loss / num_batches
            avg_discriminator_loss = epoch_discriminator_loss / num_batches
            
            self.train_losses.append(avg_generator_loss)
            self.discriminator_losses.append(avg_discriminator_loss)
            
            if (epoch + 1) % 10 == 0:
                logger.info(f"エポック {epoch+1}/{epochs}: "
                          f"Generator Loss: {avg_generator_loss:.4f}, "
                          f"Discriminator Loss: {avg_discriminator_loss:.4f}")
        
        logger.info("✅ 学習完了")
    
    def save_model(self, path: str):
        """モデルを保存"""
        model_path = Path(path)
        model_path.mkdir(parents=True, exist_ok=True)
        
        torch.save(self.model.state_dict(), model_path / "voice_converter.pth")
        
        # 学習履歴を保存
        history = {
            'train_losses': self.train_losses,
            'discriminator_losses': self.discriminator_losses
        }
        
        with open(model_path / "training_history.json", 'w') as f:
            json.dump(history, f, indent=2)
        
        logger.info(f"✅ モデルを保存: {model_path}")
    
    def plot_training_history(self, save_path: str = "training_history.png"):
        """学習履歴をプロット"""
        plt.figure(figsize=(12, 4))
        
        plt.subplot(1, 2, 1)
        plt.plot(self.train_losses, label='Generator Loss')
        plt.plot(self.discriminator_losses, label='Discriminator Loss')
        plt.xlabel('Epoch')
        plt.ylabel('Loss')
        plt.legend()
        plt.title('Training Losses')
        
        plt.subplot(1, 2, 2)
        plt.plot(self.train_losses, label='Generator Loss')
        plt.xlabel('Epoch')
        plt.ylabel('Loss')
        plt.legend()
        plt.title('Generator Loss Detail')
        
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()
        
        logger.info(f"✅ 学習履歴を保存: {save_path}")

def create_dummy_dataset() -> List[AudioPair]:
    """ダミーデータセットを作成"""
    logger.info("📚 ダミーデータセットを作成中...")
    
    audio_pairs = []
    
    # テスト用の音声ペアを生成
    test_texts = [
        "你好，今天天气很好。",
        "我们一起去吃饭吧。",
        "谢谢你的帮助。",
        "再见，明天见。",
        "学习上海话很有趣。"
    ]
    
    for i, text in enumerate(test_texts):
        # ダミーの標準中国語音声
        duration = 2.0
        sample_rate = 22050
        samples = int(duration * sample_rate)
        
        t = np.linspace(0, duration, samples)
        standard_audio = np.sin(2 * np.pi * 200 * t) * 0.5  # 200Hz
        
        # ダミーの上海語音声（少し異なる周波数）
        shanghai_audio = np.sin(2 * np.pi * 180 * t) * 0.6  # 180Hz
        
        # ノイズを追加してより現実的に
        standard_audio += np.random.normal(0, 0.1, samples)
        shanghai_audio += np.random.normal(0, 0.1, samples)
        
        pair = AudioPair(
            standard_audio=standard_audio,
            shanghai_audio=shanghai_audio,
            text=text,
            duration=duration
        )
        
        audio_pairs.append(pair)
    
    logger.info(f"✅ ダミーデータセット作成完了: {len(audio_pairs)}件")
    return audio_pairs

def main():
    """メイン関数"""
    logger.info("🚀 AI音声変換学習システムを開始")
    
    # デバイス設定
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"使用デバイス: {device}")
    
    # ダミーデータセットを作成
    audio_pairs = create_dummy_dataset()
    
    # データセットとデータローダーを作成
    dataset = VoiceConverterDataset(audio_pairs)
    dataloader = DataLoader(dataset, batch_size=2, shuffle=True)
    
    # モデルを作成
    model = VoiceConverterModel()
    
    # 学習器を作成
    trainer = VoiceConverterTrainer(model, device)
    
    # 学習を実行
    trainer.train(dataloader, epochs=50)
    
    # モデルを保存
    trainer.save_model("models/voice_converter_trained")
    
    # 学習履歴をプロット
    trainer.plot_training_history("training_history.png")
    
    logger.info("🎉 AI音声変換学習完了")

if __name__ == "__main__":
    main()
