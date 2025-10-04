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

    // 言語コードに基づく選択
    const languageMap: Record<string, string> = {
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'ru': 'ru',
      'ja': 'ja',
      'ko': 'ko',
      'zh': 'zh',
      'ar': 'ar',
      'hi': 'hi',
    };

    const langCode = languageMap[language.toLowerCase()] || language.toLowerCase();
    const voice = this.voices.find(v => v.lang.startsWith(langCode));
    
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
      const selectedVoice = this.selectVoiceForLanguage(request.language, request.dialect);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
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
}

// シングルトンインスタンス
export const webSpeechService = new WebSpeechService();
