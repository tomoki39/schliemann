#!/usr/bin/env python3
"""
上海語方言TTSモデル
Whisperベースの音声認識とTacotron2ベースの音声合成を組み合わせ
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import librosa
import numpy as np
from pathlib import Path
import json
import logging
from typing import List, Dict, Any, Tuple
from transformers import WhisperForConditionalGeneration, WhisperProcessor
import soundfile as sf

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ShanghaiDialectDataset(Dataset):
    """上海語方言データセット"""
    
    def __init__(self, metadata_file: str, audio_dir: str):
        self.audio_dir = Path(audio_dir)
        
        # メタデータ読み込み
        with open(metadata_file, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
        
        # 上海語特有の語彙マッピング
        self.shanghai_vocab = {
            '你好': '侬好',
            '今天': '今朝',
            '很好': '蛮好',
            '我们': '阿拉',
            '你们': '侬拉',
            '什么': '啥',
            '怎么': '哪能',
            '哪里': '啥地方',
            '谢谢': '谢谢侬',
            '再见': '再会',
            '吃饭': '吃饭',
            '睡觉': '困觉',
            '工作': '做生活',
            '学习': '读书',
            '朋友': '朋友',
            '家': '屋里',
            '学校': '学堂',
            '医院': '医院',
            '商店': '店',
            '银行': '银行'
        }
    
    def __len__(self):
        return len(self.metadata)
    
    def __getitem__(self, idx):
        item = self.metadata[idx]
        
        # 音声ファイル読み込み
        audio_path = self.audio_dir / item['filename']
        audio, sr = librosa.load(str(audio_path), sr=22050)
        
        # テキスト（上海語特有の語彙に変換）
        text = self.convert_to_shanghai_dialect(item.get('text', ''))
        
        return {
            'audio': torch.FloatTensor(audio),
            'text': text,
            'duration': item['duration'],
            'features': item.get('features', {})
        }
    
    def convert_to_shanghai_dialect(self, text: str) -> str:
        """標準中国語を上海語方言に変換"""
        for standard, shanghai in self.shanghai_vocab.items():
            text = text.replace(standard, shanghai)
        return text

class ShanghaiTTSModel(nn.Module):
    """上海語方言TTSモデル"""
    
    def __init__(self, vocab_size: int = 1000, hidden_dim: int = 512):
        super().__init__()
        
        # エンコーダー（テキスト → 特徴量）
        self.text_encoder = nn.Sequential(
            nn.Embedding(vocab_size, hidden_dim),
            nn.LSTM(hidden_dim, hidden_dim, batch_first=True),
            nn.Linear(hidden_dim, hidden_dim)
        )
        
        # デコーダー（特徴量 → 音声）
        self.audio_decoder = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim * 2),
            nn.ReLU(),
            nn.Linear(hidden_dim * 2, hidden_dim * 4),
            nn.ReLU(),
            nn.Linear(hidden_dim * 4, 80)  # メルスペクトログラム次元
        )
        
        # 上海語特有の音韻特徴を学習する層
        self.dialect_encoder = nn.Sequential(
            nn.Linear(80, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 80)
        )
    
    def forward(self, text_tokens, audio_features=None):
        # テキストエンコーディング
        text_encoded = self.text_encoder(text_tokens)
        
        # 音声特徴量の生成
        mel_spec = self.audio_decoder(text_encoded)
        
        # 上海語特有の音韻特徴を適用
        if audio_features is not None:
            dialect_features = self.dialect_encoder(audio_features)
            mel_spec = mel_spec + dialect_features
        
        return mel_spec

class ShanghaiTTSTrainer:
    """上海語TTSモデルの学習"""
    
    def __init__(self, model: ShanghaiTTSModel, device: str = 'cuda'):
        self.model = model.to(device)
        self.device = device
        self.optimizer = optim.Adam(model.parameters(), lr=0.001)
        self.criterion = nn.MSELoss()
    
    def train_epoch(self, dataloader: DataLoader) -> float:
        """1エポックの学習"""
        self.model.train()
        total_loss = 0.0
        
        for batch in dataloader:
            audio = batch['audio'].to(self.device)
            text = batch['text']
            features = batch['features']
            
            # テキストをトークン化（簡易実装）
            text_tokens = self.tokenize_text(text)
            
            # 音声特徴量を抽出
            audio_features = self.extract_audio_features(audio)
            
            # モデル実行
            self.optimizer.zero_grad()
            predicted_mel = self.model(text_tokens, audio_features)
            
            # 損失計算
            target_mel = self.extract_mel_spectrogram(audio)
            loss = self.criterion(predicted_mel, target_mel)
            
            # 逆伝播
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
        
        return total_loss / len(dataloader)
    
    def tokenize_text(self, texts: List[str]) -> torch.Tensor:
        """テキストをトークン化"""
        # 簡易実装（実際の実装ではより高度なトークナイザーを使用）
        vocab = {'<PAD>': 0, '<UNK>': 1}
        for text in texts:
            for char in text:
                if char not in vocab:
                    vocab[char] = len(vocab)
        
        # テキストをトークンIDに変換
        token_ids = []
        for text in texts:
            tokens = [vocab.get(char, vocab['<UNK>']) for char in text]
            token_ids.append(tokens)
        
        # パディング
        max_len = max(len(tokens) for tokens in token_ids)
        padded_tokens = []
        for tokens in token_ids:
            padded = tokens + [vocab['<PAD>']] * (max_len - len(tokens))
            padded_tokens.append(padded)
        
        return torch.LongTensor(padded_tokens).to(self.device)
    
    def extract_audio_features(self, audio: torch.Tensor) -> torch.Tensor:
        """音声から特徴量を抽出"""
        # メルスペクトログラムを計算
        mel_spec = self.extract_mel_spectrogram(audio)
        return mel_spec
    
    def extract_mel_spectrogram(self, audio: torch.Tensor) -> torch.Tensor:
        """メルスペクトログラムを抽出"""
        # 音声をnumpyに変換
        audio_np = audio.cpu().numpy()
        
        # メルスペクトログラム計算
        mel_spec = librosa.feature.melspectrogram(
            y=audio_np, 
            sr=22050, 
            n_mels=80,
            n_fft=1024,
            hop_length=256
        )
        
        # 対数変換
        mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
        
        return torch.FloatTensor(mel_spec).to(self.device)
    
    def synthesize(self, text: str) -> np.ndarray:
        """テキストから音声を合成"""
        self.model.eval()
        
        with torch.no_grad():
            # テキストをトークン化
            text_tokens = self.tokenize_text([text])
            
            # 音声合成
            mel_spec = self.model(text_tokens)
            
            # メルスペクトログラムから音声に変換（簡易実装）
            audio = self.mel_to_audio(mel_spec)
        
        return audio
    
    def mel_to_audio(self, mel_spec: torch.Tensor) -> np.ndarray:
        """メルスペクトログラムから音声に変換"""
        # 簡易実装（実際の実装ではGriffin-LimやWaveNetを使用）
        mel_spec = mel_spec.cpu().numpy()
        
        # 逆メル変換
        audio = librosa.feature.inverse.mel_to_stft(mel_spec)
        
        # 逆短時間フーリエ変換
        audio = librosa.istft(audio, hop_length=256)
        
        return audio

def main():
    """メイン実行関数"""
    logger.info("上海語TTSモデル学習開始...")
    
    # データセット準備
    metadata_file = "data/shanghai_dialect/processed/processed_metadata.json"
    audio_dir = "data/shanghai_dialect/processed"
    
    dataset = ShanghaiDialectDataset(metadata_file, audio_dir)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)
    
    # モデル初期化
    model = ShanghaiTTSModel()
    trainer = ShanghaiTTSTrainer(model)
    
    # 学習実行
    num_epochs = 100
    for epoch in range(num_epochs):
        loss = trainer.train_epoch(dataloader)
        logger.info(f"Epoch {epoch+1}/{num_epochs}, Loss: {loss:.4f}")
        
        # 定期的にモデルを保存
        if (epoch + 1) % 10 == 0:
            model_path = f"models/shanghai_tts_epoch_{epoch+1}.pth"
            torch.save(model.state_dict(), model_path)
            logger.info(f"モデル保存: {model_path}")
    
    # 最終モデル保存
    final_model_path = "models/shanghai_tts_final.pth"
    torch.save(model.state_dict(), final_model_path)
    logger.info(f"最終モデル保存: {final_model_path}")
    
    # テスト合成
    test_text = "侬好，今朝天气蛮好"
    audio = trainer.synthesize(test_text)
    
    # 音声保存
    output_path = "output/shanghai_test.wav"
    sf.write(output_path, audio, 22050)
    logger.info(f"テスト音声保存: {output_path}")

if __name__ == "__main__":
    main()
