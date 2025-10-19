# Google Cloud TTS セットアップガイド

## 1. Google Cloud プロジェクトの設定

### プロジェクトの作成
```bash
# Google Cloud CLIでログイン
gcloud auth login

# 新しいプロジェクトを作成（または既存のプロジェクトを使用）
gcloud projects create schliemann-tts --name="Schliemann TTS Project"

# プロジェクトを設定
gcloud config set project schliemann-tts
```

### 必要なAPIの有効化
```bash
# Text-to-Speech APIを有効化
gcloud services enable texttospeech.googleapis.com

# 課金アカウントの設定（必要に応じて）
gcloud billing accounts list
gcloud billing projects link schliemann-tts --billing-account=BILLING_ACCOUNT_ID
```

## 2. 認証の設定

### サービスアカウントの作成
```bash
# サービスアカウントを作成
gcloud iam service-accounts create schliemann-tts-sa \
    --display-name="Schliemann TTS Service Account"

# 必要な権限を付与
gcloud projects add-iam-policy-binding schliemann-tts \
    --member="serviceAccount:schliemann-tts-sa@schliemann-tts.iam.gserviceaccount.com" \
    --role="roles/cloudtts.serviceAgent"

# サービスアカウントキーをダウンロード
gcloud iam service-accounts keys create ~/schliemann-tts-key.json \
    --iam-account=schliemann-tts-sa@schliemann-tts.iam.gserviceaccount.com
```

### 環境変数の設定
```bash
# サービスアカウントキーを設定
export GOOGLE_APPLICATION_CREDENTIALS=~/schliemann-tts-key.json

# プロジェクトIDを設定
export GOOGLE_CLOUD_PROJECT=schliemann-tts
```

## 3. テスト

### 基本的なテスト
```bash
# テキストファイルを作成
echo "你好，今天天气很好。" > test.txt

# Google Cloud TTSで音声合成
gcloud ml text-to-speech synthesize test.txt \
    --voice=cmn-CN-Wavenet-A \
    --language-code=cmn-CN \
    --output-file=test.wav

# 音声を再生
afplay test.wav
```

### SSMLテスト
```bash
# SSMLファイルを作成
cat > test.ssml << EOF
<speak>
  <voice name="cmn-CN-Wavenet-A">
    <prosody rate="slow" pitch="+2st">
      你好，今天天气很好。
    </prosody>
  </voice>
</speak>
EOF

# SSMLで音声合成
gcloud ml text-to-speech synthesize test.ssml \
    --ssml \
    --voice=cmn-CN-Wavenet-A \
    --language-code=cmn-CN \
    --output-file=test-ssml.wav

# 音声を再生
afplay test-ssml.wav
```

## 4. 利用可能な中国語音声

### 標準音声
- `cmn-CN-Standard-A` - 女性
- `cmn-CN-Standard-B` - 男性
- `cmn-CN-Standard-C` - 男性
- `cmn-CN-Standard-D` - 男性

### Wavenet音声（高品質）
- `cmn-CN-Wavenet-A` - 女性（推奨）
- `cmn-CN-Wavenet-B` - 男性
- `cmn-CN-Wavenet-C` - 男性
- `cmn-CN-Wavenet-D` - 男性

### Neural2音声（最新）
- `cmn-CN-Neural2-A` - 女性
- `cmn-CN-Neural2-B` - 男性
- `cmn-CN-Neural2-C` - 男性
- `cmn-CN-Neural2-D` - 男性

## 5. トラブルシューティング

### よくある問題

1. **認証エラー**
   ```bash
   # 認証を再実行
   gcloud auth application-default login
   ```

2. **APIが有効になっていない**
   ```bash
   # APIの状態を確認
   gcloud services list --enabled --filter="name:texttospeech.googleapis.com"
   ```

3. **課金が設定されていない**
   ```bash
   # 課金アカウントを確認
   gcloud billing accounts list
   ```

4. **権限が不足している**
   ```bash
   # 現在のユーザーの権限を確認
   gcloud projects get-iam-policy schliemann-tts
   ```

## 6. コスト

Google Cloud TTSの料金（2024年10月時点）：
- 標準音声: 月間100万文字まで無料、以降$4.00/100万文字
- Wavenet音声: 月間100万文字まで無料、以降$16.00/100万文字
- Neural2音声: 月間100万文字まで無料、以降$16.00/100万文字

詳細: https://cloud.google.com/text-to-speech/pricing
