// SSML（Speech Synthesis Markup Language）ビルダー
export interface SSMLOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  language?: string;
  emphasis?: 'strong' | 'moderate' | 'reduced';
  break?: number; // ミリ秒
  prosody?: {
    rate?: number;
    pitch?: number;
    volume?: number;
  };
}

export class SSMLBuilder {
  private text: string;
  private options: SSMLOptions;

  constructor(text: string, options: SSMLOptions = {}) {
    this.text = text;
    this.options = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      language: 'ja-JP',
      ...options
    };
  }

  // 方言特化のSSML生成
  static forDialect(text: string, dialect: string, language: string = 'japanese'): string {
    const dialectSettings = getDialectSSMLSettings(dialect, language);
    const builder = new SSMLBuilder(text, dialectSettings);
    return builder.build();
  }

  // 基本SSML生成
  build(): string {
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${this.options.language}">`;
    
    // プロソディ設定
    if (this.options.prosody) {
      ssml += `<prosody`;
      if (this.options.prosody.rate) ssml += ` rate="${this.options.prosody.rate}"`;
      if (this.options.prosody.pitch) ssml += ` pitch="${this.options.prosody.pitch}"`;
      if (this.options.prosody.volume) ssml += ` volume="${this.options.prosody.volume}"`;
      ssml += `>`;
    }

    // テキスト処理
    let processedText = this.text;
    
    // 句読点の処理
    processedText = processedText.replace(/、/g, '<break time="200ms"/>');
    processedText = processedText.replace(/。/g, '<break time="500ms"/>');
    processedText = processedText.replace(/！/g, '<break time="300ms"/>');
    processedText = processedText.replace(/？/g, '<break time="300ms"/>');
    
    // 方言特有の処理
    processedText = this.applyDialectProcessing(processedText);
    
    ssml += processedText;
    
    if (this.options.prosody) {
      ssml += `</prosody>`;
    }
    
    ssml += `</speak>`;
    return ssml;
  }

  // 方言特有の処理
  private applyDialectProcessing(text: string): string {
    // 方言特有の語尾や表現を強調
    const dialectPatterns = [
      { pattern: /やなあ/g, replacement: '<emphasis level="strong">やなあ</emphasis>' },
      { pattern: /ばい/g, replacement: '<emphasis level="moderate">ばい</emphasis>' },
      { pattern: /だべ/g, replacement: '<emphasis level="moderate">だべ</emphasis>' },
      { pattern: /じゃ/g, replacement: '<emphasis level="moderate">じゃ</emphasis>' },
    ];

    let processed = text;
    dialectPatterns.forEach(({ pattern, replacement }) => {
      processed = processed.replace(pattern, replacement);
    });

    return processed;
  }
}

// 方言別SSML設定
function getDialectSSMLSettings(dialect: string, language: string = 'japanese'): SSMLOptions {
  const languageCode = getLanguageCode(language);
  
  const settings: Record<string, Record<string, SSMLOptions>> = {
    japanese: {
      standard: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        language: languageCode,
        prosody: { rate: 1.0, pitch: 1.0, volume: 1.0 }
      },
      kansai: {
        rate: 1.1,
        pitch: 1.05,
        volume: 1.0,
        language: languageCode,
        prosody: { rate: 1.1, pitch: 1.05, volume: 1.0 }
      },
      hakata: {
        rate: 1.2,
        pitch: 1.1,
        volume: 1.0,
        language: languageCode,
        prosody: { rate: 1.2, pitch: 1.1, volume: 1.0 }
      },
      tsugaru: {
        rate: 0.9,
        pitch: 0.95,
        volume: 1.0,
        language: languageCode,
        prosody: { rate: 0.9, pitch: 0.95, volume: 1.0 }
      },
      okinawa: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        language: languageCode,
        prosody: { rate: 1.0, pitch: 1.0, volume: 1.0 }
      }
    },
    english: {
      standard: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        language: languageCode,
        prosody: { rate: 1.0, pitch: 1.0, volume: 1.0 }
      },
      british: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        language: languageCode,
        prosody: { rate: 1.0, pitch: 1.0, volume: 1.0 }
      },
      american: {
        rate: 1.1,
        pitch: 1.0,
        volume: 1.0,
        language: languageCode,
        prosody: { rate: 1.1, pitch: 1.0, volume: 1.0 }
      },
      australian: {
        rate: 1.0,
        pitch: 1.05,
        volume: 1.0,
        language: languageCode,
        prosody: { rate: 1.0, pitch: 1.05, volume: 1.0 }
      }
    }
  };

  return settings[language]?.[dialect] || settings[language]?.standard || settings.japanese.standard;
}

