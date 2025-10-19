# 高品質方言TTSシステム

本格的な方言音声合成システムです。ネット上の豊富な方言データを活用して、より自然で正確な方言音声を生成します。

## 🎯 システム概要

### **Phase 1: データ収集**
- YouTubeから上海語音声データを自動収集
- 学術データベースからの音声データ取得
- 音声品質の自動評価・フィルタリング

### **Phase 2: 音声前処理**
- ノイズ除去・音量正規化
- 音韻特徴の抽出・分析
- 方言特徴の学習・抽出

### **Phase 3: モデル学習**
- 音声変換モデルの学習
- 方言特徴学習モデルの構築
- 話者埋め込みの生成

### **Phase 4: 音声合成**
- 高品質な方言音声の生成
- リアルタイム音声変換
- 複数方言への対応

## 🚀 クイックスタート

### **1. 環境設定**

```bash
# 環境変数を設定
export GOOGLE_CLOUD_API_KEY='your-api-key'
export GOOGLE_CLOUD_PROJECT_ID='your-project-id'

# 依存関係をインストール
cd backend/dialect_tts
pip install -r requirements.txt
```

### **2. システム実行**

```bash
# 全フェーズを実行
./run_advanced_system.sh

# または個別に実行
python run_advanced_tts.py --phase all
```

### **3. 個別フェーズ実行**

```bash
# データ収集のみ
python run_advanced_tts.py --phase collect

# 音声前処理のみ
python run_advanced_tts.py --phase preprocess

# モデル学習のみ
python run_advanced_tts.py --phase train

# 音声合成のみ
python run_advanced_tts.py --phase synthesize
```

## 📊 システム構成

### **データ収集システム**
- **YouTube収集器**: 上海語動画の自動検索・ダウンロード
- **品質評価器**: 音声品質の自動評価・フィルタリング
- **音声認識器**: Whisperを使用した音声テキスト化

### **音声前処理システム**
- **ノイズ除去**: 高品質な音声データの生成
- **特徴抽出**: 音韻・方言特徴の抽出
- **話者分析**: 話者埋め込みの生成

### **方言TTSモデル**
- **音韻変換器**: 標準語→方言の音韻変換
- **音声変換器**: 音声特徴の変換
- **韻律調整器**: 方言特有の韻律適用

## 🎵 期待される品質向上

### **現在の品質**
- 語彙変換のみ
- 基本的な音調調整
- 機械的な発音

### **改善後の品質**
- 自然な方言アクセント
- 正確な音韻変換
- 感情表現を含む自然な発音
- ネイティブ話者に近い品質

## 📈 性能指標

### **データ収集**
- 目標収集時間: 10-50時間
- 品質閾値: 0.4以上
- 話者数: 10-50人

### **音声品質**
- 信号対雑音比: 20dB以上
- 音声周波数範囲: 80Hz-8000Hz
- 動的範囲: 30dB以上

### **方言精度**
- 音韻変換精度: 85%以上
- 語彙変換精度: 95%以上
- 韻律自然度: 80%以上

## 🔧 カスタマイズ

### **方言の追加**
1. `data_collector.py`で検索クエリを追加
2. `audio_preprocessor.py`で方言特徴を定義
3. `advanced_dialect_tts.py`で音韻ルールを追加

### **品質の調整**
1. `audio_preprocessor.py`で品質閾値を調整
2. `advanced_dialect_tts.py`で音声変換パラメータを調整
3. 学習データの量を増加

## 📁 ファイル構成

```
backend/dialect_tts/
├── data_collector.py          # データ収集システム
├── audio_preprocessor.py      # 音声前処理システム
├── advanced_dialect_tts.py    # 高品質方言TTSモデル
├── run_advanced_tts.py        # 統合実行スクリプト
├── run_advanced_system.sh     # 実行用シェルスクリプト
├── requirements.txt           # 依存関係
└── README_ADVANCED.md         # このファイル

shanghai_audio_data/           # 収集データ
├── youtube/                   # YouTube音声
├── processed/                 # 前処理済み音声
└── collected_metadata.json    # メタデータ

processed_audio/               # 前処理済みデータ
└── processed_metadata.json    # 前処理済みメタデータ

models/dialect_tts/            # 学習済みモデル
├── voice_converter.pth        # 音声変換モデル
├── phonetic_ml_model.pkl     # 音韻変換モデル
└── speaker_embeddings.pkl    # 話者埋め込み

output/                        # 生成音声
└── test_dialect_*.wav        # テスト音声
```

## 🐛 トラブルシューティング

### **データ収集エラー**
- YouTube APIの制限に注意
- ネットワーク接続を確認
- ディスク容量を確認

### **音声処理エラー**
- 音声ファイルの形式を確認
- 依存関係のバージョンを確認
- メモリ使用量を監視

### **モデル学習エラー**
- GPUメモリを確認
- 学習データの品質を確認
- ハイパーパラメータを調整

## 📚 参考資料

- [Whisper音声認識](https://github.com/openai/whisper)
- [Librosa音声処理](https://librosa.org/)
- [PyTorch深層学習](https://pytorch.org/)
- [上海語方言研究](https://example.com/shanghai-dialect-research)

## 🤝 貢献

1. 新しい方言の追加
2. 音声品質の改善
3. モデル精度の向上
4. バグの報告・修正

## 📄 ライセンス

MIT License

## 📞 サポート

問題が発生した場合は、ログファイルを確認し、エラーメッセージを報告してください。
