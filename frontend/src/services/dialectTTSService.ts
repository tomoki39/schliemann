/**
 * 方言TTSサービス
 * 標準語と上海語の使い分けができる音声合成サービス
 */

import { googleCloudTTSService } from './googleCloudTTSService';

export interface DialectTTSConfig {
  googleCloudApiKey: string;
  googleCloudProjectId: string;
  voiceConversionEnabled: boolean;
  autoDialectDetection: boolean;
  confidenceThreshold: number;
}

export interface TTSResult {
  success: boolean;
  audioData?: ArrayBuffer;
  dialect: string;
  provider: string;
  text: string;
  converted?: boolean;
  error?: string;
}

export interface DialectInfo {
  name: string;
  vocabularyCount: number;
  grammarCount: number;
  pronunciationFeatures: string[];
  uniqueExpressions: string[];
}

class DialectTTSService {
  private config: DialectTTSConfig;
  private isInitialized: boolean = false;

  constructor(config: DialectTTSConfig) {
    this.config = config;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Google Cloud TTSサービスの音声リストを読み込み
      await googleCloudTTSService.loadVoices();
      
      this.isInitialized = true;
      console.log('方言TTSサービスを初期化しました');
    } catch (error) {
      console.error('方言TTSサービス初期化エラー:', error);
      throw error;
    }
  }

  /**
   * テキストを音声合成
   * @param text 合成するテキスト
   * @param dialect 指定する方言（'auto', 'standard', 'shanghai'）
   * @param forceDialect 強制的に方言変換を適用するか
   * @returns 音声合成結果
   */
  async synthesize(
    text: string,
    dialect: 'auto' | 'standard' | 'shanghai' = 'auto',
    forceDialect: boolean = false
  ): Promise<TTSResult> {
    if (!this.isInitialized) {
      throw new Error('TTSサービスが初期化されていません');
    }

    try {
      // 方言を判定
      const detectedDialect = dialect === 'auto' 
        ? this.detectDialect(text)
        : dialect;

      console.log(`音声合成開始: "${text}" (方言: ${detectedDialect})`);

      // 方言に応じて音声合成
      if (detectedDialect === 'shanghai') {
        return await this.synthesizeShanghai(text, forceDialect);
      } else {
        return await this.synthesizeStandard(text);
      }
    } catch (error) {
      console.error('音声合成エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        dialect: dialect,
        provider: 'unknown',
        text: text
      };
    }
  }

  /**
   * 標準語で音声合成
   */
  private async synthesizeStandard(text: string): Promise<TTSResult> {
    try {
      const audioData = await googleCloudTTSService.synthesizeSpeech({
        text: text,
        languageCode: 'cmn-CN',
        voiceName: 'cmn-CN-Wavenet-A',
        ssmlGender: 'NEUTRAL',
        speakingRate: 1.0,
        pitch: 0.0,
        volumeGainDb: 0.0
      });

      return {
        success: true,
        audioData: audioData,
        dialect: 'standard',
        provider: 'google_cloud_tts',
        text: text
      };
    } catch (error) {
      console.error('標準語音声合成エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Standard TTS error',
        dialect: 'standard',
        provider: 'google_cloud_tts',
        text: text
      };
    }
  }

  /**
   * 上海語で音声合成
   */
  private async synthesizeShanghai(text: string, forceDialect: boolean = false): Promise<TTSResult> {
    try {
      // 1. 標準語で音声合成
      const standardResult = await this.synthesizeStandard(text);
      
      if (!standardResult.success) {
        return standardResult;
      }

      // 2. 上海語に変換（音声変換が有効な場合）
      if (this.config.voiceConversionEnabled && (forceDialect || this.shouldConvertToDialect(text))) {
        try {
          // 音声変換を適用
          const convertedAudio = await this.convertToShanghaiDialect(
            standardResult.audioData!,
            text
          );

          return {
            success: true,
            audioData: convertedAudio,
            dialect: 'shanghai',
            provider: 'google_cloud_tts + voice_conversion',
            text: text,
            converted: true
          };
        } catch (error) {
          console.warn('音声変換エラー、標準語音声を返します:', error);
          return {
            ...standardResult,
            dialect: 'shanghai',
            converted: false
          };
        }
      } else {
        // 音声変換なしで標準語音声を返す
        return {
          ...standardResult,
          dialect: 'shanghai',
          converted: false
        };
      }
    } catch (error) {
      console.error('上海語音声合成エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Shanghai TTS error',
        dialect: 'shanghai',
        provider: 'unknown',
        text: text
      };
    }
  }

  /**
   * 方言を自動判定
   */
  private detectDialect(text: string): 'standard' | 'shanghai' {
    if (!this.config.autoDialectDetection) {
      return 'standard';
    }

    // 上海語特有の語彙パターン
    const shanghaiPatterns = [
      '侬', '阿拉', '今朝', '蛮好', '再会', '啥', '哪能',
      '啥地方', '谢谢侬', '做生活', '困觉', '屋里', '学堂',
      '伊', '伊拉', '个', '个能', '个么', '个辰光'
    ];

    // 標準語の特徴
    const standardPatterns = [
      '你好', '今天', '很好', '我们', '你们', '什么', '怎么',
      '哪里', '谢谢', '再见', '吃饭', '睡觉', '工作', '学习'
    ];

    // スコア計算
    const shanghaiScore = shanghaiPatterns.reduce((score, pattern) => 
      score + (text.includes(pattern) ? 1 : 0), 0
    );
    
    const standardScore = standardPatterns.reduce((score, pattern) => 
      score + (text.includes(pattern) ? 1 : 0), 0
    );

    // 信頼度チェック
    const totalScore = shanghaiScore + standardScore;
    if (totalScore === 0) {
      return 'standard'; // デフォルト
    }

    const confidence = Math.max(shanghaiScore, standardScore) / totalScore;
    
    if (confidence < this.config.confidenceThreshold) {
      return 'standard'; // 信頼度が低い場合は標準語
    }

    return shanghaiScore > standardScore ? 'shanghai' : 'standard';
  }

  /**
   * 方言変換を適用すべきか判定
   */
  private shouldConvertToDialect(text: string): boolean {
    const shanghaiIndicators = ['侬', '阿拉', '今朝', '蛮好', '啥', '哪能', '啥地方', '谢谢侬'];
    return shanghaiIndicators.some(indicator => text.includes(indicator));
  }

  /**
   * 音声を上海語方言に変換
   */
  private async convertToShanghaiDialect(audioData: ArrayBuffer, text: string): Promise<ArrayBuffer> {
    // 実際の実装では、バックエンドの音声変換APIを呼び出す
    // ここでは簡易実装として、音声データをそのまま返す
    
    console.log('上海語音声変換を適用:', text);
    
    // TODO: バックエンドの音声変換APIを呼び出し
    // const response = await fetch('/api/voice-conversion', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     audioData: Array.from(new Uint8Array(audioData)),
    //     text: text,
    //     targetDialect: 'shanghai'
    //   })
    // });
    // 
    // const result = await response.json();
    // return new ArrayBuffer(result.audioData.length);
    
    // 簡易実装：元の音声データを返す
    return audioData;
  }

  /**
   * サポートされている方言のリストを取得
   */
  getSupportedDialects(): string[] {
    return ['standard', 'shanghai'];
  }

  /**
   * 方言の詳細情報を取得
   */
  getDialectInfo(dialect: string): DialectInfo | null {
    const dialectInfos: Record<string, DialectInfo> = {
      'shanghai': {
        name: 'shanghai',
        vocabularyCount: 20,
        grammarCount: 10,
        pronunciationFeatures: ['zh→z', 'ch→c', 'sh→s', 'r→l'],
        uniqueExpressions: ['侬好', '今朝', '蛮好', '阿拉', '伊拉']
      },
      'standard': {
        name: 'standard',
        vocabularyCount: 20,
        grammarCount: 10,
        pronunciationFeatures: ['zh', 'ch', 'sh', 'r'],
        uniqueExpressions: ['你好', '今天', '很好', '我们', '你们']
      }
    };

    return dialectInfos[dialect] || null;
  }

  /**
   * テキストを指定された方言に変換する提案
   */
  suggestTextConversion(text: string, targetDialect: string): string {
    const conversionRules: Record<string, Record<string, string>> = {
      'shanghai': {
        '你好': '侬好',
        '今天': '今朝',
        '很好': '蛮好',
        '我们': '阿拉',
        '你们': '侬拉',
        '什么': '啥',
        '怎么': '哪能',
        '哪里': '啥地方',
        '谢谢': '谢谢侬',
        '再见': '再会',
        '吃饭': '吃饭',
        '睡觉': '困觉',
        '工作': '做生活',
        '学习': '读书',
        '朋友': '朋友',
        '家': '屋里',
        '学校': '学堂',
        '医院': '医院',
        '商店': '店',
        '银行': '银行'
      }
    };

    if (targetDialect === 'standard' || !conversionRules[targetDialect]) {
      return text;
    }

    let convertedText = text;
    const rules = conversionRules[targetDialect];

    for (const [standard, dialect] of Object.entries(rules)) {
      convertedText = convertedText.replace(standard, dialect);
    }

    return convertedText;
  }

  /**
   * 複数のテキストを一括音声合成
   */
  async batchSynthesize(
    texts: string[],
    dialect: 'auto' | 'standard' | 'shanghai' = 'auto'
  ): Promise<TTSResult[]> {
    const results: TTSResult[] = [];

    for (const text of texts) {
      const result = await this.synthesize(text, dialect);
      results.push(result);
    }

    return results;
  }
}