// 言語コード取得
function getLanguageCode(language: string): string {
  const codes: Record<string, string> = {
    japanese: 'ja-JP',
    english: 'en-US',
    chinese: 'zh-CN',
    spanish: 'es-ES',
    french: 'fr-FR',
    arabic: 'ar-SA',
    german: 'de-DE',
    italian: 'it-IT',
    portuguese: 'pt-BR',
    russian: 'ru-RU',
    korean: 'ko-KR'
  };

  return codes[language] || 'en-US';
}

// G2P（Grapheme-to-Phoneme）変換の簡易実装
export class G2PConverter {
  // ひらがなから音素への変換テーブル（簡易版）
  private static readonly hiraganaToPhoneme: Record<string, string> = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n'
  };

  // テキストを音素に変換
  static convertToPhonemes(text: string): string {
    let result = '';
    for (const char of text) {
      if (this.hiraganaToPhoneme[char]) {
        result += this.hiraganaToPhoneme[char];
      } else {
        result += char; // 変換できない文字はそのまま
      }
    }
    return result;
  }

  // 方言特有の発音変換
  static convertToDialectPhonemes(text: string, dialect: string): string {
    let phonemes = this.convertToPhonemes(text);
    
    switch (dialect) {
      case 'kansai':
        // 関西弁特有の発音変換
        phonemes = phonemes.replace(/shi/g, 'shi'); // し → し（そのまま）
        phonemes = phonemes.replace(/su/g, 'su'); // す → す（そのまま）
        break;
      case 'hakata':
        // 博多弁特有の発音変換
        phonemes = phonemes.replace(/shi/g, 'shi'); // し → し（そのまま）
        phonemes = phonemes.replace(/su/g, 'su'); // す → す（そのまま）
        break;
      case 'tsugaru':
        // 津軽弁特有の発音変換
        phonemes = phonemes.replace(/shi/g, 'shi'); // し → し（そのまま）
        phonemes = phonemes.replace(/su/g, 'su'); // す → す（そのまま）
        break;
    }
    
    return phonemes;
  }
}

// 音声品質向上のための統合サービス
export class VoiceQualityService {
  // SSML + G2P を組み合わせた高品質音声生成
  static generateHighQualityVoice(text: string, dialect: string, language: string = 'japanese'): string {
    // 1. 方言辞書を適用
    const dialectText = this.applyDialectDictionary(text, dialect);
    
    // 2. G2P変換で発音を最適化
    const phonemes = G2PConverter.convertToDialectPhonemes(dialectText, dialect);
    
    // 3. SSMLで韻律を制御
    const ssml = SSMLBuilder.forDialect(phonemes, dialect, language);
    
    return ssml;
  }

  // 多言語対応のSSML生成
  static generateMultilingualSSML(text: string, language: string, dialect?: string): string {
    const languageSettings = this.getLanguageSettings(language);
    const dialectSettings = dialect ? this.getDialectSettings(language, dialect) : {};
    
    const options: SSMLOptions = {
      ...languageSettings,
      ...dialectSettings,
      language: this.getLanguageCode(language),
    };

    const builder = new SSMLBuilder(text, options);
    return builder.build();
  }

