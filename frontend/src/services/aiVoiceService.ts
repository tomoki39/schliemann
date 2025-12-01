// AI音声変換サービスのインターフェース
export interface VoiceConversionRequest {
  text: string;
  sourceLanguage: string;
  targetDialect: string;
  voiceSettings?: {
    rate?: number;
    pitch?: number;
    volume?: number;
  };
  useSSML?: boolean;
  styleDegree?: number; // 0-2の範囲で方言の強度
  referenceVoiceId?: string;
  referenceAudioUrl?: string;
}

import { resolveBackendBaseUrl } from './serviceConfig';

export interface VoiceConversionResponse {
  success: boolean;
  audioData?: ArrayBuffer;
  audioUrl?: string;
  error?: string;
  duration?: number;
}

const DEFAULT_BASE_URL = resolveBackendBaseUrl();

// AI音声変換サービスのクラス
export class AIVoiceService {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async convertVoice(request: VoiceConversionRequest): Promise<VoiceConversionResponse> {
    try {
      // AI音声変換のみを使用
      const aiResponse = await this.callAIVoiceAPI(request);
      return aiResponse;
    } catch (error) {
      console.error('Voice conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI音声変換エラー',
      };
    }
  }

  private async callAIVoiceAPI(request: VoiceConversionRequest): Promise<VoiceConversionResponse> {
    try {
      const requestBody = {
        text: request.text,
        source_language: request.sourceLanguage,
        target_dialect: request.targetDialect,
        voice_settings: request.voiceSettings,
      };
      
      console.log('AI Voice API Request:', {
        url: `${this.baseUrl}/voice/convert`,
        method: 'POST',
        body: requestBody
      });
      
      const response = await fetch(`${this.baseUrl}/voice/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
            if (data.success) {
              // Base64エンコードされた音声データをBlobに変換
              const binaryString = atob(data.audio_data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              // MP3ファイルとして処理
              const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
              const audioUrl = URL.createObjectURL(audioBlob);
        
        return {
          success: true,
          audioData: data.audio_data,
          audioUrl,
          duration: data.duration,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Unknown API error',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }



  // 音声変換の状態をチェック
  async checkServiceStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // 利用可能な方言のリストを取得
  async getAvailableDialects(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/dialects`, {
        method: 'GET',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.dialects || [];
      }
      return [];
    } catch {
      return [];
    }
  }
}

// シングルトンインスタンス
export const aiVoiceService = new AIVoiceService();

