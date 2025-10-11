// 統合された高品質音声サービス
import { elevenLabsService, ElevenLabsRequest } from './elevenLabsService';
import { googleCloudTTSService, GoogleCloudTTSRequest } from './googleCloudTTSService';
import { VoiceQualityService } from './ssmlBuilder';
import { webSpeechService } from './webSpeechService';

export interface EnhancedVoiceRequest {
  text: string;
  language: string;
  dialect?: string;
  voiceId?: string;
  useElevenLabs?: boolean;
  voiceSettings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  customText?: string;
}

export interface EnhancedVoiceResponse {
  success: boolean;
  audioUrl?: string;
  audioData?: ArrayBuffer;
  error?: string;
  duration?: number;
  provider: 'googlecloud' | 'elevenlabs' | 'webspeech' | 'fallback';
}

export class EnhancedVoiceService {
  private elevenLabsApiKey: string | null = null;
  private isElevenLabsAvailable: boolean = false;
  private googleCloudApiKey: string | null = null;
  private isGoogleCloudAvailable: boolean = false;

  constructor() {
    // 環境変数からAPIキーを取得
    // Vite 環境を想定。型は any で吸収
    const viteEnv: any = (import.meta as any).env || {};
    
    // ElevenLabs
    this.elevenLabsApiKey = viteEnv.VITE_ELEVENLABS_API_KEY || null;
    if (this.elevenLabsApiKey) {
      elevenLabsService.setApiKey(this.elevenLabsApiKey);
      this.isElevenLabsAvailable = true;
    }
    
    // Google Cloud TTS
    this.googleCloudApiKey = viteEnv.VITE_GOOGLE_CLOUD_TTS_API_KEY || null;
    if (this.googleCloudApiKey) {
      this.isGoogleCloudAvailable = true;
      // Google Cloud TTSの音声リストを事前読み込み
      googleCloudTTSService.loadVoices().catch(err => {
        console.warn('Failed to load Google Cloud TTS voices:', err);
        this.isGoogleCloudAvailable = false;
      });
    }
  }

  setElevenLabsApiKey(apiKey: string) {
    this.elevenLabsApiKey = apiKey;
    elevenLabsService.setApiKey(apiKey);
    this.isElevenLabsAvailable = true;
  }

  // 高品質音声生成（優先順位: Google Cloud > ElevenLabs > Web Speech）
  async generateVoice(request: EnhancedVoiceRequest): Promise<EnhancedVoiceResponse> {
    const text = request.customText || request.text;
    
    console.log(`🎙️ Voice generation request:`, {
      text: text.substring(0, 50) + '...',
      language: request.language,
      dialect: request.dialect,
      providers: this.getAvailableProviders()
    });
    
    // 1. Google Cloud TTSが利用可能な場合は最優先（無料枠あり、高品質）
    if (this.isGoogleCloudAvailable) {
      console.log('🌐 Trying Google Cloud TTS...');
      try {
        return await this.generateWithGoogleCloud(text, request);
      } catch (error) {
        console.warn('⚠️ Google Cloud TTS failed, trying next provider:', error);
      }
    } else {
      console.log('⚠️ Google Cloud TTS not available');
    }
    
    // 2. ElevenLabsが利用可能な場合は次に使用
    if (this.isElevenLabsAvailable && request.useElevenLabs !== false) {
      try {
        return await this.generateWithElevenLabs(text, request);
      } catch (error) {
        console.warn('ElevenLabs failed, falling back to Web Speech API:', error);
      }
    }

    // 3. Web Speech APIにフォールバック
    try {
      return await this.generateWithWebSpeech(text, request);
    } catch (error) {
      console.error('All voice services failed:', error);
      return {
        success: false,
        error: '音声生成に失敗しました',
        provider: 'fallback'
      };
    }
  }

