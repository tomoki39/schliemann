## 音声生成AIによる方言品質向上プラン（大枠）

### 現状概要（確認）
- バックエンドは `Edge TTS` を主として利用し、方言ごとに `rate/pitch` を調整
- ひらがな化などの簡易前処理で漢字読みの誤りを軽減
- フロントは `DialectPlayer` → `AIVoiceService` → `/voice/convert` を呼び出し、MP3/WAVを再生

---

### 結論
**生成AIの活用で、方言らしさ（韻律・語尾・語彙選択）を段階的に向上可能。**

---

### 強化プラン（優先順・上から着手推奨）

1) 低コスト・即効改善（現行構成のまま品質UP）
- SSML化: `<prosody>`、無音挿入、句読点休止、語尾伸長を方言別プリセット化
- 発音制御: `g2p-ja`/`pyopenjtalk` によるかな・音素生成、一部単語を `<phoneme>` で矯正
- 方言辞書: 語尾（〜やで、〜ばい 等）・語彙差・地名読みを辞書化し、SSML生成に反映

2) 生成TTSベンダー活用（声質・韻律の自然さ向上）
- ElevenLabs: 迅速なPOCに適する。Voice Design/Instant Voice とスタイル制御
- Azure Custom Neural Voice: 本番向け。データ／申請が必要だが高品質
- Coqui XTTS v2（自己ホスト）: 参照音声コンディショニングで方言らしさ付与、コスト最適

3) 方言特化の生成AI（最高品質、投資大）
- VITS/StyleTTS2/Kokoro 等への少量微調整や音色適応
- データ: クリーンな方言話者音声（数十分〜）、発音辞書、使用許諾

---

### 実行順（2週間たたき台）
- Week 1: SSMLビルダー＋`g2p-ja`導入、関西/博多/鹿児島の3プリセットでAB比較。用例辞書整備
- Week 2: ベンダーPOC（ElevenLabs または Coqui）。UIに「方言強度」ダイヤルを追加

---

### API/インターフェース拡張（大枠）
`VoiceConversionRequest` に提案項目を追加可能：
- `provider?: 'edge'|'elevenlabs'|'azure'|'coqui'`
- `useSSML?: boolean`
- `styleDegree?: number`（0-2 程度で段階的に韻律を強める）
- `referenceVoiceId?: string` | `referenceAudioUrl?: string`

バックエンド側：
- SSMLビルダー（方言辞書＋G2P）を追加
- プロバイダ切替（Edge/ElevenLabs/Azure/Coqui）とフォールバック統一

---

### データ・運用上の注意
- 辞書: 方言特有の語尾・語彙・地名読みを優先的に整備（少数精鋭で効果大）
- 評価: 固定評価文でABテスト（主観5段階＋聴取時間）
- 法務: 参照音声の権利・同意、Custom Neural Voice規約確認
- SLO: レイテンシ < 1.5s、フォールバックは現行Edge TTSを維持

---

### 次アクション（すぐ着手できる事項）
- SSMLビルダー雛形作成（方言3種のプリセット）
- `g2p-ja` を用いた読み生成と、優先語彙に `<phoneme>` を適用
- ベンダー1社でPOC（ElevenLabs か Coqui）



