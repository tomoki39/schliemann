#!/usr/bin/env python3
"""
高品質方言TTSシステム統合実行スクリプト
データ収集 → 前処理 → モデル学習 → 音声合成の全パイプラインを実行
"""

import os
import sys
import logging
import argparse
from pathlib import Path
import json
import time

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_directories():
    """必要なディレクトリを作成"""
    directories = [
        "shanghai_audio_data",
        "shanghai_audio_data/youtube",
        "shanghai_audio_data/temp",
        "shanghai_audio_data/processed",
        "processed_audio",
        "models/dialect_tts",
        "output"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        logger.info(f"📁 ディレクトリ作成: {directory}")

def run_data_collection():
    """データ収集を実行"""
    logger.info("🎬 データ収集フェーズを開始")
    
    try:
        from data_collector import ShanghaiDialectCollector
        
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
        youtube_data = collector.collect_youtube_data(search_queries, max_duration_hours=2.0)
        
        # 学術データベースからデータを収集
        academic_data = collector.collect_academic_data()
        
        # 全データを統合
        all_data = youtube_data + academic_data
        
        # データを保存
        collector.save_collected_data(all_data)
        
        logger.info(f"✅ データ収集完了: {len(all_data)}件")
        return len(all_data) > 0
        
    except Exception as e:
        logger.error(f"❌ データ収集エラー: {e}")
        return False

def run_audio_preprocessing():
    """音声前処理を実行"""
    logger.info("🎵 音声前処理フェーズを開始")
    
    try:
        from audio_preprocessor import AudioPreprocessor
        
        preprocessor = AudioPreprocessor()
        
        # メタデータファイルのパス
        metadata_file = "shanghai_audio_data/collected_metadata.json"
        
        if not os.path.exists(metadata_file):
            logger.error(f"❌ メタデータファイルが見つかりません: {metadata_file}")
            return False
        
        # 音声コレクションを前処理
        processed_audio_list = preprocessor.process_audio_collection(metadata_file)
        
        # 前処理済みメタデータを保存
        preprocessor.save_processed_metadata(processed_audio_list)
        
        logger.info(f"✅ 音声前処理完了: {len(processed_audio_list)}件")
        return len(processed_audio_list) > 0
        
    except Exception as e:
        logger.error(f"❌ 音声前処理エラー: {e}")
        return False

def run_model_training():
    """モデル学習を実行"""
    logger.info("🎓 モデル学習フェーズを開始")
    
    try:
        from advanced_dialect_tts import train_dialect_tts_model
        
        # 前処理済みメタデータファイルのパス
        metadata_file = "processed_audio/processed_metadata.json"
        
        if not os.path.exists(metadata_file):
            logger.error(f"❌ 前処理済みメタデータファイルが見つかりません: {metadata_file}")
            return False
        
        # モデルを学習
        train_dialect_tts_model(metadata_file, "models/dialect_tts")
        
        logger.info("✅ モデル学習完了")
        return True
        
    except Exception as e:
        logger.error(f"❌ モデル学習エラー: {e}")
        return False

def run_speech_synthesis():
    """音声合成を実行"""
    logger.info("🎤 音声合成フェーズを開始")
    
    try:
        from advanced_dialect_tts import DialectTTSModel, DialectTTSConfig
        
        # 設定
        config = DialectTTSConfig(
            model_path="models/dialect_tts",
            voice_conversion_model="models/dialect_tts/voice_converter.pth",
            phonetic_converter_path="models/dialect_tts",
            speaker_embedding_path="models/dialect_tts"
        )
        
        # モデルを初期化
        model = DialectTTSModel(config)
        
        # テスト音声を合成
        test_texts = [
            "你好，今天天气很好。",
            "我们一起去吃饭吧。",
            "谢谢你的帮助。",
            "再见，明天见。"
        ]
        
        for i, text in enumerate(test_texts):
            logger.info(f"🎤 音声合成中: {text}")
            
            dialect_audio = model.synthesize_dialect_speech(text, dialect="shanghai")
            
            if len(dialect_audio) > 0:
                # 音声を保存
                output_file = f"output/test_dialect_{i+1}.wav"
                import soundfile as sf
                sf.write(output_file, dialect_audio, 22050)
                logger.info(f"✅ 音声保存: {output_file}")
            else:
                logger.warning(f"⚠️ 音声合成失敗: {text}")
        
        logger.info("✅ 音声合成完了")
        return True
        
    except Exception as e:
        logger.error(f"❌ 音声合成エラー: {e}")
        return False

def create_requirements_file():
    """必要な依存関係ファイルを作成"""
    requirements = [
        "torch>=1.9.0",
        "torchaudio>=0.9.0",
        "librosa>=0.9.0",
        "soundfile>=0.10.0",
        "numpy>=1.21.0",
        "scipy>=1.7.0",
        "scikit-learn>=1.0.0",
        "noisereduce>=3.0.0",
        "yt-dlp>=2023.1.1",
        "whisper>=1.0.0",
        "pydub>=0.25.0",
        "requests>=2.28.0",
        "joblib>=1.2.0"
    ]
    
    with open("requirements_advanced.txt", "w") as f:
        f.write("\n".join(requirements))
    
    logger.info("📦 依存関係ファイルを作成: requirements_advanced.txt")

def main():
    """メイン実行関数"""
    parser = argparse.ArgumentParser(description="高品質方言TTSシステム")
    parser.add_argument("--phase", choices=["all", "collect", "preprocess", "train", "synthesize"], 
                       default="all", help="実行するフェーズ")
    parser.add_argument("--skip-collect", action="store_true", help="データ収集をスキップ")
    parser.add_argument("--skip-preprocess", action="store_true", help="前処理をスキップ")
    parser.add_argument("--skip-train", action="store_true", help="学習をスキップ")
    
    args = parser.parse_args()
    
    logger.info("🚀 高品質方言TTSシステムを開始")
    logger.info(f"📋 実行フェーズ: {args.phase}")
    
    # ディレクトリをセットアップ
    setup_directories()
    
    # 依存関係ファイルを作成
    create_requirements_file()
    
    success_count = 0
    total_phases = 0
    
    # データ収集
    if args.phase in ["all", "collect"] and not args.skip_collect:
        total_phases += 1
        if run_data_collection():
            success_count += 1
        else:
            logger.error("❌ データ収集に失敗しました")
            return
    
    # 音声前処理
    if args.phase in ["all", "preprocess"] and not args.skip_preprocess:
        total_phases += 1
        if run_audio_preprocessing():
            success_count += 1
        else:
            logger.error("❌ 音声前処理に失敗しました")
            return
    
    # モデル学習
    if args.phase in ["all", "train"] and not args.skip_train:
        total_phases += 1
        if run_model_training():
            success_count += 1
        else:
            logger.error("❌ モデル学習に失敗しました")
            return
    
    # 音声合成
    if args.phase in ["all", "synthesize"]:
        total_phases += 1
        if run_speech_synthesis():
            success_count += 1
        else:
            logger.error("❌ 音声合成に失敗しました")
            return
    
    # 結果を表示
    logger.info(f"🎉 処理完了: {success_count}/{total_phases} フェーズ成功")
    
    if success_count == total_phases:
        logger.info("✅ すべてのフェーズが正常に完了しました")
        
        # 統計情報を表示
        show_statistics()
    else:
        logger.error("❌ 一部のフェーズでエラーが発生しました")

def show_statistics():
    """統計情報を表示"""
    try:
        # 収集データの統計
        if os.path.exists("shanghai_audio_data/collected_metadata.json"):
            with open("shanghai_audio_data/collected_metadata.json", "r", encoding="utf-8") as f:
                collected_data = json.load(f)
            
            total_duration = sum(item["duration"] for item in collected_data)
            logger.info(f"📊 収集データ統計:")
            logger.info(f"  - 総ファイル数: {len(collected_data)}")
            logger.info(f"  - 総時間: {total_duration/3600:.1f}時間")
        
        # 前処理データの統計
        if os.path.exists("processed_audio/processed_metadata.json"):
            with open("processed_audio/processed_metadata.json", "r", encoding="utf-8") as f:
                processed_data = json.load(f)
            
            total_duration = sum(item["duration"] for item in processed_data)
            avg_quality = sum(item["quality_score"] for item in processed_data) / len(processed_data)
            logger.info(f"📊 前処理データ統計:")
            logger.info(f"  - 総ファイル数: {len(processed_data)}")
            logger.info(f"  - 総時間: {total_duration/3600:.1f}時間")
            logger.info(f"  - 平均品質スコア: {avg_quality:.2f}")
        
        # 出力ファイルの統計
        output_dir = Path("output")
        if output_dir.exists():
            output_files = list(output_dir.glob("*.wav"))
            logger.info(f"📊 出力ファイル統計:")
            logger.info(f"  - 生成ファイル数: {len(output_files)}")
            
    except Exception as e:
        logger.warning(f"⚠️ 統計情報表示エラー: {e}")

if __name__ == "__main__":
    main()
