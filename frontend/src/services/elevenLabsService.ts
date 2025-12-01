import { resolveBackendBaseUrl } from './serviceConfig';

// ElevenLabs API統合サービス
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  available_for_tiers?: string[];
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface ElevenLabsRequest {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  pronunciation_dictionary_locators?: Array<{
    pronunciation_dictionary_id: string;
    version_id: string;
  }>;
  seed?: number;
  previous_text?: string;
  next_text?: string;
  previous_request_ids?: string[];
  next_request_ids?: string[];
}

export interface ElevenLabsResponse {
  audio: ArrayBuffer;
  content_type: string;
  request_id?: string;
}

const DEFAULT_BACKEND_BASE = resolveBackendBaseUrl();

interface ElevenLabsProxyResponse {
  success: boolean;
  audio?: string;
  content_type?: string;
  request_id?: string;
  error?: string;
  status?: number;
}

export class ElevenLabsService {
  private baseUrl: string;
  private availabilityCache: boolean | null = null;
  private availabilityPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string = DEFAULT_BACKEND_BASE) {
    this.baseUrl = baseUrl;
  }

  private get proxyBase(): string {
    return `${this.baseUrl}/api/tts/elevenlabs`;
  }

  private decodeAudio(base64Audio: string): ArrayBuffer {
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async checkAvailability(): Promise<boolean> {
    if (this.availabilityCache !== null) {
      return this.availabilityCache;
    }

    if (!this.availabilityPromise) {
      this.availabilityPromise = fetch(`${this.proxyBase}/status`)
        .then(async (response) => {
          if (!response.ok) {
            return false;
          }
          const data = await response.json();
          return Boolean(data?.enabled);
        })
        .catch(() => false)
        .then((enabled) => {
          this.availabilityCache = enabled;
          return enabled;
        })
        .finally(() => {
          this.availabilityPromise = null;
        });
    }

    return this.availabilityPromise;
  }

  // 利用可能な音声の一覧を取得
  async getVoices(): Promise<ElevenLabsVoice[]> {
    const response = await fetch(`${this.proxyBase}/voices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch voices (${response.status})`);
    }

    const data = await response.json();
    return data.voices || [];
  }

  // テキストを音声に変換
  async textToSpeech(request: ElevenLabsRequest): Promise<ElevenLabsResponse> {
    const response = await fetch(this.proxyBase, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data: ElevenLabsProxyResponse = await response.json().catch(() => ({
      success: false,
      error: 'Invalid response from ElevenLabs proxy',
    }));

    if (!response.ok || !data.success || !data.audio) {
      throw new Error(
        data.error ||
        `Text-to-speech failed${data.status ? `: ${data.status}` : ''}`
      );
    }

    const audioBuffer = this.decodeAudio(data.audio);
    return {
      audio: audioBuffer,
      content_type: data.content_type || 'audio/mpeg',
      request_id: data.request_id,
    };
  }

  // 音声をBlob URLに変換
  createAudioUrl(audioBuffer: ArrayBuffer, contentType: string): string {
    const blob = new Blob([audioBuffer], { type: contentType });
    return URL.createObjectURL(blob);
  }

  // 音声設定のプリセット
  getVoicePresets() {
    return {
      // 標準的な設定
      standard: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true,
      },
      // より安定した音声
      stable: {
        stability: 0.8,
        similarity_boost: 0.3,
        style: 0.0,
        use_speaker_boost: true,
      },
      // より表現豊かな音声
      expressive: {
        stability: 0.3,
        similarity_boost: 0.7,
        style: 0.5,
        use_speaker_boost: true,
      },
      // 方言用の設定
      dialect: {
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.3,
        use_speaker_boost: true,
      },
    };
  }

  // 言語・方言に適した音声設定を取得
  getVoiceSettingsForLanguage(language: string, dialect?: string): any {
    const presets = this.getVoicePresets();
    
    // 方言の場合は表現豊かな設定を使用
    if (dialect && dialect !== 'standard') {
      return presets.dialect;
    }
    
    // 言語に応じた設定
    switch (language.toLowerCase()) {
      case 'japanese':
      case 'chinese':
      case 'korean':
        return presets.stable; // アジア言語は安定した設定
      case 'english':
      case 'spanish':
      case 'french':
        return presets.expressive; // 欧米言語は表現豊かな設定
      default:
        return presets.standard;
    }
  }
}

// シングルトンインスタンス
export const elevenLabsService = new ElevenLabsService();
