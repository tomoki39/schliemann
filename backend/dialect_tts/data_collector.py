#!/usr/bin/env python3
"""
上海語音声データ収集システム
YouTube、ポッドキャスト、学術データベースから上海語の音声データを収集
"""

import os
import yt_dlp
import requests
import json
import time
import logging
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass
import whisper
from pydub import AudioSegment
import librosa
import soundfile as sf
import numpy as np

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AudioData:
    """音声データのメタデータ"""
    file_path: str
    duration: float
    sample_rate: int
    text: str
    speaker_id: str
    quality_score: float
    source: str
    dialect_region: str

class ShanghaiDialectCollector:
    """上海語方言データ収集器"""
    
    def __init__(self, output_dir: str = "shanghai_audio_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # 音声認識モデル（Whisper）
        self.whisper_model = whisper.load_model("base")
        
        # 収集済みデータの管理
        self.collected_data = []
        self.load_existing_data()
    
    def collect_youtube_data(self, search_queries: List[str], max_duration_hours: float = 10.0) -> List[AudioData]:
        """YouTubeから上海語音声データを収集"""
        logger.info("🎬 YouTubeから上海語音声データを収集中...")
        
        collected_data = []
        total_duration = 0.0
        
        for query in search_queries:
            if total_duration >= max_duration_hours * 3600:
                break
                
            logger.info(f"🔍 検索クエリ: {query}")
            
            # YouTube検索設定
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': str(self.output_dir / 'youtube' / '%(title)s.%(ext)s'),
                'extractaudio': True,
                'audioformat': 'wav',
                'audioquality': '0',  # 最高品質
                'noplaylist': True,
                'max_downloads': 20,  # クエリあたり最大20動画
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': ['zh', 'zh-CN', 'zh-TW'],
            }
            
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    # 検索結果を取得
                    search_results = ydl.extract_info(
                        f"ytsearch20:{query}",
                        download=False
                    )
                    
                    if not search_results or 'entries' not in search_results:
                        continue
                    
                    for entry in search_results['entries']:
                        if total_duration >= max_duration_hours * 3600:
                            break
                            
                        if not entry:
                            continue
                            
                        try:
                            # 動画情報を取得
                            video_info = ydl.extract_info(entry['url'], download=False)
                            
                            # 上海語の可能性をチェック
                            if self.is_likely_shanghai_content(video_info):
                                # 音声をダウンロード
                                audio_data = self.download_and_process_video(entry['url'], video_info)
                                if audio_data:
                                    collected_data.append(audio_data)
                                    total_duration += audio_data.duration
                                    logger.info(f"✅ 収集完了: {audio_data.file_path} ({audio_data.duration:.1f}s)")
                                    
                        except Exception as e:
                            logger.warning(f"⚠️ 動画処理エラー: {e}")
                            continue
                            
            except Exception as e:
                logger.error(f"❌ 検索エラー ({query}): {e}")
                continue
        
        logger.info(f"🎉 YouTube収集完了: {len(collected_data)}件, 合計{total_duration/3600:.1f}時間")
        return collected_data
    
    def is_likely_shanghai_content(self, video_info: Dict) -> bool:
        """動画が上海語コンテンツの可能性を判定"""
        title = video_info.get('title', '').lower()
        description = video_info.get('description', '').lower()
        
        # 上海語関連キーワード
        shanghai_keywords = [
            '上海话', '上海語', 'shanghai dialect', 'shanghainese',
            '沪语', '沪上', '上海人', '上海话教学',
            '上海方言', '上海话教程', '上海话学习'
        ]
        
        # タイトルまたは説明に上海語キーワードが含まれているかチェック
        text_to_check = f"{title} {description}"
        return any(keyword in text_to_check for keyword in shanghai_keywords)
    
    def download_and_process_video(self, url: str, video_info: Dict) -> Optional[AudioData]:
        """動画をダウンロードして音声データとして処理"""
        try:
            # 一時ファイル名
            temp_file = self.output_dir / 'temp' / f"temp_{int(time.time())}.wav"
            temp_file.parent.mkdir(exist_ok=True)
            
            # 音声ダウンロード設定
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': str(temp_file),
                'extractaudio': True,
                'audioformat': 'wav',
                'audioquality': '0',
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            
            if not temp_file.exists():
                return None
            
            # 音声ファイルを処理
            audio_data = self.process_audio_file(
                str(temp_file),
                video_info.get('title', 'Unknown'),
                'youtube'
            )
            
            # 一時ファイルを削除
            temp_file.unlink()
            
            return audio_data
            
        except Exception as e:
            logger.error(f"❌ 動画ダウンロードエラー: {e}")
            return None
    
    def process_audio_file(self, file_path: str, title: str, source: str) -> Optional[AudioData]:
        """音声ファイルを処理してメタデータを生成"""
        try:
            # 音声ファイルを読み込み
            audio, sample_rate = librosa.load(file_path, sr=None)
            duration = len(audio) / sample_rate
            
            # 音声品質を評価
            quality_score = self.evaluate_audio_quality(audio, sample_rate)
            
            # 品質が低い場合はスキップ
            if quality_score < 0.3:
                logger.warning(f"⚠️ 音声品質が低いためスキップ: {file_path}")
                return None
            
            # Whisperで音声認識
            result = self.whisper_model.transcribe(file_path, language='zh')
            text = result['text'].strip()
            
            # 上海語の可能性をチェック
            if not self.is_likely_shanghai_text(text):
                logger.warning(f"⚠️ 上海語ではない可能性: {file_path}")
                return None
            
            # 最終ファイル名を生成
            final_file = self.output_dir / 'processed' / f"shanghai_{int(time.time())}.wav"
            final_file.parent.mkdir(exist_ok=True)
            
            # 音声を正規化して保存
            normalized_audio = librosa.util.normalize(audio)
            sf.write(str(final_file), normalized_audio, sample_rate)
            
            # メタデータを生成
            audio_data = AudioData(
                file_path=str(final_file),
                duration=duration,
                sample_rate=sample_rate,
                text=text,
                speaker_id=f"speaker_{hash(title) % 10000}",
                quality_score=quality_score,
                source=source,
                dialect_region="shanghai"
            )
            
            return audio_data
            
        except Exception as e:
            logger.error(f"❌ 音声処理エラー: {e}")
            return None
    
    def evaluate_audio_quality(self, audio: np.ndarray, sample_rate: int) -> float:
        """音声品質を評価（0-1のスコア）"""
        try:
            # ノイズレベルを評価
            noise_level = np.std(audio)
            
            # 信号対雑音比を計算
            signal_power = np.mean(audio ** 2)
            noise_power = np.var(audio)
            snr = 10 * np.log10(signal_power / (noise_power + 1e-10))
            
            # 品質スコアを計算（SNRベース）
            quality_score = min(1.0, max(0.0, (snr + 10) / 40))  # -10dB to 30dB
            
            return quality_score
            
        except Exception as e:
            logger.warning(f"⚠️ 品質評価エラー: {e}")
            return 0.5  # デフォルト値
    
    def is_likely_shanghai_text(self, text: str) -> bool:
        """テキストが上海語の可能性を判定"""
        # 上海語の特徴的な語彙
        shanghai_indicators = [
            '侬', '阿拉', '伊拉', '今朝', '明朝', '昨日子',
            '蛮好', '再会', '啥', '哪能', '啥地方', '谢谢侬',
            '做生活', '困觉', '屋里', '学堂', '搿搭', '伊搭'
        ]
        
        # 上海語の語彙が含まれているかチェック
        text_lower = text.lower()
        shanghai_count = sum(1 for indicator in shanghai_indicators if indicator in text_lower)
        
        # 上海語の語彙が2つ以上含まれている場合は上海語と判定
        return shanghai_count >= 2
    
    def collect_academic_data(self) -> List[AudioData]:
        """学術データベースから上海語音声データを収集"""
        logger.info("📚 学術データベースから上海語音声データを収集中...")
        
        # 学術データベースのURL（例）
        academic_sources = [
            "https://example-academic-db.com/shanghai-dialect",
            # 実際の学術データベースURLを追加
        ]
        
        collected_data = []
        
        for source_url in academic_sources:
            try:
                # 学術データベースからデータを取得
                response = requests.get(source_url, timeout=30)
                if response.status_code == 200:
                    # データを処理（実際の実装では、APIの仕様に合わせて調整）
                    logger.info(f"✅ 学術データベースからデータを取得: {source_url}")
                    # ここで実際のデータ処理を実装
                    
            except Exception as e:
                logger.warning(f"⚠️ 学術データベースアクセスエラー: {e}")
                continue
        
        return collected_data
    
    def save_collected_data(self, audio_data_list: List[AudioData]):
        """収集したデータを保存"""
        metadata_file = self.output_dir / "collected_metadata.json"
        
        # メタデータをJSON形式で保存
        metadata = []
        for data in audio_data_list:
            metadata.append({
                'file_path': data.file_path,
                'duration': data.duration,
                'sample_rate': data.sample_rate,
                'text': data.text,
                'speaker_id': data.speaker_id,
                'quality_score': data.quality_score,
                'source': data.source,
                'dialect_region': data.dialect_region
            })
        
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 メタデータを保存: {metadata_file}")
    
    def load_existing_data(self):
        """既存の収集データを読み込み"""
        metadata_file = self.output_dir / "collected_metadata.json"
        
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                
                for data_dict in metadata:
                    self.collected_data.append(AudioData(**data_dict))
                
                logger.info(f"📂 既存データを読み込み: {len(self.collected_data)}件")
                
            except Exception as e:
                logger.warning(f"⚠️ 既存データ読み込みエラー: {e}")

