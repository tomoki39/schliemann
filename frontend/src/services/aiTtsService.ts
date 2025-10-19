/**
 * AI音声変換TTSサービス
 * バックエンドのAI音声変換システムと連携
 */

export interface AITTSRequest {
  text: string;
  dialect: string;
}

export interface AITTSResponse {
  success: boolean;
  audio_path?: string;
  audio_info?: {
    duration: number;
    sample_rate: number;
    rms: number;
    peak: number;
    dominant_frequency: number;
    length_samples: number;
  };
  text?: string;
  dialect?: string;
  error?: string;
}

export interface TextConversionRequest {
  text: string;
}

export interface TextConversionResponse {
  success: boolean;
  original: string;
  shanghai: string;
  changed: boolean;
  error?: string;
}

export interface ModelStatusResponse {
  success: boolean;
  model_loaded: boolean;
  device: string;
  sample_rate: number;
  vocabulary_count: number;
  error?: string;
}

class AITtsService {
  private baseUrl: string;
  private isInitialized: boolean = false;

  constructor() {
    // バックエンドサーバーのURL
    this.baseUrl = 'http://localhost:5002';
  }

  /**
   * サービスが利用可能かチェック
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      this.isInitialized = data.status === 'healthy';
      return this.isInitialized;
    } catch (error) {
      console.error('AI TTS ヘルスチェックエラー:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * テキストを上海語に変換
   */
  async convertText(request: TextConversionRequest): Promise<TextConversionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/convert-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('テキスト変換エラー:', error);
      return {
        success: false,
        original: request.text,
        shanghai: request.text,
        changed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * AI音声変換で音声を合成
   */
  async synthesizeSpeech(request: AITTSRequest): Promise<AITTSResponse> {
    try {
      // まずヘルスチェック
      if (!this.isInitialized) {
        const isHealthy = await this.checkHealth();
        if (!isHealthy) {
          throw new Error('AI TTS サービスが利用できません');
        }
      }

      const response = await fetch(`${this.baseUrl}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI音声合成エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 音声ファイルを取得
   */
  async getAudioFile(audioPath: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/audio/${audioPath}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('音声ファイル取得エラー:', error);
      throw error;
    }
  }

  /**
   * モデルの状態を取得
   */
  async getModelStatus(): Promise<ModelStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/model-status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('モデル状態取得エラー:', error);
      return {
        success: false,
        model_loaded: false,
        device: 'unknown',
        sample_rate: 22050,
        vocabulary_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 音声を再生
   */
  async playAudio(audioBlob: Blob, onEnd?: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(audioBlob);

      audio.src = url;
      audio.volume = 1.0;

      audio.onloadeddata = () => {
        console.log('🎵 AI音声読み込み完了');
        audio.play().catch(playError => {
          console.error('音声再生エラー:', playError);
          reject(playError);
        });
      };

      audio.onended = () => {
        console.log('🎵 AI音声再生完了');
        URL.revokeObjectURL(url);
        if (onEnd) {
          onEnd();
        }
        resolve();
      };

      audio.onerror = (error) => {
        console.error('音声読み込みエラー:', error);
        URL.revokeObjectURL(url);
        reject(error);
      };
    });
  }

  /**
   * 方言音声を合成して再生
   */
  async synthesizeAndPlay(text: string, dialect: string = 'shanghai', onEnd?: () => void): Promise<boolean> {
    try {
      console.log(`🤖 AI音声変換で音声合成開始 (${dialect}):`, text);

      // 音声合成
      const synthesisResult = await this.synthesizeSpeech({
        text: text,
        dialect: dialect,
      });

      if (!synthesisResult.success || !synthesisResult.audio_path) {
        throw new Error(synthesisResult.error || '音声合成に失敗しました');
      }

      console.log('✅ AI音声合成完了:', synthesisResult.audio_info);

      // 音声ファイルを取得
      const audioBlob = await this.getAudioFile(synthesisResult.audio_path);

      // 音声を再生
      await this.playAudio(audioBlob, onEnd);

      return true;
    } catch (error) {
      console.error('AI音声合成・再生エラー:', error);
      return false;
    }
  }

  /**
   * サービスが利用可能かどうか
   */
  get isAvailable(): boolean {
    return this.isInitialized;
  }
}

// シングルトンインスタンス
export const aiTtsService = new AITtsService();

// デフォルトエクスポート
export default aiTtsService;
