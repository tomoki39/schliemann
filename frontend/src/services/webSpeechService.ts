// Web Speech APIを使用した音声合成サービス
export interface WebSpeechVoice {
  name: string;
  lang: string;
  localService: boolean;
  voiceURI: string;
  default?: boolean;
}

export interface SpeechSettings {
  rate?: number; // 0.1 - 10
  pitch?: number; // 0 - 2
  volume?: number; // 0 - 1
  voice?: SpeechSynthesisVoice;
}

export interface SpeechRequest {
  text: string;
  language: string;
  dialect?: string;
  settings?: SpeechSettings;
  onEnd?: () => void; // 再生完了時のコールバック
}

export class WebSpeechService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isSupported: boolean = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    this.loadVoices();
  }

  private loadVoices() {
    if (!this.isSupported) return;

    // 音声リストの読み込み
    const loadVoicesList = () => {
      this.voices = this.synthesis.getVoices();
    };

    // 音声が読み込まれるまで待機
    if (this.voices.length === 0) {
      this.synthesis.onvoiceschanged = loadVoicesList;
      loadVoicesList();
      // 念のためポーリングで取得（ブラウザ差異対応）
      const start = Date.now();
      const timer = setInterval(() => {
        loadVoicesList();
        if (this.voices.length > 0 || Date.now() - start > 3000) {
          clearInterval(timer);
        }
      }, 200);
    }
  }

  // 利用可能な音声のリストを取得
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  // 言語に基づいて音声を選択
  selectVoiceForLanguage(language: string, dialect?: string): SpeechSynthesisVoice | null {
    if (!this.isSupported || this.voices.length === 0) return null;

    // 方言に基づく音声選択のマッピング
    const dialectVoiceMap: Record<string, string[]> = {
      'british': ['en-GB', 'en-UK'],
      'american': ['en-US'],
      'australian': ['en-AU'],
      'canadian': ['en-CA'],
      'castilian': ['es-ES'],
      'mexican': ['es-MX'],
      'parisian': ['fr-FR'],
      'quebec': ['fr-CA'],
      'beijing': ['zh-CN'],
      'taiwan': ['zh-TW'],
      'standard': ['ja-JP'],
      'tokyo': ['ja-JP'],
      'osaka': ['ja-JP'],
    };

    // 方言が指定されている場合
    if (dialect && dialectVoiceMap[dialect]) {
      const targetLangs = dialectVoiceMap[dialect];
      for (const lang of targetLangs) {
        const voice = this.voices.find(v => v.lang.startsWith(lang));
        if (voice) return voice;
      }
    }

    // 言語コードに基づく選択（BCP-47やISO派生も許容）
    const lc = (language || '').toLowerCase();
    const primary = lc.split(/[-_]/)[0];

    // 拡張ISO639-3 → BCP-47 ロケールマッピング（ネイティブ発音優先）
    const isoMap: Record<string, string> = {
      // ヨーロッパ言語
      eng: 'en-US', fra: 'fr-FR', fre: 'fr-FR', spa: 'es-ES', por: 'pt-PT', 
      deu: 'de-DE', ger: 'de-DE', ita: 'it-IT', rus: 'ru-RU', 
      nld: 'nl-NL', dut: 'nl-NL', pol: 'pl-PL', ukr: 'uk-UA',
      ces: 'cs-CZ', cze: 'cs-CZ', hun: 'hu-HU', ron: 'ro-RO', rum: 'ro-RO',
      ell: 'el-GR', gre: 'el-GR', swe: 'sv-SE', dan: 'da-DK', nor: 'no-NO',
      fin: 'fi-FI', cat: 'ca-ES', eus: 'eu-ES', baq: 'eu-ES', glg: 'gl-ES',
      
      // アジア言語（ネイティブロケール指定）
      jpn: 'ja-JP', kor: 'ko-KR', vie: 'vi-VN', tha: 'th-TH', 
      hin: 'hi-IN', ben: 'bn-IN', tam: 'ta-IN', tel: 'te-IN', mar: 'mr-IN',
      guj: 'gu-IN', kan: 'kn-IN', mal: 'ml-IN', pan: 'pa-IN',
      urd: 'ur-PK', nep: 'ne-NP', sin: 'si-LK', mya: 'my-MM', bur: 'my-MM',
      khm: 'km-KH', lao: 'lo-LA', mon: 'mn-MN',
      
      // 中国語系統（地域別ネイティブ音声）
      cmn: 'zh-CN', zho: 'zh-CN', yue: 'zh-HK', wuu: 'zh-CN', 
      hak: 'zh-TW', min: 'zh-TW', nan: 'zh-TW',
      
      // 中東・アフリカ言語
      arb: 'ar-SA', ara: 'ar-SA', heb: 'he-IL', tur: 'tr-TR', 
      fas: 'fa-IR', per: 'fa-IR', swa: 'sw-KE', amh: 'am-ET',
      hau: 'ha-NG', yor: 'yo-NG', ibo: 'ig-NG', zul: 'zu-ZA',
      xho: 'xh-ZA', afr: 'af-ZA', som: 'so-SO',
      
      // 東南アジア
      ind: 'id-ID', msa: 'ms-MY', may: 'ms-MY', fil: 'fil-PH', tgl: 'tl-PH',
      
      // その他
      isl: 'is-IS', ice: 'is-IS', mlg: 'mg-MG', mao: 'mi-NZ', mri: 'mi-NZ',
      
      // 補助的マッピング（方言・変種）
      'osaka': 'ja-JP', 'tokyo': 'ja-JP', 'kyoto': 'ja-JP',
      'british': 'en-GB', 'american': 'en-US', 'australian': 'en-AU',
      'castilian': 'es-ES', 'mexican': 'es-MX', 'argentine': 'es-AR',
      'parisian': 'fr-FR', 'quebec': 'fr-CA', 'african': 'fr-FR',
      'brazilian': 'pt-BR', 'european': 'pt-PT',
      'egyptian': 'ar-EG', 'gulf': 'ar-SA', 'levantine': 'ar-LB',
      'beijing': 'zh-CN', 'taiwan': 'zh-TW', 'singapore': 'zh-CN'
    };
    const normalized = isoMap[lc] || isoMap[primary] || lc;
    const normalizedPrimary = normalized.split(/[-_]/)[0];

    // ネイティブ音声を優先的に選択（クラウド音声 > ローカル音声）
    
    // 1) クラウドのネイティブ音声（完全一致）- 最優先
    let voice = this.voices.find(v => 
      v.lang.toLowerCase() === normalized.toLowerCase() && !v.localService
    );
    
    // 2) ローカルのネイティブ音声（完全一致）
    if (!voice) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase() === normalized.toLowerCase() && v.localService
      );
    }
    
    // 3) クラウド音声（言語コードが一致）
    if (!voice) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().startsWith(normalizedPrimary + '-') && !v.localService
      );
    }
    
    // 4) ローカル音声（言語コードが一致）
    if (!voice) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().startsWith(normalizedPrimary + '-') && v.localService
      );
    }
    
    // 5) クラウド音声（言語コードのみ）
    if (!voice) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().startsWith(normalizedPrimary) && !v.localService
      );
    }
    
    // 6) ローカル音声（言語コードのみ）
    if (!voice) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().startsWith(normalizedPrimary)
      );
    }
    
    // 7) 最終フォールバック（デフォルト音声または最初の音声）
    return voice || this.voices.find(v => v.default) || this.voices[0] || null;
  }

  // 音声合成の実行
  async speak(request: SpeechRequest): Promise<boolean> {
    if (!this.isSupported) {
      console.error('Web Speech API is not supported');
      return false;
    }

    return new Promise((resolve) => {
      // 既存の音声を停止
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(request.text);
      
      // 音声の選択
      // 可能なら少し待ってから選択（初回読み込み対策）
      if (this.voices.length === 0) {
        const start = Date.now();
        const wait = setInterval(() => {
          this.voices = this.synthesis.getVoices();
          if (this.voices.length > 0 || Date.now() - start > 1500) {
            clearInterval(wait);
          }
        }, 100);
      }
      const selectedVoice = this.selectVoiceForLanguage(request.language, request.dialect);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        // 選択した音声の言語コードを明示的に設定（ネイティブ発音を保証）
        utterance.lang = selectedVoice.lang;
        console.log(`🎤 Voice selected: ${selectedVoice.name} (${selectedVoice.lang}), Cloud: ${!selectedVoice.localService}`);
      } else {
        console.warn(`⚠️ No suitable voice found for language: ${request.language}, dialect: ${request.dialect}`);
      }

      // 音声設定の適用
      const settings = request.settings || {};
      utterance.rate = settings.rate || 1.0;
      utterance.pitch = settings.pitch || 1.0;
      utterance.volume = settings.volume || 1.0;

      // イベントハンドラー
      utterance.onstart = () => {
        console.log('Speech started');
      };

      utterance.onend = () => {
        console.log('Speech ended');
        if (request.onEnd) {
          request.onEnd();
        }
        resolve(true);
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
        resolve(false);
      };

      // 音声合成の開始
      this.synthesis.speak(utterance);
    });
  }

  // 音声の停止
  stop(): void {
    if (this.isSupported) {
      this.synthesis.cancel();
    }
  }

  // 音声の一時停止
  pause(): void {
    if (this.isSupported) {
      this.synthesis.pause();
    }
  }

  // 音声の再開
  resume(): void {
    if (this.isSupported) {
      this.synthesis.resume();
    }
  }

  // 音声合成中かどうか
  isSpeaking(): boolean {
    return this.isSupported && this.synthesis.speaking;
  }

  // 音声が一時停止中かどうか
  isPaused(): boolean {
    return this.isSupported && this.synthesis.paused;
  }

  // サポート状況の確認
  isWebSpeechSupported(): boolean {
    return this.isSupported;
  }

  // デバッグ用: 利用可能な音声を言語別に表示
  logAvailableVoices(): void {
    if (!this.isSupported) {
      console.warn('Web Speech API is not supported');
      return;
    }

    const voicesByLang: Record<string, SpeechSynthesisVoice[]> = {};
    this.voices.forEach(voice => {
      const lang = voice.lang.split('-')[0];
      if (!voicesByLang[lang]) {
        voicesByLang[lang] = [];
      }
      voicesByLang[lang].push(voice);
    });

    console.log('📢 Available Voices by Language:');
    Object.keys(voicesByLang).sort().forEach(lang => {
      console.log(`\n${lang}:`);
      voicesByLang[lang].forEach(v => {
        console.log(`  - ${v.name} (${v.lang}) ${v.localService ? '[Local]' : '[Cloud]'}`);
      });
    });
  }

  // デバッグ用: 特定言語の音声選択をテスト
  testVoiceSelection(languageCode: string, dialect?: string): void {
    const voice = this.selectVoiceForLanguage(languageCode, dialect);
    if (voice) {
      console.log(`✅ Voice for "${languageCode}" ${dialect ? `(${dialect})` : ''}:`);
      console.log(`   Name: ${voice.name}`);
      console.log(`   Lang: ${voice.lang}`);
      console.log(`   Type: ${voice.localService ? 'Local' : 'Cloud'}`);
    } else {
      console.log(`❌ No voice found for "${languageCode}" ${dialect ? `(${dialect})` : ''}`);
    }
  }
}

// シングルトンインスタンス
export const webSpeechService = new WebSpeechService();