def main():
    """メイン実行関数"""
    logger.info("🚀 上海語方言データ収集システムを開始")
    
    # 収集器を初期化
    collector = ShanghaiDialectCollector()
    
    # 検索クエリを定義
    search_queries = [
        "上海话教学",
        "上海话教程",
        "上海方言",
        "上海话学习",
        "沪语教学",
        "上海话对话",
        "上海话日常用语",
        "上海话发音",
        "上海话词汇",
        "上海话语法"
    ]
    
    # YouTubeからデータを収集
    youtube_data = collector.collect_youtube_data(search_queries, max_duration_hours=5.0)
    
    # 学術データベースからデータを収集
    academic_data = collector.collect_academic_data()
    
    # 全データを統合
    all_data = youtube_data + academic_data
    
    # データを保存
    collector.save_collected_data(all_data)
    
    logger.info(f"🎉 データ収集完了: 合計{len(all_data)}件")
    
    # 統計情報を表示
    total_duration = sum(data.duration for data in all_data)
    avg_quality = sum(data.quality_score for data in all_data) / len(all_data) if all_data else 0
    
    logger.info(f"📊 統計情報:")
    logger.info(f"  - 総時間: {total_duration/3600:.1f}時間")
    logger.info(f"  - 平均品質スコア: {avg_quality:.2f}")
    logger.info(f"  - 話者数: {len(set(data.speaker_id for data in all_data))}")

if __name__ == "__main__":
    import numpy as np
    main()