  // ElevenLabsを使用した音声生成
  private async generateWithElevenLabs(text: string, request: EnhancedVoiceRequest): Promise<EnhancedVoiceResponse> {
    // 方言辞書を適用
    const dialectText = request.dialect ? 
      VoiceQualityService.applyDialectDictionary(text, request.dialect) : text;

    // 音声設定を取得
    const voiceSettings = this.getVoiceSettingsForLanguage(request.language, request.dialect);
    
    // 音声IDを取得（方言に応じて）
    const voiceId = request.voiceId || this.getVoiceIdForLanguage(request.language, request.dialect);

    const elevenLabsRequest: ElevenLabsRequest = {
      text: dialectText,
      voice_id: voiceId,
      voice_settings: {
        ...voiceSettings,
        ...request.voiceSettings
      }
    };

    const response = await elevenLabsService.textToSpeech(elevenLabsRequest);
    const audioUrl = elevenLabsService.createAudioUrl(response.audio, response.content_type);

    return {
      success: true,
      audioUrl,
      audioData: response.audio,
      provider: 'elevenlabs',
      duration: response.audio.byteLength / 16000 // 概算
    };
  }

  // Google Cloud TTSを使用した音声生成
  private async generateWithGoogleCloud(text: string, request: EnhancedVoiceRequest): Promise<EnhancedVoiceResponse> {
    // 方言辞書を適用
    const dialectText = request.dialect ? 
      VoiceQualityService.applyDialectDictionary(text, request.dialect) : text;

    // 言語コードを取得（BCP-47形式）
    const languageCode = this.getLanguageCode(request.language, request.dialect);

    const googleRequest: GoogleCloudTTSRequest = {
      text: dialectText,
      languageCode: languageCode,
      speakingRate: this.getRateForDialect(request.dialect),
      pitch: (this.getPitchForDialect(request.dialect) - 1.0) * 20, // Google Cloud uses semitones
      volumeGainDb: 0
    };

    const ok = await googleCloudTTSService.speak(googleRequest);

    return {
      success: ok,
      provider: 'googlecloud'
    };
  }

  // Web Speech APIを使用した音声生成
  private async generateWithWebSpeech(text: string, request: EnhancedVoiceRequest): Promise<EnhancedVoiceResponse> {
    // 方言辞書を適用
    const dialectText = request.dialect ? 
      VoiceQualityService.applyDialectDictionary(text, request.dialect) : text;

    // 言語コードを取得
    const languageCode = this.getLanguageCode(request.language, request.dialect);

    const ok = await webSpeechService.speak({
      text: dialectText,
      language: languageCode,
      settings: {
        rate: this.getRateForDialect(request.dialect),
        pitch: this.getPitchForDialect(request.dialect),
        volume: 1.0
      }
    });

    return {
      success: ok,
      provider: 'webspeech'
    };
  }

  // 言語・方言に適した音声設定を取得
  private getVoiceSettingsForLanguage(language: string, dialect?: string): any {
    return elevenLabsService.getVoiceSettingsForLanguage(language, dialect);
  }

  // 言語・方言に適した音声IDを取得
  private getVoiceIdForLanguage(language: string, dialect?: string): string {
    // デフォルトの音声IDマッピング
    const voiceMapping: Record<string, Record<string, string>> = {
      japanese: {
        standard: 'pNInz6obpgDQGcFmaJgB', // 日本語女性
        kansai: 'pNInz6obpgDQGcFmaJgB', // 関西弁（同じ音声で設定で調整）
        hakata: 'pNInz6obpgDQGcFmaJgB', // 博多弁
        tsugaru: 'pNInz6obpgDQGcFmaJgB', // 津軽弁
        okinawa: 'pNInz6obpgDQGcFmaJgB'  // 沖縄方言
      },
      english: {
        standard: 'EXAVITQu4vr4xnSDxMaL', // 英語男性
        british: 'EXAVITQu4vr4xnSDxMaL', // イギリス英語
        american: 'EXAVITQu4vr4xnSDxMaL', // アメリカ英語
        australian: 'EXAVITQu4vr4xnSDxMaL' // オーストラリア英語
      },
      chinese: {
        standard: 'VR6AewLTigWG4xSOukaG', // 中国語
        mandarin: 'VR6AewLTigWG4xSOukaG', // 北京語
        cantonese: 'VR6AewLTigWG4xSOukaG'  // 広東語
      },
      spanish: {
        standard: 'ErXwobaYiN019PkySvjV', // スペイン語
        castilian: 'ErXwobaYiN019PkySvjV', // カスティーリャ語
        mexican: 'ErXwobaYiN019PkySvjV'    // メキシコスペイン語
      },
      french: {
        standard: 'pNInz6obpgDQGcFmaJgB', // フランス語
        parisian: 'pNInz6obpgDQGcFmaJgB', // パリフランス語
        quebec: 'pNInz6obpgDQGcFmaJgB'     // ケベックフランス語
      }
    };

    return voiceMapping[language]?.[dialect || 'standard'] || 
           voiceMapping[language]?.standard || 
           'pNInz6obpgDQGcFmaJgB'; // デフォルト
  }

