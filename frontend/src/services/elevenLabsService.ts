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
  request_id: string;
}

export class ElevenLabsService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 利用可能な音声の一覧を取得
  async getVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  // テキストを音声に変換
  async textToSpeech(request: ElevenLabsRequest): Promise<ElevenLabsResponse> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${request.voice_id}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          model_id: request.model_id || 'eleven_multilingual_v2',
          voice_settings: request.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true,
          },
          ...(request.pronunciation_dictionary_locators && {
            pronunciation_dictionary_locators: request.pronunciation_dictionary_locators,
          }),
          ...(request.seed && { seed: request.seed }),
          ...(request.previous_text && { previous_text: request.previous_text }),
          ...(request.next_text && { next_text: request.next_text }),
          ...(request.previous_request_ids && { previous_request_ids: request.previous_request_ids }),
          ...(request.next_request_ids && { next_request_ids: request.next_request_ids }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Text-to-speech failed: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'audio/mpeg';

      return {
        audio: audioBuffer,
        content_type: contentType,
        request_id: response.headers.get('x-request-id') || '',
      };
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw error;
    }
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
