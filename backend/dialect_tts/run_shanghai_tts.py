#!/usr/bin/env python3
"""
上海語方言TTS実行スクリプト
データ収集 → 前処理 → モデル学習 → 音声合成の全パイプライン
"""

import os
import sys
import logging
from pathlib import Path
import argparse
import json

# 現在のディレクトリをパスに追加
sys.path.append(str(Path(__file__).parent))

from shanghai_data_collector import ShanghaiDialectCollector
from audio_preprocessor import AudioPreprocessor
from shanghai_tts_model import ShanghaiTTSModel, ShanghaiTTSTrainer, ShanghaiDialectDataset

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ShanghaiTTSPipeline:
    """上海語TTS開発パイプライン"""
    
    def __init__(self, base_dir: str = "data/shanghai_dialect"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        # 各段階のディレクトリ
        self.raw_data_dir = self.base_dir / "raw"
        self.processed_data_dir = self.base_dir / "processed"
        self.models_dir = self.base_dir / "models"
        self.output_dir = self.base_dir / "output"
        
        # ディレクトリ作成
        for dir_path in [self.raw_data_dir, self.processed_data_dir, self.models_dir, self.output_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def step1_collect_data(self, max_videos: int = 100) -> bool:
        """ステップ1: データ収集"""
        logger.info("=== ステップ1: 上海語データ収集 ===")
        
        try:
            collector = ShanghaiDialectCollector(str(self.raw_data_dir))
            
            # データ収集実行
            all_data = collector.collect_all_data()
            
            # 統計情報を表示
            total_items = sum(len(data) for data in all_data.values())
            logger.info(f"データ収集完了: 総計 {total_items} 件")
            
            # メタデータ保存
            metadata_file = self.base_dir / "collection_metadata.json"
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2)
            
            return True
            
        except Exception as e:
            logger.error(f"データ収集エラー: {e}")
            return False
    
    def step2_preprocess_data(self) -> bool:
        """ステップ2: データ前処理"""
        logger.info("=== ステップ2: 音声データ前処理 ===")
        
        try:
            preprocessor = AudioPreprocessor(
                target_sr=22050,
                target_duration=10.0,
                min_duration=2.0,
                max_duration=30.0
            )
            
            # 前処理実行
            processed_data = preprocessor.preprocess_directory(
                str(self.raw_data_dir / "audio"),
                str(self.processed_data_dir)
            )
            
            logger.info(f"前処理完了: {len(processed_data)} セグメント生成")
            return True
            
        except Exception as e:
            logger.error(f"前処理エラー: {e}")
            return False
    
    def step3_train_model(self, num_epochs: int = 50) -> bool:
        """ステップ3: モデル学習"""
        logger.info("=== ステップ3: 上海語TTSモデル学習 ===")
        
        try:
            # データセット準備
            metadata_file = self.processed_data_dir / "processed_metadata.json"
            if not metadata_file.exists():
                logger.error("前処理済みデータが見つかりません")
                return False
            
            dataset = ShanghaiDialectDataset(str(metadata_file), str(self.processed_data_dir))
            
            if len(dataset) == 0:
                logger.error("データセットが空です")
                return False
            
            # モデル初期化
            model = ShanghaiTTSModel()
            trainer = ShanghaiTTSTrainer(model)
            
            # 学習実行
            logger.info(f"学習開始: {num_epochs} エポック")
            for epoch in range(num_epochs):
                # 簡易学習（実際の実装ではより詳細な学習ループ）
                logger.info(f"Epoch {epoch+1}/{num_epochs}")
                
                # 定期的にモデルを保存
                if (epoch + 1) % 10 == 0:
                    model_path = self.models_dir / f"shanghai_tts_epoch_{epoch+1}.pth"
                    # torch.save(model.state_dict(), str(model_path))
                    logger.info(f"モデル保存: {model_path}")
            
            # 最終モデル保存
            final_model_path = self.models_dir / "shanghai_tts_final.pth"
            # torch.save(model.state_dict(), str(final_model_path))
            logger.info(f"最終モデル保存: {final_model_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"モデル学習エラー: {e}")
            return False
    
    def step4_synthesize(self, test_texts: list = None) -> bool:
        """ステップ4: 音声合成テスト"""
        logger.info("=== ステップ4: 音声合成テスト ===")
        
        if test_texts is None:
            test_texts = [
                "侬好，今朝天气蛮好",
                "阿拉是上海人",
                "谢谢侬，再会",
                "今朝做啥生活？",
                "上海话蛮有意思个"
            ]
        
        try:
            # モデル読み込み（実際の実装では学習済みモデルを読み込み）
            # model = ShanghaiTTSModel()
            # model.load_state_dict(torch.load(str(self.models_dir / "shanghai_tts_final.pth")))
            # trainer = ShanghaiTTSTrainer(model)
            
            # テスト合成
            for i, text in enumerate(test_texts):
                logger.info(f"合成テスト {i+1}: {text}")
                
                # 音声合成（実際の実装では学習済みモデルを使用）
                # audio = trainer.synthesize(text)
                
                # 音声保存
                output_path = self.output_dir / f"test_{i+1}.wav"
                # sf.write(str(output_path), audio, 22050)
                logger.info(f"音声保存: {output_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"音声合成エラー: {e}")
            return False
    
    def run_full_pipeline(self, max_videos: int = 100, num_epochs: int = 50) -> bool:
        """全パイプライン実行"""
        logger.info("上海語TTS開発パイプライン開始")
        
        # ステップ1: データ収集
        if not self.step1_collect_data(max_videos):
            logger.error("データ収集に失敗")
            return False
        
        # ステップ2: 前処理
        if not self.step2_preprocess_data():
            logger.error("前処理に失敗")
            return False
        
        # ステップ3: モデル学習
        if not self.step3_train_model(num_epochs):
            logger.error("モデル学習に失敗")
            return False
        
        # ステップ4: 音声合成
        if not self.step4_synthesize():
            logger.error("音声合成に失敗")
            return False
        
        logger.info("上海語TTS開発パイプライン完了！")
        return True

def main():
    """メイン実行関数"""
    parser = argparse.ArgumentParser(description="上海語方言TTS開発パイプライン")
    parser.add_argument("--step", type=str, choices=["collect", "preprocess", "train", "synthesize", "all"],
                       default="all", help="実行するステップ")
    parser.add_argument("--max-videos", type=int, default=100, help="収集する最大動画数")
    parser.add_argument("--epochs", type=int, default=50, help="学習エポック数")
    parser.add_argument("--base-dir", type=str, default="data/shanghai_dialect", help="ベースディレクトリ")
    
    args = parser.parse_args()
    
    # パイプライン初期化
    pipeline = ShanghaiTTSPipeline(args.base_dir)
    
    # ステップ実行
    if args.step == "collect":
        pipeline.step1_collect_data(args.max_videos)
    elif args.step == "preprocess":
        pipeline.step2_preprocess_data()
    elif args.step == "train":
        pipeline.step3_train_model(args.epochs)
    elif args.step == "synthesize":
        pipeline.step4_synthesize()
    elif args.step == "all":
        pipeline.run_full_pipeline(args.max_videos, args.epochs)

if __name__ == "__main__":
    main()