  // 言語別設定
  private static getLanguageSettings(language: string): SSMLOptions {
    const settings: Record<string, SSMLOptions> = {
      japanese: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        language: 'ja-JP',
        prosody: { rate: 1.0, pitch: 1.0, volume: 1.0 }
      },
      english: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        language: 'en-US',
        prosody: { rate: 1.0, pitch: 1.0, volume: 1.0 }
      },
      chinese: {
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
        language: 'zh-CN',
        prosody: { rate: 0.9, pitch: 1.0, volume: 1.0 }
      },
      spanish: {
        rate: 1.1,
        pitch: 1.0,
        volume: 1.0,
        language: 'es-ES',
        prosody: { rate: 1.1, pitch: 1.0, volume: 1.0 }
      },
      french: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        language: 'fr-FR',
        prosody: { rate: 1.0, pitch: 1.0, volume: 1.0 }
      },
      arabic: {
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
        language: 'ar-SA',
        prosody: { rate: 0.9, pitch: 1.0, volume: 1.0 }
      }
    };

    return settings[language] || settings.english;
  }

  // 方言別設定
  private static getDialectSettings(language: string, dialect: string): SSMLOptions {
    const dialectSettings: Record<string, Record<string, SSMLOptions>> = {
      japanese: {
        kansai: {
          rate: 1.1,
          pitch: 1.05,
          volume: 1.0,
          prosody: { rate: 1.1, pitch: 1.05, volume: 1.0 }
        },
        hakata: {
          rate: 1.2,
          pitch: 1.1,
          volume: 1.0,
          prosody: { rate: 1.2, pitch: 1.1, volume: 1.0 }
        },
        tsugaru: {
          rate: 0.9,
          pitch: 0.95,
          volume: 1.0,
          prosody: { rate: 0.9, pitch: 0.95, volume: 1.0 }
        }
      },
      english: {
        british: {
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          prosody: { rate: 1.0, pitch: 1.0, volume: 1.0 }
        },
        american: {
          rate: 1.1,
          pitch: 1.0,
          volume: 1.0,
          prosody: { rate: 1.1, pitch: 1.0, volume: 1.0 }
        },
        australian: {
          rate: 1.0,
          pitch: 1.05,
          volume: 1.0,
          prosody: { rate: 1.0, pitch: 1.05, volume: 1.0 }
        }
      }
    };

    return dialectSettings[language]?.[dialect] || {};
  }

  // 言語コード取得
  private static getLanguageCode(language: string): string {
    const codes: Record<string, string> = {
      japanese: 'ja-JP',
      english: 'en-US',
      chinese: 'zh-CN',
      spanish: 'es-ES',
      french: 'fr-FR',
      arabic: 'ar-SA',
      german: 'de-DE',
      italian: 'it-IT',
      portuguese: 'pt-BR',
      russian: 'ru-RU',
      korean: 'ko-KR'
    };

    return codes[language] || 'en-US';
  }

  // 方言辞書を使用した語彙変換
  static applyDialectDictionary(text: string, dialect: string): string {
    const dialectDictionary: Record<string, Record<string, string>> = {
      kansai: {
        'です': 'やで',
        'ます': 'まっせ',
        'だよ': 'やで',
        'だね': 'やな',
        'そうだ': 'そうや',
        'とても': 'めっちゃ',
        'すごく': 'めっちゃ'
      },
      hakata: {
        'です': 'ばい',
        'ます': 'ばい',
        'だよ': 'と',
        'だね': 'と',
        'そうだ': 'そうと',
        'とても': 'めっちゃ',
        'すごく': 'めっちゃ'
      },
      tsugaru: {
        'です': 'だべ',
        'ます': 'だべ',
        'だよ': 'だべ',
        'だね': 'だべ',
        'そうだ': 'そうだべ',
        'とても': 'めっちゃ',
        'すごく': 'めっちゃ'
      }
    };

    let result = text;
    const dictionary = dialectDictionary[dialect] || {};
    
    Object.entries(dictionary).forEach(([standard, dialect]) => {
      const regex = new RegExp(standard, 'g');
      result = result.replace(regex, dialect);
    });

    return result;
  }
}
