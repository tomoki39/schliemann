# 音声テスト - ブラウザコンソール版

## 🚀 簡単テスト方法（1分）

### 手順

1. **アプリを開く**
   ```
   http://localhost:5173
   ```

2. **ブラウザのコンソールを開く**
   - Mac: `Cmd + Option + J` (Chrome) または `Cmd + Option + C` (Safari)
   - Windows: `Ctrl + Shift + J`

3. **以下のコードをコピー＆ペースト**

---

## 📋 テストコード

### ステップ1: 利用可能な音声を確認

```javascript
// 全音声をコンソールに表示
const voices = speechSynthesis.getVoices();
const byLang = {};
voices.forEach(v => {
  const lang = v.lang.split('-')[0];
  if (!byLang[lang]) byLang[lang] = [];
  byLang[lang].push(`${v.name} (${v.lang}) ${v.localService ? '[Local]' : '[Cloud]'}`);
});

console.log('📢 利用可能な音声:');
Object.keys(byLang).sort().forEach(lang => {
  console.log(`\n${lang}:`);
  byLang[lang].forEach(v => console.log(`  - ${v}`));
});
```

**期待される出力例**:
```
vi:
  - Google tiếng Việt (vi-VN) [Cloud] ✅
  
th:
  - Google ไทย (th-TH) [Cloud] ✅
  
ar:
  - Google العربية (ar-SA) [Cloud] ✅
```

---

### ステップ2: ベトナム語をテスト

```javascript
// ベトナム語の音声選択と再生
const testVietnamese = () => {
  const voices = speechSynthesis.getVoices();
  const vietnameseVoice = voices.find(v => 
    v.lang.toLowerCase().startsWith('vi') && !v.localService
  ) || voices.find(v => v.lang.toLowerCase().startsWith('vi'));
  
  if (vietnameseVoice) {
    console.log('✅ ベトナム語音声:', vietnameseVoice.name, vietnameseVoice.lang);
    const utterance = new SpeechSynthesisUtterance('Xin chào, bạn khỏe không?');
    utterance.voice = vietnameseVoice;
    utterance.lang = vietnameseVoice.lang;
    speechSynthesis.speak(utterance);
  } else {
    console.log('❌ ベトナム語音声が見つかりません');
  }
};

testVietnamese();
```

**期待**: ネイティブのベトナム語発音で「シン チャオ、バン コエ コン？」が聞こえる

---

### ステップ3: タイ語をテスト

```javascript
// タイ語の音声選択と再生
const testThai = () => {
  const voices = speechSynthesis.getVoices();
  const thaiVoice = voices.find(v => 
    v.lang.toLowerCase().startsWith('th') && !v.localService
  ) || voices.find(v => v.lang.toLowerCase().startsWith('th'));
  
  if (thaiVoice) {
    console.log('✅ タイ語音声:', thaiVoice.name, thaiVoice.lang);
    const utterance = new SpeechSynthesisUtterance('สวัสดีครับ คุณสบายดีไหม');
    utterance.voice = thaiVoice;
    utterance.lang = thaiVoice.lang;
    speechSynthesis.speak(utterance);
  } else {
    console.log('❌ タイ語音声が見つかりません');
  }
};

testThai();
```

**期待**: ネイティブのタイ語発音で声調が正確に再現される

---

### ステップ4: アラビア語をテスト

```javascript
// アラビア語の音声選択と再生
const testArabic = () => {
  const voices = speechSynthesis.getVoices();
  const arabicVoice = voices.find(v => 
    v.lang.toLowerCase().startsWith('ar') && !v.localService
  ) || voices.find(v => v.lang.toLowerCase().startsWith('ar'));
  
  if (arabicVoice) {
    console.log('✅ アラビア語音声:', arabicVoice.name, arabicVoice.lang);
    const utterance = new SpeechSynthesisUtterance('مرحباً، كيف حالك؟');
    utterance.voice = arabicVoice;
    utterance.lang = arabicVoice.lang;
    speechSynthesis.speak(utterance);
  } else {
    console.log('❌ アラビア語音声が見つかりません');
  }
};

testArabic();
```

**期待**: ネイティブのアラビア語発音で咽頭音が正確に再現される

---

### ステップ5: 韓国語をテスト

```javascript
// 韓国語の音声選択と再生
const testKorean = () => {
  const voices = speechSynthesis.getVoices();
  const koreanVoice = voices.find(v => 
    v.lang.toLowerCase().startsWith('ko') && !v.localService
  ) || voices.find(v => v.lang.toLowerCase().startsWith('ko'));
  
  if (koreanVoice) {
    console.log('✅ 韓国語音声:', koreanVoice.name, koreanVoice.lang);
    const utterance = new SpeechSynthesisUtterance('안녕하세요, 오늘 어떠세요?');
    utterance.voice = koreanVoice;
    utterance.lang = koreanVoice.lang;
    speechSynthesis.speak(utterance);
  } else {
    console.log('❌ 韓国語音声が見つかりません');
  }
};

testKorean();
```

---

### ステップ6: 全テストを一度に実行

```javascript
// 全言語を順次テスト
const testAllLanguages = async () => {
  const tests = [
    { lang: 'vi', text: 'Xin chào, bạn khỏe không?', name: 'ベトナム語' },
    { lang: 'th', text: 'สวัสดีครับ คุณสบายดีไหม', name: 'タイ語' },
    { lang: 'ar', text: 'مرحباً، كيف حالك؟', name: 'アラビア語' },
    { lang: 'ko', text: '안녕하세요, 오늘 어떠세요?', name: '韓国語' },
    { lang: 'hi', text: 'नमस्कार, आप आज कैसे हैं?', name: 'ヒンディー語' }
  ];

  for (const test of tests) {
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => 
      v.lang.toLowerCase().startsWith(test.lang) && !v.localService
    ) || voices.find(v => v.lang.toLowerCase().startsWith(test.lang));
    
    if (voice) {
      console.log(`\n🎤 ${test.name}:`);
      console.log(`   音声: ${voice.name} (${voice.lang})`);
      console.log(`   タイプ: ${voice.localService ? 'Local' : 'Cloud'}`);
      
      const utterance = new SpeechSynthesisUtterance(test.text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      speechSynthesis.speak(utterance);
      
      // 次の音声まで待機
      await new Promise(resolve => {
        utterance.onend = () => setTimeout(resolve, 1000);
        utterance.onerror = () => setTimeout(resolve, 1000);
      });
    } else {
      console.log(`❌ ${test.name}: 音声が見つかりません`);
    }
  }
  
  console.log('\n✅ 全テスト完了！');
};

testAllLanguages();
```

**期待**: 5つの言語が順次、ネイティブ発音で再生される

---

## 📌 最も簡単なテスト

アプリのUIから直接テストするのが最も簡単です：

1. ブラウザで http://localhost:5173 を開く
2. **音声体験**タブをクリック
3. **ベトナム語**を探して再生ボタンをクリック
4. ブラウザのコンソール（F12）で以下を確認:
   ```
   🎤 Voice selected: Google tiếng Việt (vi-VN), Cloud: true
   ```

このログが表示され、ネイティブ発音に聞こえれば**成功**です！✅

試してみてください。結果を教えてください！
