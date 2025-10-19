# 上海語方言TTS開発プロジェクト

## 🎯 プロジェクト概要

このプロジェクトは、ネット上のデータを活用して上海語方言の音声合成（TTS）モデルを開発することを目的としています。

## 📁 プロジェクト構造

```
backend/dialect_tts/
├── shanghai_data_collector.py    # データ収集スクリプト
├── audio_preprocessor.py         # 音声前処理スクリプト
├── shanghai_tts_model.py         # TTSモデル定義
├── run_shanghai_tts.py           # 実行スクリプト
├── requirements.txt              # 必要なパッケージ
└── README.md                     # このファイル
```

## 🚀 セットアップ

### 1. 環境準備

```bash
# 仮想環境作成
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate     # Windows

# パッケージインストール
pip install -r requirements.txt
```

### 2. ディレクトリ構造作成

```bash
mkdir -p data/shanghai_dialect/{raw,processed,models,output}
```

## 📊 データ収集

### YouTube動画からの収集

```python
from shanghai_data_collector import ShanghaiDialectCollector

collector = ShanghaiDialectCollector("data/shanghai_dialect")
all_data = collector.collect_all_data()
```

### 収集されるデータ

- **YouTube動画**: 上海語関連の動画（字幕付き）
- **ポッドキャスト**: 上海語番組
- **オーディオブック**: 上海語版書籍

## 🔧 音声前処理

### 前処理の内容

1. **音声正規化**: RMS正規化、クリッピング防止
2. **ノイズ除去**: noisereduceライブラリを使用
3. **品質チェック**: SNR、無音部分の割合をチェック
4. **音声分割**: 適切な長さ（10秒）に分割
5. **特徴量抽出**: MFCC、メルスペクトログラム等

### 実行方法

```python
from audio_preprocessor import AudioPreprocessor

preprocessor = AudioPreprocessor(
    target_sr=22050,
    target_duration=10.0,
    min_duration=2.0,
    max_duration=30.0
)

processed_data = preprocessor.preprocess_directory(
    "data/shanghai_dialect/raw/audio",
    "data/shanghai_dialect/processed"
)
```

## 🤖 TTSモデル

### モデル構成

- **エンコーダー**: テキスト → 特徴量
- **デコーダー**: 特徴量 → 音声
- **方言エンコーダー**: 上海語特有の音韻特徴を学習

### 上海語特有の特徴

- **語彙変換**: 標準中国語 → 上海語方言
- **音韻特徴**: 濁音の保持、入声の保持
- **声調パターン**: 上海語特有の声調

### 学習実行

```python
from shanghai_tts_model import ShanghaiTTSModel, ShanghaiTTSTrainer

model = ShanghaiTTSModel()
trainer = ShanghaiTTSTrainer(model)

# 学習実行
for epoch in range(100):
    loss = trainer.train_epoch(dataloader)
    print(f"Epoch {epoch+1}, Loss: {loss:.4f}")
```

## 🎵 音声合成

### 合成例

```python
# テキストから音声を合成
test_text = "侬好，今朝天气蛮好"
audio = trainer.synthesize(test_text)

# 音声保存
import soundfile as sf
sf.write("output.wav", audio, 22050)
```

### 上海語特有の表現

- 你好 → 侬好
- 今天 → 今朝
- 很好 → 蛮好
- 我们 → 阿拉
- 你们 → 侬拉

## 🚀 実行方法

### 全パイプライン実行

```bash
python run_shanghai_tts.py --step all --max-videos 100 --epochs 50
```

### 個別ステップ実行

```bash
# データ収集のみ
python run_shanghai_tts.py --step collect --max-videos 100

# 前処理のみ
python run_shanghai_tts.py --step preprocess

# モデル学習のみ
python run_shanghai_tts.py --step train --epochs 50

# 音声合成のみ
python run_shanghai_tts.py --step synthesize
```

## 📈 期待される結果

### 短期的目標（1-2ヶ月）

- [x] データ収集パイプラインの構築
- [x] 音声前処理の実装
- [x] 基本的なTTSモデルの開発
- [ ] 上海語特有の語彙変換の実装

### 中期的目標（3-6ヶ月）

- [ ] 高品質な上海語音声合成
- [ ] リアルタイム音声合成
- [ ] 他の方言への拡張（四川語、慶尚方言等）

### 長期的目標（6-12ヶ月）

- [ ] 商用レベルの方言TTS
- [ ] 多言語・多方言対応
- [ ] 音声品質の継続的改善

## 🔍 技術的詳細

### 使用技術

- **音声処理**: librosa, soundfile, noisereduce
- **機械学習**: PyTorch, transformers
- **データ収集**: yt-dlp, requests
- **音声合成**: Tacotron2, WaveNet（予定）

### データ要件

- **音声データ**: 10,000時間以上
- **品質**: SNR > 10dB, 無音部分 < 30%
- **形式**: WAV, 22.05kHz, 16bit
- **長さ**: 2-30秒のセグメント

## 🐛 トラブルシューティング

### よくある問題

1. **音声品質が低い**
   - ノイズ除去のパラメータを調整
   - より高品質なデータソースを使用

2. **学習が収束しない**
   - 学習率を調整
   - バッチサイズを変更
   - データの品質を確認

3. **音声合成が不自然**
   - モデルのアーキテクチャを調整
   - より多くの学習データを使用

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します。

## 📞 連絡先

質問や提案がある場合は、GitHubのイシューを作成してください。