// シングルトンインスタンス
let dialectTTSService: DialectTTSService | null = null;

/**
 * 方言TTSサービスを初期化
 */
export function initializeDialectTTS(config: DialectTTSConfig): DialectTTSService {
  dialectTTSService = new DialectTTSService(config);
  return dialectTTSService;
}

/**
 * 方言TTSサービスを取得
 */
export function getDialectTTS(): DialectTTSService {
  if (!dialectTTSService) {
    throw new Error('方言TTSサービスが初期化されていません');
  }
  return dialectTTSService;
}

/**
 * テキストを音声合成（便利関数）
 */
export async function synthesizeDialectText(
  text: string,
  dialect: 'auto' | 'standard' | 'shanghai' = 'auto'
): Promise<TTSResult> {
  const tts = getDialectTTS();
  return await tts.synthesize(text, dialect);
}

// 簡易版の方言TTS関数（モック実装）
export async function synthesizeDialectTextSimple(text: string, dialect: 'auto' | 'standard' | 'shanghai' = 'auto', onEnd?: () => void): Promise<DialectTTSResponse> {
  try {
    console.log(`🗣️ 方言TTS簡易版: ${text} (方言: ${dialect})`);
    
    // 上海語の場合は特別な処理
    if (dialect === 'shanghai') {
      console.log('🎭 上海語モック音声を生成中...');
      
      // 上海語の語彙変換を適用
      const shanghaiText = convertToShanghai(text);
      console.log(`🗣️ 上海語変換: "${text}" → "${shanghaiText}"`);
      
      // モック音声データを生成（実際にはGoogle Cloud TTSを使用）
      const mockAudioData = await generateMockShanghaiAudio(shanghaiText, onEnd);
      
      return {
        success: true,
        audioData: mockAudioData,
        provider: 'dialect_tts',
        dialect: 'shanghai'
      };
    }
    
    // その他の方言は通常のTTSを使用
    return {
      success: false,
      error: 'この方言はまだサポートされていません'
    };
  } catch (error: any) {
    console.warn('方言TTSエラー:', error.message);
    return {
      success: false,
      error: `方言TTSエラー: ${error.message}`
    };
  }
}

