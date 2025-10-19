#!/usr/bin/env python3
"""
上海語方言データ収集スクリプト
YouTube、ポッドキャスト、オーディオブックから上海語音声データを収集
"""

import os
import json
import yt_dlp
import requests
from pathlib import Path
from typing import List, Dict, Any
import logging

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ShanghaiDialectCollector:
    def __init__(self, output_dir: str = "data/shanghai_dialect"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # 上海語関連のキーワード
        self.keywords = [
            "上海话", "沪语", "上海方言", "上海话教学", "上海话教程",
            "上海话对话", "上海话故事", "上海话新闻", "上海话歌曲",
            "上海话电影", "上海话电视剧", "上海话广播"
        ]
        
        # YouTube設定
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': str(self.output_dir / 'audio' / '%(title)s.%(ext)s'),
            'extractaudio': True,
            'audioformat': 'wav',
            'noplaylist': True,
            'quiet': True,
        }
    
    def collect_youtube_data(self, max_videos_per_keyword: int = 50) -> List[Dict[str, Any]]:
        """YouTubeから上海語動画を収集"""
        logger.info("YouTubeから上海語データを収集開始...")
        
        collected_data = []
        
        with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
            for keyword in self.keywords:
                logger.info(f"キーワード '{keyword}' で検索中...")
                
                try:
                    # YouTube検索
                    search_query = f"ytsearch{max_videos_per_keyword}:{keyword}"
                    search_results = ydl.extract_info(search_query, download=False)
                    
                    if 'entries' in search_results:
                        for entry in search_results['entries']:
                            if entry:
                                video_data = {
                                    'title': entry.get('title', ''),
                                    'url': entry.get('webpage_url', ''),
                                    'duration': entry.get('duration', 0),
                                    'uploader': entry.get('uploader', ''),
                                    'view_count': entry.get('view_count', 0),
                                    'description': entry.get('description', ''),
                                    'keywords': keyword,
                                    'source': 'youtube'
                                }
                                collected_data.append(video_data)
                                
                except Exception as e:
                    logger.error(f"キーワード '{keyword}' の検索でエラー: {e}")
                    continue
        
        # メタデータを保存
        metadata_file = self.output_dir / 'youtube_metadata.json'
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(collected_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"YouTubeから {len(collected_data)} 件の動画情報を収集")
        return collected_data
    
    def download_audio(self, video_data: List[Dict[str, Any]], max_duration: int = 600) -> List[str]:
        """動画から音声をダウンロード"""
        logger.info("音声ダウンロード開始...")
        
        downloaded_files = []
        
        with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
            for video in video_data:
                # 長すぎる動画はスキップ
                if video.get('duration', 0) > max_duration:
                    continue
                
                try:
                    # 音声ダウンロード
                    ydl.download([video['url']])
                    
                    # ダウンロードしたファイルのパスを記録
                    filename = f"{video['title']}.wav"
                    file_path = self.output_dir / 'audio' / filename
                    
                    if file_path.exists():
                        downloaded_files.append(str(file_path))
                        logger.info(f"ダウンロード完了: {filename}")
                    
                except Exception as e:
                    logger.error(f"ダウンロードエラー {video['title']}: {e}")
                    continue
        
        logger.info(f"{len(downloaded_files)} ファイルの音声をダウンロード")
        return downloaded_files
    
    def collect_podcast_data(self) -> List[Dict[str, Any]]:
        """ポッドキャストから上海語データを収集"""
        logger.info("ポッドキャストから上海語データを収集...")
        
        # 上海語ポッドキャストのRSSフィード
        podcast_feeds = [
            "https://example.com/shanghai-podcast.rss",  # 実際のフィードに置き換え
            # 他の上海語ポッドキャストフィード
        ]
        
        podcast_data = []
        
        for feed_url in podcast_feeds:
            try:
                # RSSフィードを解析（実際の実装ではfeedparser等を使用）
                # ここではサンプルデータ
                sample_episode = {
                    'title': '上海话日常对话',
                    'url': 'https://example.com/episode1.mp3',
                    'duration': 1800,
                    'description': '上海话の日常会話',
                    'source': 'podcast'
                }
                podcast_data.append(sample_episode)
                
            except Exception as e:
                logger.error(f"ポッドキャストフィード {feed_url} の解析エラー: {e}")
                continue
        
        return podcast_data
    
    def collect_audiobook_data(self) -> List[Dict[str, Any]]:
        """オーディオブックから上海語データを収集"""
        logger.info("オーディオブックから上海語データを収集...")
        
        # 上海語オーディオブックの情報
        audiobook_data = [
            {
                'title': '上海话故事集',
                'url': 'https://example.com/shanghai-stories.mp3',
                'duration': 3600,
                'description': '上海话の物語集',
                'source': 'audiobook'
            }
        ]
        
        return audiobook_data
    
    def collect_all_data(self) -> Dict[str, Any]:
        """すべてのソースからデータを収集"""
        logger.info("上海語方言データの包括的収集開始...")
        
        all_data = {
            'youtube': self.collect_youtube_data(),
            'podcast': self.collect_podcast_data(),
            'audiobook': self.collect_audiobook_data()
        }
        
        # 統合メタデータを保存
        metadata_file = self.output_dir / 'all_metadata.json'
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        
        total_items = sum(len(data) for data in all_data.values())
        logger.info(f"総計 {total_items} 件のデータを収集完了")
        
        return all_data

def main():
    """メイン実行関数"""
    collector = ShanghaiDialectCollector()
    
    # データ収集実行
    all_data = collector.collect_all_data()
    
    # YouTube音声のダウンロード
    youtube_data = all_data.get('youtube', [])
    if youtube_data:
        downloaded_files = collector.download_audio(youtube_data)
        logger.info(f"音声ファイル {len(downloaded_files)} 件をダウンロード完了")
    
    logger.info("上海語データ収集完了！")

if __name__ == "__main__":
    main()
