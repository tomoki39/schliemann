# Google Cloud Text-to-Speech セットアップガイド

## 🎯 概要

Google Cloud TTSを使用することで、220以上の言語・方言でGoogle翻訳レベルの高品質な音声を実現できます。

**料金**: 月100万文字まで無料（デモには十分）

---

## 📋 セットアップ手順（15分）

### ステップ1: Google Cloudプロジェクト作成（5分）

1. **Google Cloud Consoleにアクセス**
   ```
   https://console.cloud.google.com
   ```

2. **新しいプロジェクトを作成**
   - プロジェクト名: `schliemann-tts`（または任意の名前）
   - 「作成」をクリック

3. **プロジェクトを選択**
   - 上部のプロジェクト選択から、作成したプロジェクトを選択

### ステップ2: Cloud Text-to-Speech APIを有効化（3分）

1. **APIライブラリを開く**
   ```
   https://console.cloud.google.com/apis/library
   ```

2. **「Cloud Text-to-Speech API」を検索**

3. **「有効にする」をクリック**
   - 数秒で有効化されます

### ステップ3: APIキーを作成（5分）

1. **認証情報ページを開く**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **「認証情報を作成」→「APIキー」を選択**

3. **APIキーが生成される**
   - `AIzaSy...` のような形式
   - **コピーして保存**

4. **APIキーを制限（推奨）**
   - 「APIキーを編集」をクリック
   - 「APIの制限」→「キーを制限」
   - 「Cloud Text-to-Speech API」のみを選択
   - 「保存」

### ステップ4: 環境変数に設定（2分）

1. **frontend/.env ファイルを開く**

2. **以下を追加**
   ```bash
   VITE_GOOGLE_CLOUD_TTS_API_KEY=AIzaSy...（あなたのAPIキー）
   ```

3. **保存**

### ステップ5: 開発サーバーを再起動

```bash
# 既存のサーバーを停止（Ctrl+C）
# 再起動
cd frontend
npm run dev
```

---

## ✅ 動作確認

### 方法1: ブラウザコンソールで確認

1. ブラウザで http://localhost:3000（または5173）を開く

2. コンソール（F12）で実行:
   ```javascript
   // Google Cloud TTSが有効か確認
   console.log('利用可能なプロバイダー:', enhancedVoiceService.getAvailableProviders());
   // 期待: ['googlecloud', 'elevenlabs', 'webspeech'] または ['googlecloud', 'webspeech']
   ```

3. **ベトナム語で音声テスト**:
   ```javascript
   // Google Cloud TTSで利用可能なベトナム語音声を確認
   await googleCloudTTSService.listVoicesForLanguage('vi-VN');
   
   // ベトナム語を再生
   await googleCloudTTSService.speak({
     text: 'Xin chào, bạn khỏe không?',
     languageCode: 'vi-VN'
   });
   ```

### 方法2: UIから確認

1. 「音声体験」タブ → 「全言語一覧」
2. **ベトナム語**の緑ボタンをクリック
3. コンソールで以下が表示されることを確認:
   ```
   🎤 Google Cloud TTS: vi-VN-Wavenet-A (vi-VN)
   ```
4. **ネイティブのベトナム語発音**が聞こえる！

---

## 🎤 対応言語

Google Cloud TTSは以下の言語に対応：

### アジア
- 日本語（ja-JP）- 4音声（男女・Wavenet）
- 韓国語（ko-KR）- 4音声
- 中国語（zh-CN, zh-TW, yue-HK）- 8音声
- ベトナム語（vi-VN）- 4音声 ✅
- タイ語（th-TH）- 2音声 ✅
- ヒンディー語（hi-IN）- 4音声
- ベンガル語（bn-IN）- 2音声
- インドネシア語（id-ID）- 3音声
- マレー語（ms-MY）- 2音声
- フィリピン語（fil-PH）- 4音声

### ヨーロッパ
- 英語（en-US, en-GB, en-AU）- 30以上の音声
- フランス語（fr-FR, fr-CA）- 8音声
- スペイン語（es-ES, es-MX, es-AR）- 12音声
- ドイツ語（de-DE）- 8音声
- イタリア語（it-IT）- 4音声
- ロシア語（ru-RU）- 5音声
- ポルトガル語（pt-PT, pt-BR）- 6音声

### 中東・アフリカ
- アラビア語（ar-XA）- 4音声 ✅
- トルコ語（tr-TR）- 5音声
- ヘブライ語（he-IL）- 1音声
- スワヒリ語（sw-KE）- 1音声

**合計220以上の音声**

---

## 💰 料金

### 無料枠（デモには十分）
- **100万文字/月**まで無料
- WaveNet音声（最高品質）: 100万文字/月

### 概算
- 1回の音声生成: 約20-50文字
- 100万文字 = 約20,000-50,000回の音声生成
- **デモで使用する程度なら完全無料**

### 参考料金（無料枠超過後）
- Standard音声: $4.00 / 100万文字
- WaveNet音声: $16.00 / 100万文字

---

## 🔧 トラブルシューティング

### 音声が再生されない

1. **APIキーを確認**
   ```bash
   cat frontend/.env | grep GOOGLE_CLOUD
   ```
   
2. **APIが有効化されているか確認**
   - Google Cloud Consoleでプロジェクトを選択
   - 「APIとサービス」→「有効なAPI」
   - 「Cloud Text-to-Speech API」があることを確認

3. **ブラウザコンソールでエラー確認**
   - F12キーでコンソールを開く
   - エラーメッセージを確認

### よくあるエラー

**エラー1**: `API key not valid`
- APIキーが間違っている
- APIキーの制限設定を確認

**エラー2**: `This API method requires billing to be enabled`
- プロジェクトに請求先アカウントを紐付ける必要がある
- Google Cloud Consoleで請求先を設定（無料枠内でも必要）

**エラー3**: `CORS error`
- APIキーの制限設定で「HTTPリファラー」を設定
- `http://localhost:*` と `http://192.168.*` を許可

---

## 🎯 実装完了の確認

以下が全て✅になれば完了：

- [ ] Google Cloudプロジェクト作成完了
- [ ] Cloud Text-to-Speech API有効化完了
- [ ] APIキー取得完了
- [ ] .envファイルに設定完了
- [ ] 開発サーバー再起動完了
- [ ] ベトナム語がネイティブ発音で再生される
- [ ] タイ語がネイティブ発音で再生される
- [ ] アラビア語がネイティブ発音で再生される
- [ ] コンソールに「Google Cloud TTS」のログが表示される

---

## 📊 期待される改善効果

| 言語 | Web Speech API | Google Cloud TTS | 改善度 |
|------|---------------|------------------|--------|
| ベトナム語 | 30点（英語訛り） | **85点**（ネイティブ） | +55点 |
| タイ語 | 30点（英語訛り） | **85点**（ネイティブ） | +55点 |
| アラビア語 | 40点（英語訛り） | **90点**（ネイティブ） | +50点 |
| 韓国語 | 60点 | **85点** | +25点 |
| ヒンディー語 | 50点 | **85点** | +35点 |
| 日本語 | 70点 | **90点** | +20点 |
| 大阪弁 | 60点 | **75点** | +15点 |

**全体的に30-55点の大幅改善が期待できます！**