// 上海語への語彙・音韻変換
function convertToShanghai(text: string): string {
  // 語彙変換（上海語の特徴的な語彙）
  const vocabularyConversions: Record<string, string> = {
    // 基本挨拶
    '你好': '侬好',
    '谢谢': '谢谢侬',
    '再见': '再会',
    '对不起': '对勿起',
    '没关系': '呒没关系',
    
    // 時間・場所
    '今天': '今朝',
    '明天': '明朝',
    '昨天': '昨日子',
    '现在': '现在',
    '这里': '搿搭',
    '那里': '伊搭',
    '哪里': '啥地方',
    
    // 人称代詞
    '我们': '阿拉',
    '你们': '侬拉',
    '他们': '伊拉',
    '我': '我',
    '你': '侬',
    '他': '伊',
    
    // 疑問詞
    '什么': '啥',
    '怎么': '哪能',
    '为什么': '为啥',
    '多少': '几化',
    '什么时候': '啥辰光',
    
    // 形容詞・副詞
    '很好': '蛮好',
    '很': '蛮',
    '非常': '老',
    '太': '忒',
    '的': '个',
    '了': '了',
    
    // 動詞
    '吃饭': '做生活',
    '睡觉': '困觉',
    '工作': '做生活',
    '学习': '读书',
    '玩': '白相',
    '看': '看',
    '听': '听',
    '说': '讲',
    
    // 名詞
    '家': '屋里',
    '学校': '学堂',
    '朋友': '朋友',
    '老师': '老师',
    '学生': '学生',
    '天气': '天气',
    '钱': '钞票',
    '时间': '辰光',
    
    // 感嘆詞・語気詞
    '啊': '啊',
    '呀': '呀',
    '哦': '哦',
    '嗯': '嗯',
    '。': '。',
    '！': '！',
    '？': '？'
  };
  
  // 音韻変換（上海語の特徴的な発音変化）
  const phoneticConversions: Record<string, string> = {
    // 声母変化（巻舌音の平舌化）
    'zh': 'z',  // zh → z
    'ch': 'c',  // ch → c
    'sh': 's',  // sh → s
    'r': 'l',   // r → l
    
    // 韻母変化（前鼻音の後鼻音化）
    'an': 'ang', // an → ang
    'en': 'eng', // en → eng
    'in': 'ing', // in → ing
    
    // 上海語特有の音韻変化
    'ui': 'uei', // ui → uei
    'iu': 'iou', // iu → iou
    'un': 'uen', // un → uen
    
    // 声調変化（上海語の5声調）
    '一': '一', // 陰平 → 陽平
    '二': '二', // 陽平 → 上声
    '三': '三', // 上声 → 去声
    '四': '四', // 去声 → 陰平
    '五': '五', // 入声 → 陽平
  };
  
  let converted = text;
  
  // 語彙変換を適用
  for (const [standard, shanghai] of Object.entries(vocabularyConversions)) {
    converted = converted.replace(new RegExp(standard, 'g'), shanghai);
  }
  
  // 音韻変換を適用（簡略化された例）
  for (const [standard, shanghai] of Object.entries(phoneticConversions)) {
    converted = converted.replace(new RegExp(standard, 'g'), shanghai);
  }
  
  return converted;
}