  // 言語コードを取得（Google Cloud TTS用のBCP-47形式）
  private getLanguageCode(language: string, dialect?: string): string {
    // 方言別の詳細マッピング
    const dialectMap: Record<string, string> = {
      // 日本語方言
      'standard': 'ja-JP', 'tokyo': 'ja-JP', 'osaka': 'ja-JP', 'kyoto': 'ja-JP',
      'kansai': 'ja-JP', 'hakata': 'ja-JP', 'tsugaru': 'ja-JP', 'okinawa': 'ja-JP',
      
      // 英語方言
      'british': 'en-GB', 'american': 'en-US', 'australian': 'en-AU', 
      'canadian': 'en-CA', 'indian': 'en-IN',
      
      // スペイン語方言
      'castilian': 'es-ES', 'mexican': 'es-MX', 'argentine': 'es-AR',
      'colombian': 'es-CO', 'andalusian': 'es-ES', 'caribbean': 'es-PR',
      
      // フランス語方言
      'parisian': 'fr-FR', 'quebec': 'fr-CA', 'african': 'fr-FR',
      'belgian': 'fr-BE', 'swiss': 'fr-CH',
      
      // ポルトガル語方言
      'brazilian': 'pt-BR', 'european': 'pt-PT',
      
      // 中国語方言
      'beijing': 'zh-CN', 'taiwan': 'zh-TW', 'singapore': 'zh-CN',
      
      // アラビア語方言
      'egyptian': 'ar-EG', 'gulf': 'ar-SA', 'levantine': 'ar-LB', 'maghrebi': 'ar-MA'
    };

    // 方言が指定されている場合は方言マッピングを使用
    if (dialect && dialectMap[dialect]) {
      return dialectMap[dialect];
    }

    // 入力はISO 639-3のidや英語名の可能性がある
    const map: Record<string, string> = {
      // ISO 639-3 → BCP-47（Google Cloud TTS対応）
      jpn: 'ja-JP', eng: 'en-US', fra: 'fr-FR', fre: 'fr-FR', spa: 'es-ES', 
      deu: 'de-DE', ger: 'de-DE', ita: 'it-IT', por: 'pt-PT', ptb: 'pt-BR', 
      rus: 'ru-RU', cmn: 'zh-CN', zho: 'zh-CN', yue: 'yue-HK', wuu: 'zh-CN', 
      hak: 'zh-TW', min: 'zh-TW', nan: 'zh-TW',
      arb: 'ar-XA', ara: 'ar-XA', hin: 'hi-IN', kor: 'ko-KR', vie: 'vi-VN', 
      tha: 'th-TH', ben: 'bn-IN', pan: 'pa-IN', guj: 'gu-IN', mar: 'mr-IN',
      tel: 'te-IN', tam: 'ta-IN', kan: 'kn-IN', mal: 'ml-IN', ori: 'or-IN', 
      asm: 'as-IN', urd: 'ur-IN', nep: 'ne-NP', sin: 'si-LK', mya: 'my-MM', 
      bur: 'my-MM', khm: 'km-KH', lao: 'lo-LA', mon: 'mn-MN', bod: 'bo-CN',
      tib: 'bo-CN',
      tur: 'tr-TR', aze: 'az-AZ', kaz: 'kk-KZ', uzb: 'uz-UZ', pus: 'ps-AF', 
      kur: 'ku-TR', amh: 'am-ET', swa: 'sw-KE', hau: 'ha-NG', yor: 'yo-NG',
      ibo: 'ig-NG', zul: 'zu-ZA', xho: 'xh-ZA', afr: 'af-ZA', som: 'so-SO',
      ind: 'id-ID', msa: 'ms-MY', may: 'ms-MY', fil: 'fil-PH', tgl: 'tl-PH',
      nld: 'nl-NL', dut: 'nl-NL', pol: 'pl-PL', ukr: 'uk-UA', ces: 'cs-CZ',
      cze: 'cs-CZ', hun: 'hu-HU', ron: 'ro-RO', rum: 'ro-RO', ell: 'el-GR',
      gre: 'el-GR', swe: 'sv-SE', dan: 'da-DK', nor: 'nb-NO', fin: 'fi-FI',
      cat: 'ca-ES', eus: 'eu-ES', baq: 'eu-ES', glg: 'gl-ES', isl: 'is-IS',
      ice: 'is-IS', mlg: 'mg-MG', heb: 'he-IL', fas: 'fa-IR', per: 'fa-IR',
      lit: 'lt-LT', lav: 'lv-LV', est: 'et-EE', sqi: 'sq-AL', alb: 'sq-AL',
      bul: 'bg-BG', hrv: 'hr-HR', srp: 'sr-RS', slv: 'sl-SI', mkd: 'mk-MK',
      slk: 'sk-SK', slo: 'sk-SK', hye: 'hy-AM', arm: 'hy-AM', kat: 'ka-GE',
      geo: 'ka-GE', jav: 'jv-ID', sun: 'su-ID', ceb: 'ceb-PH', mri: 'mi-NZ',
      mao: 'mi-NZ'
    };
    const byName: Record<string, string> = {
      japanese: 'ja-JP', english: 'en-US', chinese: 'zh-CN', mandarin: 'zh-CN', 
      cantonese: 'yue-HK', spanish: 'es-ES', french: 'fr-FR', arabic: 'ar-XA', 
      german: 'de-DE', italian: 'it-IT', portuguese: 'pt-PT', russian: 'ru-RU', 
      korean: 'ko-KR', vietnamese: 'vi-VN', thai: 'th-TH', hindi: 'hi-IN',
      bengali: 'bn-IN', turkish: 'tr-TR', indonesian: 'id-ID', malay: 'ms-MY'
    };
    const key = (language || '').toLowerCase();
    return map[key] || byName[key] || 'en-US';
  }

