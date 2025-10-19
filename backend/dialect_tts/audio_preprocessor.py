#!/usr/bin/env python3
"""
音声前処理・品質向上システム
収集した音声データを高品質に前処理し、方言特徴を抽出
"""

import os
import numpy as np
import librosa
import soundfile as sf
import noisereduce as nr
from scipy import signal
from scipy.signal import butter, filtfilt
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import json

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ProcessedAudio:
    """前処理済み音声データ"""
    file_path: str
    original_path: str
    duration: float
    sample_rate: int
    quality_score: float
    phonetic_features: Dict
    dialect_features: Dict
    speaker_embedding: np.ndarray

class AudioPreprocessor:
    """音声前処理器"""
    
    def __init__(self, output_dir: str = "processed_audio"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # 音声品質パラメータ
        self.target_sample_rate = 22050
        self.min_duration = 1.0  # 最小1秒
        self.max_duration = 30.0  # 最大30秒
        self.min_quality_score = 0.4
        
    def process_audio_collection(self, metadata_file: str) -> List[ProcessedAudio]:
        """音声コレクション全体を前処理"""
        logger.info("🎵 音声コレクションの前処理を開始")
        
        # メタデータを読み込み
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        processed_audio_list = []
        
        for i, audio_meta in enumerate(metadata):
            logger.info(f"🔄 処理中 ({i+1}/{len(metadata)}): {audio_meta['file_path']}")
            
            try:
                # 音声ファイルを前処理
                processed_audio = self.process_single_audio(audio_meta)
                
                if processed_audio:
                    processed_audio_list.append(processed_audio)
                    logger.info(f"✅ 処理完了: {processed_audio.file_path}")
                else:
                    logger.warning(f"⚠️ 処理スキップ: {audio_meta['file_path']}")
                    
            except Exception as e:
                logger.error(f"❌ 処理エラー: {e}")
                continue
        
        logger.info(f"🎉 前処理完了: {len(processed_audio_list)}件")
        return processed_audio_list
    
    def process_single_audio(self, audio_meta: Dict) -> Optional[ProcessedAudio]:
        """単一音声ファイルを前処理"""
        try:
            # 音声ファイルを読み込み
            audio, sample_rate = librosa.load(audio_meta['file_path'], sr=None)
            
            # 基本チェック
            if len(audio) == 0:
                return None
            
            duration = len(audio) / sample_rate
            if duration < self.min_duration or duration > self.max_duration:
                logger.warning(f"⚠️ 長さが不適切: {duration:.1f}s")
                return None
            
            # 音声品質を評価
            quality_score = self.evaluate_audio_quality(audio, sample_rate)
            if quality_score < self.min_quality_score:
                logger.warning(f"⚠️ 品質が低い: {quality_score:.2f}")
                return None
            
            # 音声前処理パイプライン
            processed_audio = self.apply_preprocessing_pipeline(
                audio, sample_rate, audio_meta
            )
            
            if processed_audio is None:
                return None
            
            # 音韻特徴を抽出
            phonetic_features = self.extract_phonetic_features(processed_audio)
            
            # 方言特徴を抽出
            dialect_features = self.extract_dialect_features(processed_audio)
            
            # 話者埋め込みを生成
            speaker_embedding = self.extract_speaker_embedding(processed_audio)
            
            # 最終ファイルを保存
            output_file = self.save_processed_audio(processed_audio, audio_meta)
            
            return ProcessedAudio(
                file_path=output_file,
                original_path=audio_meta['file_path'],
                duration=len(processed_audio) / self.target_sample_rate,
                sample_rate=self.target_sample_rate,
                quality_score=quality_score,
                phonetic_features=phonetic_features,
                dialect_features=dialect_features,
                speaker_embedding=speaker_embedding
            )
            
        except Exception as e:
            logger.error(f"❌ 単一音声処理エラー: {e}")
            return None
    
    def apply_preprocessing_pipeline(self, audio: np.ndarray, sample_rate: int, metadata: Dict) -> Optional[np.ndarray]:
        """音声前処理パイプラインを適用"""
        try:
            # 1. サンプリングレートを統一
            if sample_rate != self.target_sample_rate:
                audio = librosa.resample(audio, orig_sr=sample_rate, target_sr=self.target_sample_rate)
            
            # 2. ノイズ除去
            audio = self.reduce_noise(audio)
            
            # 3. 音量正規化
            audio = self.normalize_volume(audio)
            
            # 4. 高周波ノイズ除去
            audio = self.remove_high_frequency_noise(audio)
            
            # 5. 音声の切り出し（無音部分を除去）
            audio = self.trim_silence(audio)
            
            # 6. 最終品質チェック
            if len(audio) == 0:
                return None
            
            return audio
            
        except Exception as e:
            logger.error(f"❌ 前処理パイプラインエラー: {e}")
            return None
    
    def reduce_noise(self, audio: np.ndarray) -> np.ndarray:
        """ノイズ除去"""
        try:
            # noisereduceライブラリを使用
            reduced_noise = nr.reduce_noise(y=audio, sr=self.target_sample_rate)
            return reduced_noise
        except Exception as e:
            logger.warning(f"⚠️ ノイズ除去エラー: {e}")
            return audio
    
    def normalize_volume(self, audio: np.ndarray) -> np.ndarray:
        """音量正規化"""
        try:
            # RMS正規化
            rms = np.sqrt(np.mean(audio**2))
            if rms > 0:
                audio = audio / rms * 0.1  # 適切な音量レベルに調整
            return audio
        except Exception as e:
            logger.warning(f"⚠️ 音量正規化エラー: {e}")
            return audio
    
    def remove_high_frequency_noise(self, audio: np.ndarray) -> np.ndarray:
        """高周波ノイズ除去"""
        try:
            # バターワースローパスフィルタ
            nyquist = self.target_sample_rate / 2
            cutoff = 8000  # 8kHz以下を保持
            normal_cutoff = cutoff / nyquist
            b, a = butter(4, normal_cutoff, btype='low', analog=False)
            filtered_audio = filtfilt(b, a, audio)
            return filtered_audio
        except Exception as e:
            logger.warning(f"⚠️ 高周波ノイズ除去エラー: {e}")
            return audio
    
    def trim_silence(self, audio: np.ndarray, threshold: float = 0.01) -> np.ndarray:
        """無音部分を除去"""
        try:
            # 無音部分を検出
            frame_length = int(0.025 * self.target_sample_rate)  # 25ms
            hop_length = int(0.010 * self.target_sample_rate)    # 10ms
            
            # エネルギーベースで無音を検出
            energy = librosa.feature.rms(y=audio, frame_length=frame_length, hop_length=hop_length)[0]
            
            # 閾値以下の部分を無音として検出
            silence_frames = energy < threshold
            
            # 無音部分を除去
            if not silence_frames.all():
                # 最初と最後の無音部分を除去
                start_frame = 0
                end_frame = len(silence_frames)
                
                for i, is_silent in enumerate(silence_frames):
                    if not is_silent:
                        start_frame = i
                        break
                
                for i in range(len(silence_frames) - 1, -1, -1):
                    if not silence_frames[i]:
                        end_frame = i + 1
                        break
                
                # フレームをサンプルに変換
                start_sample = start_frame * hop_length
                end_sample = end_frame * hop_length
                
                # 音声を切り出し
                trimmed_audio = audio[start_sample:end_sample]
                
                return trimmed_audio
            else:
                return audio
                
        except Exception as e:
            logger.warning(f"⚠️ 無音除去エラー: {e}")
            return audio
    
    def evaluate_audio_quality(self, audio: np.ndarray, sample_rate: int) -> float:
        """音声品質を評価"""
        try:
            # 1. 信号対雑音比
            signal_power = np.mean(audio ** 2)
            noise_power = np.var(audio - np.mean(audio))
            snr = 10 * np.log10(signal_power / (noise_power + 1e-10))
            
            # 2. 周波数特性
            freqs = np.fft.fftfreq(len(audio), 1/sample_rate)
            fft = np.abs(np.fft.fft(audio))
            
            # 人間の音声周波数範囲（80Hz-8000Hz）でのエネルギー
            voice_freq_mask = (freqs >= 80) & (freqs <= 8000)
            voice_energy = np.sum(fft[voice_freq_mask])
            total_energy = np.sum(fft)
            voice_ratio = voice_energy / (total_energy + 1e-10)
            
            # 3. 動的範囲
            dynamic_range = 20 * np.log10(np.max(np.abs(audio)) / (np.mean(np.abs(audio)) + 1e-10))
            
            # 品質スコアを計算
            snr_score = min(1.0, max(0.0, (snr + 10) / 40))  # -10dB to 30dB
            voice_score = min(1.0, voice_ratio * 2)  # 音声周波数範囲の比率
            dynamic_score = min(1.0, max(0.0, dynamic_range / 40))  # 動的範囲
            
            quality_score = (snr_score + voice_score + dynamic_score) / 3
            
            return quality_score
            
        except Exception as e:
            logger.warning(f"⚠️ 品質評価エラー: {e}")
            return 0.5
    
    def extract_phonetic_features(self, audio: np.ndarray) -> Dict:
        """音韻特徴を抽出"""
        try:
            # 1. 基本音響特徴
            mfcc = librosa.feature.mfcc(y=audio, sr=self.target_sample_rate, n_mfcc=13)
            spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=self.target_sample_rate)
            spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=self.target_sample_rate)
            zero_crossing_rate = librosa.feature.zero_crossing_rate(audio)
            
            # 2. ピッチ特徴
            pitches, magnitudes = librosa.piptrack(y=audio, sr=self.target_sample_rate)
            pitch_values = pitches[pitches > 0]
            
            # 3. リズム特徴
            tempo, beats = librosa.beat.beat_track(y=audio, sr=self.target_sample_rate)
            
            return {
                'mfcc_mean': np.mean(mfcc, axis=1).tolist(),
                'mfcc_std': np.std(mfcc, axis=1).tolist(),
                'spectral_centroid_mean': float(np.mean(spectral_centroid)),
                'spectral_rolloff_mean': float(np.mean(spectral_rolloff)),
                'zero_crossing_rate_mean': float(np.mean(zero_crossing_rate)),
                'pitch_mean': float(np.mean(pitch_values)) if len(pitch_values) > 0 else 0.0,
                'pitch_std': float(np.std(pitch_values)) if len(pitch_values) > 0 else 0.0,
                'tempo': float(tempo),
                'beat_count': len(beats)
            }
            
        except Exception as e:
            logger.warning(f"⚠️ 音韻特徴抽出エラー: {e}")
            return {}
    
    def extract_dialect_features(self, audio: np.ndarray) -> Dict:
        """方言特徴を抽出"""
        try:
            # 1. 音調パターン
            pitches, magnitudes = librosa.piptrack(y=audio, sr=self.target_sample_rate)
            pitch_values = pitches[pitches > 0]
            
            # 音調の変化パターン
            if len(pitch_values) > 1:
                pitch_changes = np.diff(pitch_values)
                pitch_variation = np.std(pitch_changes)
            else:
                pitch_variation = 0.0
            
            # 2. リズム特徴
            tempo, beats = librosa.beat.beat_track(y=audio, sr=self.target_sample_rate)
            
            # 3. 音色特徴
            spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=self.target_sample_rate)
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=audio, sr=self.target_sample_rate)
            
            return {
                'pitch_variation': float(pitch_variation),
                'tempo': float(tempo),
                'spectral_centroid_mean': float(np.mean(spectral_centroid)),
                'spectral_bandwidth_mean': float(np.mean(spectral_bandwidth)),
                'rhythm_regularity': float(np.std(beats)) if len(beats) > 1 else 0.0
            }
            
        except Exception as e:
            logger.warning(f"⚠️ 方言特徴抽出エラー: {e}")
            return {}
    
    def extract_speaker_embedding(self, audio: np.ndarray) -> np.ndarray:
        """話者埋め込みを抽出"""
        try:
            # 簡易的な話者埋め込み（実際の実装では、より高度なモデルを使用）
            mfcc = librosa.feature.mfcc(y=audio, sr=self.target_sample_rate, n_mfcc=13)
            
            # MFCCの統計的特徴を話者埋め込みとして使用
            embedding = np.concatenate([
                np.mean(mfcc, axis=1),  # 平均
                np.std(mfcc, axis=1),   # 標準偏差
                np.median(mfcc, axis=1) # 中央値
            ])
            
            # 正規化
            embedding = embedding / (np.linalg.norm(embedding) + 1e-10)
            
            return embedding
            
        except Exception as e:
            logger.warning(f"⚠️ 話者埋め込み抽出エラー: {e}")
            return np.zeros(39)  # デフォルト埋め込み
    
    def save_processed_audio(self, audio: np.ndarray, metadata: Dict) -> str:
        """前処理済み音声を保存"""
        try:
            # ファイル名を生成
            original_name = Path(metadata['file_path']).stem
            output_file = self.output_dir / f"processed_{original_name}.wav"
            
            # 音声を保存
            sf.write(str(output_file), audio, self.target_sample_rate)
            
            return str(output_file)
            
        except Exception as e:
            logger.error(f"❌ 音声保存エラー: {e}")
            return ""
    
    def save_processed_metadata(self, processed_audio_list: List[ProcessedAudio]):
        """前処理済みメタデータを保存"""
        try:
            metadata_file = self.output_dir / "processed_metadata.json"
            
            metadata = []
            for audio in processed_audio_list:
                metadata.append({
                    'file_path': audio.file_path,
                    'original_path': audio.original_path,
                    'duration': audio.duration,
                    'sample_rate': audio.sample_rate,
                    'quality_score': audio.quality_score,
                    'phonetic_features': audio.phonetic_features,
                    'dialect_features': audio.dialect_features,
                    'speaker_embedding': audio.speaker_embedding.tolist()
                })
            
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            
            logger.info(f"💾 前処理済みメタデータを保存: {metadata_file}")
            
        except Exception as e:
            logger.error(f"❌ メタデータ保存エラー: {e}")