// 上海語SSML生成
function generateShanghaiSSML(text: string): string {
  // 上海語の特徴的な音声パターンをSSMLで表現
  let ssml = `<speak>`;
  
  // 文を分割して処理
  const sentences = text.split(/[。！？]/);
  
  sentences.forEach((sentence, index) => {
    if (sentence.trim()) {
      // 上海語の特徴的な音声パターンを適用
      let processedSentence = sentence.trim();
      
      // 上海語特有の語彙の音調調整
      if (processedSentence.includes('侬') || processedSentence.includes('阿拉') || processedSentence.includes('伊拉')) {
        processedSentence = processedSentence.replace(/(侬|阿拉|伊拉)/g, '<prosody pitch="+12%" rate="0.85">$1</prosody>');
      }
      
      // 疑問詞の音調調整（上海語の疑問詞は音高が高い）
      if (processedSentence.includes('啥') || processedSentence.includes('哪能') || processedSentence.includes('为啥')) {
        processedSentence = processedSentence.replace(/(啥|哪能|为啥)/g, '<prosody pitch="+18%" rate="0.9">$1</prosody>');
      }
      
      // 語尾の音調調整（上海語は語尾が上がる傾向）
      if (processedSentence.endsWith('好') || processedSentence.endsWith('吗') || processedSentence.endsWith('呢')) {
        processedSentence = `<prosody pitch="+20%" rate="0.8">${processedSentence}</prosody>`;
      }
      
      // 感嘆詞の音調調整（上海語の感嘆詞は特徴的）
      if (processedSentence.includes('啊') || processedSentence.includes('呀') || processedSentence.includes('哦')) {
        processedSentence = processedSentence.replace(/(啊|呀|哦)/g, '<prosody pitch="+25%" rate="0.7">$1</prosody>');
      }
      
      // 上海語特有の語気詞の調整
      if (processedSentence.includes('个') || processedSentence.includes('了') || processedSentence.includes('蛮')) {
        processedSentence = processedSentence.replace(/(个|了|蛮)/g, '<prosody pitch="+8%" rate="0.8">$1</prosody>');
      }
      
      // 全体の音調調整（上海語は全体的に音高が高く、リズムが特徴的）
      processedSentence = `<prosody pitch="+10%" rate="0.75" volume="loud">${processedSentence}</prosody>`;
      
      ssml += processedSentence;
      
      // 文の終わりに適切な区切りを追加（上海語は区切りが短い）
      if (index < sentences.length - 1) {
        ssml += '<break time="0.3s"/>';
      }
    }
  });
  
  ssml += `</speak>`;
  
  console.log('🎭 上海語SSML生成:', ssml);
  return ssml;
}

