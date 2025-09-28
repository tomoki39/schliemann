// 方言変換サービス
// Phase 1: 基本的なテキスト変換ルール
// Phase 2: AI音声変換API統合予定

export interface DialectConversionResult {
  convertedText: string;
  audioUrl?: string;
  success: boolean;
  error?: string;
}

// 基本的な方言変換ルール（Phase 1）
const dialectRules: Record<string, Record<string, string>> = {
  kansai: {
    'いい': 'ええ',
    'どこか': 'どっか',
    'ですか': 'やなあ',
    'お出かけ': '行かはる',
    'です': 'や',
    'ます': 'まっせ',
    'ね': 'なあ',
    'よ': 'やで',
    'だ': 'や',
    'ですよ': 'やで',
    'ますよ': 'まっせ',
    'でしょう': 'やろ',
    'ですね': 'やなあ',
    'ですよね': 'やろなあ'
  },
  hakata: {
    'いい': 'よか',
    'どこか': 'どっか',
    'ですか': 'ばい',
    'お出かけ': '行く',
    'です': 'ばい',
    'ます': 'ばい',
    'ね': 'ばい',
    'よ': 'ばい',
    'だ': 'ばい',
    'ですよ': 'ばい',
    'ますよ': 'ばい',
    'でしょう': 'ばい',
    'ですね': 'ばい',
    'ですよね': 'ばい'
  },
  tsugaru: {
    'いい': 'いい',
    'どこか': 'どご',
    'ですか': 'だな',
    'お出かけ': '行ぐ',
    'です': 'だ',
    'ます': 'だ',
    'ね': 'だな',
    'よ': 'だ',
    'だ': 'だ',
    'ですよ': 'だ',
    'ますよ': 'だ',
    'でしょう': 'だな',
    'ですね': 'だな',
    'ですよね': 'だな'
  },
  nagoya: {
    'いい': 'いい',
    'どこか': 'どっか',
    'ですか': 'だね',
    'お出かけ': '行く',
    'です': 'だ',
    'ます': 'だ',
    'ね': 'だね',
    'よ': 'だ',
    'だ': 'だ',
    'ですよ': 'だ',
    'ますよ': 'だ',
    'でしょう': 'だね',
    'ですね': 'だね',
    'ですよね': 'だね'
  },
  hiroshima: {
    'いい': 'ええ',
    'どこか': 'どっか',
    'ですか': 'じゃな',
    'お出かけ': '行く',
    'です': 'じゃ',
    'ます': 'じゃ',
    'ね': 'じゃな',
    'よ': 'じゃ',
    'だ': 'じゃ',
    'ですよ': 'じゃ',
    'ますよ': 'じゃ',
    'でしょう': 'じゃな',
    'ですね': 'じゃな',
    'ですよね': 'じゃな'
  },
  kagoshima: {
    'いい': 'よか',
    'どこか': 'どっか',
    'ですか': 'じゃ',
    'お出かけ': '行く',
    'です': 'じゃ',
    'ます': 'じゃ',
    'ね': 'じゃ',
    'よ': 'じゃ',
    'だ': 'じゃ',
    'ですよ': 'じゃ',
    'ますよ': 'じゃ',
    'でしょう': 'じゃ',
    'ですね': 'じゃ',
    'ですよね': 'じゃ'
  },
  okinawa: {
    'こんにちは': 'はいさい',
    'いい': 'いい',
    'どこか': 'どこか',
    'ですか': 'ですか',
    'お出かけ': '行く',
    'です': 'です',
    'ます': 'ます',
    'ね': 'ね',
    'よ': 'よ',
    'だ': 'だ',
    'ですよ': 'ですよ',
    'ますよ': 'ますよ',
    'でしょう': 'でしょう',
    'ですね': 'ですね',
    'ですよね': 'ですよね'
  }
};

// テキストを方言に変換
export const convertTextToDialect = (
  text: string, 
  dialectModel: string
): DialectConversionResult => {
  try {
    if (dialectModel === 'standard') {
      return {
        convertedText: text,
        success: true
      };
    }

    const rules = dialectRules[dialectModel];
    if (!rules) {
      return {
        convertedText: text,
        success: false,
        error: `方言モデル "${dialectModel}" が見つかりません`
      };
    }

    let convertedText = text;
    
    // ルールに基づいて変換
    Object.entries(rules).forEach(([from, to]) => {
      const regex = new RegExp(from, 'g');
      convertedText = convertedText.replace(regex, to);
    });

    return {
      convertedText,
      success: true
    };
  } catch (error) {
    return {
      convertedText: text,
      success: false,
      error: error instanceof Error ? error.message : '変換エラーが発生しました'
    };
  }
};

// 音声合成用の方言設定
export const getDialectVoiceSettings = (dialectModel: string) => {
  const voiceSettings: Record<string, any> = {
    standard: { lang: 'ja-JP', rate: 1.0, pitch: 1.0 },
    kansai: { lang: 'ja-JP', rate: 1.1, pitch: 1.05 },
    hakata: { lang: 'ja-JP', rate: 1.2, pitch: 1.1 },
    tsugaru: { lang: 'ja-JP', rate: 0.9, pitch: 0.95 },
    nagoya: { lang: 'ja-JP', rate: 1.0, pitch: 1.0 },
    hiroshima: { lang: 'ja-JP', rate: 1.1, pitch: 1.05 },
    kagoshima: { lang: 'ja-JP', rate: 1.2, pitch: 1.1 },
    okinawa: { lang: 'ja-JP', rate: 1.0, pitch: 1.0 }
  };

  return voiceSettings[dialectModel] || voiceSettings.standard;
};

// Phase 2で実装予定: AI音声変換API
export const convertToDialectAudio = async (
  text: string,
  dialectModel: string
): Promise<DialectConversionResult> => {
  // TODO: AI音声変換APIの実装
  // 現在はテキスト変換のみ
  return convertTextToDialect(text, dialectModel);
};