def main():
    """メイン実行関数"""
    logger.info("🎵 音声前処理システムを開始")
    
    # 前処理器を初期化
    preprocessor = AudioPreprocessor()
    
    # メタデータファイルのパス
    metadata_file = "shanghai_audio_data/collected_metadata.json"
    
    if not os.path.exists(metadata_file):
        logger.error(f"❌ メタデータファイルが見つかりません: {metadata_file}")
        return
    
    # 音声コレクションを前処理
    processed_audio_list = preprocessor.process_audio_collection(metadata_file)
    
    # 前処理済みメタデータを保存
    preprocessor.save_processed_metadata(processed_audio_list)
    
    logger.info(f"🎉 前処理完了: {len(processed_audio_list)}件")
    
    # 統計情報を表示
    if processed_audio_list:
        total_duration = sum(audio.duration for audio in processed_audio_list)
        avg_quality = sum(audio.quality_score for audio in processed_audio_list) / len(processed_audio_list)
        
        logger.info(f"📊 統計情報:")
        logger.info(f"  - 総時間: {total_duration/3600:.1f}時間")
        logger.info(f"  - 平均品質スコア: {avg_quality:.2f}")
        logger.info(f"  - 話者数: {len(set(audio.speaker_embedding.tobytes() for audio in processed_audio_list))}")

if __name__ == "__main__":
    main()