// 上海語音声生成（直接音声再生）
async function generateMockShanghaiAudio(text: string, onEnd?: () => void): Promise<ArrayBuffer> {
  try {
    console.log('🎵 Google Cloud TTSで上海語音声を生成中...');
    
    // SSMLを使用して上海語風の音声を生成
    const ssmlText = generateShanghaiSSML(text);
    
    const audioContent = await googleCloudTTSService.synthesizeSpeech({
      text: ssmlText,
      languageCode: 'cmn-CN',
      voiceName: 'cmn-CN-Wavenet-A',
      ssmlGender: 'FEMALE',
      speakingRate: 1.0, // SSML内で制御するため1.0に設定
      pitch: 1.0, // SSML内で制御するため1.0に設定
      volumeGainDb: 0.0, // SSML内で制御するため0.0に設定
      useSSML: true // SSMLを使用することを明示
    });
    
    if (!audioContent) {
      throw new Error('音声生成に失敗しました');
    }
    
    // Base64エンコードされた音声データを直接再生
    const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
    
    return new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => {
        console.log('✅ 上海語音声生成完了');
        
        // 音声を再生
        audio.play().catch(playError => {
          console.error('音声再生エラー:', playError);
          reject(playError);
        });
        
        // 再生終了時のコールバックを設定
        audio.addEventListener('ended', () => {
          console.log('🎵 上海語音声再生完了');
          if (onEnd) {
            onEnd();
          }
        });
        
        // モックのArrayBufferを返す（実際の再生は上記で実行）
        resolve(new ArrayBuffer(1024));
      });
      
      audio.addEventListener('error', (error) => {
        console.error('音声読み込みエラー:', error);
        reject(error);
      });
      
      audio.load();
    });
  } catch (error) {
    console.warn('Google Cloud TTS失敗、Web Speech APIを使用:', error);
    
    // フォールバック: Web Speech APIを使用
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'cmn-CN';
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      
      utterance.onstart = () => {
        console.log('🎵 Web Speech APIで上海語音声合成開始');
      };
      
      utterance.onend = () => {
        console.log('🎵 Web Speech APIで上海語音声合成完了');
        if (onEnd) {
          onEnd();
        }
        const mockData = new ArrayBuffer(1024);
        resolve(mockData);
      };
      
      utterance.onerror = (error) => {
        console.error('音声合成エラー:', error);
        reject(error);
      };
      
      speechSynthesis.speak(utterance);
    });
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default DialectTTSService;
