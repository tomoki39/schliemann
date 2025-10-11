/// <reference types="vite/client" />

// Google Cloud Text-to-Speech API サービス
export interface GoogleCloudTTSRequest {
  text: string;
  languageCode: string;
  voiceName?: string;
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
}

export interface GoogleCloudTTSVoice {
  languageCodes: string[];
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  naturalSampleRateHertz: number;
}

export class GoogleCloudTTSService {
  private apiKey: string;
  private baseUrl = 'https://texttospeech.googleapis.com/v1';
  private voices: GoogleCloudTTSVoice[] = [];
  private voicesLoaded = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_CLOUD_TTS_API_KEY || '';
    if (this.apiKey) {
      console.log('✅ Google Cloud TTS API Key found');
    } else {
      console.warn('⚠️ Google Cloud TTS API Key not found. Set VITE_GOOGLE_CLOUD_TTS_API_KEY in .env file');
    }
  }

  // APIキーが設定されているか確認
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  // 利用可能な音声リストを取得
  async loadVoices(): Promise<GoogleCloudTTSVoice[]> {
    if (this.voicesLoaded) {
      return this.voices;
    }

    if (!this.isAvailable()) {
      console.warn('Google Cloud TTS API key is not set');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices?key=${this.apiKey}`);
      if (!response.ok) {
        throw new Error(`Failed to load voices: ${response.statusText}`);
      }

      const data = await response.json();
      this.voices = data.voices || [];
      this.voicesLoaded = true;
      console.log(`✅ Google Cloud TTS: ${this.voices.length} voices loaded`);
      return this.voices;
    } catch (error) {
      console.error('Failed to load Google Cloud TTS voices:', error);
      return [];
    }
  }

  // 言語コードに最適な音声を選択
  selectVoice(languageCode: string, preferredGender?: 'MALE' | 'FEMALE' | 'NEUTRAL'): GoogleCloudTTSVoice | null {
    if (this.voices.length === 0) {
      console.warn('Voices not loaded yet. Call loadVoices() first.');
      return null;
    }

    // 1. 完全一致 + WaveNet/Neural音声を優先
    let voice = this.voices.find(v => 
      v.languageCodes.includes(languageCode) &&
      (v.name.includes('Wavenet') || v.name.includes('Neural')) &&
      (!preferredGender || v.ssmlGender === preferredGender)
    );

    // 2. 完全一致 + 性別指定
    if (!voice && preferredGender) {
      voice = this.voices.find(v => 
        v.languageCodes.includes(languageCode) &&
        v.ssmlGender === preferredGender
      );
    }

    // 3. 完全一致（性別不問）
    if (!voice) {
      voice = this.voices.find(v => v.languageCodes.includes(languageCode));
    }

    // 4. 言語コードの前半一致（例: en-US → en）
    if (!voice) {
      const langPrefix = languageCode.split('-')[0];
      voice = this.voices.find(v => 
        v.languageCodes.some(lc => lc.startsWith(langPrefix)) &&
        (v.name.includes('Wavenet') || v.name.includes('Neural'))
      );
    }

    if (!voice) {
      const langPrefix = languageCode.split('-')[0];
      voice = this.voices.find(v => 
        v.languageCodes.some(lc => lc.startsWith(langPrefix))
      );
    }

    return voice || null;
  }

  // テキストを音声に変換
  async synthesizeSpeech(request: GoogleCloudTTSRequest): Promise<string | null> {
    if (!this.isAvailable()) {
      console.warn('Google Cloud TTS API key is not set');
      return null;
    }

    // 音声リストが読み込まれていない場合は読み込む
    if (!this.voicesLoaded) {
      await this.loadVoices();
    }

    // 音声を選択
    const selectedVoice = request.voiceName 
      ? this.voices.find(v => v.name === request.voiceName)
      : this.selectVoice(request.languageCode, request.ssmlGender);

    if (!selectedVoice) {
      console.warn(`No voice found for language: ${request.languageCode}`);
      return null;
    }

    try {
      const requestBody = {
        input: { text: request.text },
        voice: {
          languageCode: request.languageCode,
          name: selectedVoice.name,
          ssmlGender: request.ssmlGender || selectedVoice.ssmlGender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: request.speakingRate || 1.0,
          pitch: request.pitch || 0,
          volumeGainDb: request.volumeGainDb || 0
        }
      };

      console.log(`🎤 Google Cloud TTS synthesizing:`, {
        voice: selectedVoice.name,
        language: request.languageCode,
        text: request.text.substring(0, 50) + '...'
      });

      const response = await fetch(`${this.baseUrl}/text:synthesize?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Base64エンコードされた音声データを返す
      return data.audioContent || null;
    } catch (error) {
      console.error('Google Cloud TTS synthesis failed:', error);
      return null;
    }
  }

  // Base64音声データを再生
  async playAudioContent(audioContent: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Base64をBlobに変換
        const binaryString = atob(audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);

        // Audioオブジェクトで再生
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = (error) => {
          URL.revokeObjectURL(url);
          reject(error);
        };
        audio.play();
      } catch (error) {
        reject(error);
      }
    });
  }

  // テキストを音声に変換して再生（統合メソッド）
  async speak(request: GoogleCloudTTSRequest): Promise<boolean> {
    try {
      const audioContent = await this.synthesizeSpeech(request);
      if (!audioContent) {
        return false;
      }

      await this.playAudioContent(audioContent);
      return true;
    } catch (error) {
      console.error('Failed to speak with Google Cloud TTS:', error);
      return false;
    }
  }

  // デバッグ用: 特定言語の利用可能な音声を表示
  async listVoicesForLanguage(languageCode: string): Promise<void> {
    if (!this.voicesLoaded) {
      await this.loadVoices();
    }

    const langPrefix = languageCode.split('-')[0];
    const matchingVoices = this.voices.filter(v => 
      v.languageCodes.some(lc => lc.startsWith(langPrefix))
    );

    console.log(`🎤 Google Cloud TTS voices for "${languageCode}":`);
    matchingVoices.forEach(v => {
      const quality = v.name.includes('Wavenet') ? '⭐⭐⭐' : v.name.includes('Neural') ? '⭐⭐' : '⭐';
      console.log(`  ${quality} ${v.name} - ${v.ssmlGender} (${v.languageCodes.join(', ')})`);
    });
  }
}

// シングルトンインスタンス
export const googleCloudTTSService = new GoogleCloudTTSService();