  // 方言に応じた話速を取得
  private getRateForDialect(dialect?: string): number {
    const rates: Record<string, number> = {
      kansai: 1.1,
      hakata: 1.2,
      tsugaru: 0.9,
      american: 1.1,
      australian: 1.0,
      british: 1.0
    };

    return rates[dialect || 'standard'] || 1.0;
  }

  // 方言に応じた音高を取得
  private getPitchForDialect(dialect?: string): number {
    const pitches: Record<string, number> = {
      kansai: 1.05,
      hakata: 1.1,
      tsugaru: 0.95,
      american: 1.0,
      australian: 1.05,
      british: 1.0
    };

    return pitches[dialect || 'standard'] || 1.0;
  }

  // 利用可能な音声プロバイダーを取得
  getAvailableProviders(): string[] {
    const providers = ['webspeech'];
    if (this.isElevenLabsAvailable) {
      providers.unshift('elevenlabs');
    }
    if (this.isGoogleCloudAvailable) {
      providers.unshift('googlecloud'); // 最優先
    }
    return providers;
  }

  // 音声品質の比較
  async compareVoiceQuality(text: string, language: string, dialect?: string): Promise<{
    elevenlabs?: EnhancedVoiceResponse;
    webspeech?: EnhancedVoiceResponse;
  }> {
    const results: any = {};

    // ElevenLabs
    if (this.isElevenLabsAvailable) {
      try {
        results.elevenlabs = await this.generateWithElevenLabs(text, {
          text,
          language,
          dialect,
          useElevenLabs: true
        });
      } catch (error) {
        console.warn('ElevenLabs comparison failed:', error);
      }
    }

    // Web Speech API
    try {
      results.webspeech = await this.generateWithWebSpeech(text, {
        text,
        language,
        dialect,
        useElevenLabs: false
      });
    } catch (error) {
      console.warn('Web Speech comparison failed:', error);
    }

    return results;
  }
}

// シングルトンインスタンス
export const enhancedVoiceService = new EnhancedVoiceService();
