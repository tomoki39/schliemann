// 方言別の音声設定
export interface DialectVoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  language: string;
  voiceName?: string;
  dialect?: string;
  description: string;
  culturalContext?: string;
  pronunciationNotes?: string;
  region?: string;
  speakerCount?: number;
}

// 方言別の音声設定マップ
export const DIALECT_VOICE_SETTINGS: Record<string, DialectVoiceSettings> = {
  // 英語方言
  'british': {
    rate: 0.9,
    pitch: 1.1,
    volume: 1.0,
    language: 'en-GB',
    voiceName: 'Google UK English Female',
    dialect: 'british',
    description: 'イギリス英語 - 落ち着いた発音、RPアクセント',
    culturalContext: 'BBC放送で使用される標準的なイギリス英語',
    pronunciationNotes: 'R音を発音せず、母音が特徴的',
    region: 'イギリス',
    speakerCount: 60000000
  },
  'american': {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    language: 'en-US',
    voiceName: 'Google US English Female',
    dialect: 'american',
    description: 'アメリカ英語 - 標準的な発音、General American',
    culturalContext: 'ハリウッド映画やポップカルチャーで使用される標準的なアメリカ英語',
    pronunciationNotes: 'R音を強く発音し、母音が特徴的',
    region: 'アメリカ',
    speakerCount: 250000000
  },
  'australian': {
    rate: 0.95,
    pitch: 1.05,
    volume: 1.0,
    language: 'en-AU',
    voiceName: 'Google UK English Female',
    dialect: 'australian',
    description: 'オーストラリア英語 - 独特のアクセント、語尾上がり',
    culturalContext: 'オーストラリアの日常生活で使用される英語',
    pronunciationNotes: '母音の発音が特徴的で、語尾が上がる傾向',
    region: 'オーストラリア',
    speakerCount: 25000000
  },
  'canadian': {
    rate: 0.95,
    pitch: 1.0,
    volume: 1.0,
    language: 'en',
    dialect: 'canadian',
    description: 'カナダ英語 - イギリスとアメリカの中間的な発音'
  },

  // スペイン語方言
  'castilian': {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    language: 'es',
    dialect: 'castilian',
    description: 'カスティーリャ語 - θ音（th音）が特徴的'
  },
  'mexican': {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    language: 'es',
    dialect: 'mexican',
    description: 'メキシコスペイン語 - 明るい発音、s音が特徴的'
  },

  // フランス語方言
  'parisian': {
    rate: 0.9,
    pitch: 1.1,
    volume: 1.0,
    language: 'fr',
    dialect: 'parisian',
    description: 'パリフランス語 - 標準的な発音、エレガント'
  },
  'quebec': {
    rate: 0.95,
    pitch: 1.0,
    volume: 1.0,
    language: 'fr',
    dialect: 'quebec',
    description: 'ケベックフランス語 - 独特のアクセント、古いフランス語の特徴'
  },

  // 中国語方言
  'beijing': {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    language: 'zh',
    dialect: 'beijing',
    description: '北京官話 - 巻舌音（zh, ch, sh, r）が特徴的'
  },
  'taiwan': {
    rate: 0.95,
    pitch: 1.05,
    volume: 1.0,
    language: 'zh',
    dialect: 'taiwan',
    description: '台湾華語 - 繁体字使用、台湾特有の語彙'
  },

  // 日本語方言
  'standard': {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    language: 'ja',
    dialect: 'standard',
    description: '標準語 - 東京を中心とした標準的な日本語'
  },
  'tokyo': {
    rate: 0.95,
    pitch: 1.0,
    volume: 1.0,
    language: 'ja',
    dialect: 'tokyo',
    description: '東京弁 - 関東地方の方言、やや早口'
  },
  'osaka': {
    rate: 0.85,
    pitch: 1.1,
    volume: 1.0,
    language: 'ja',
    dialect: 'osaka',
    description: '大阪弁 - 関西地方の方言、独特のアクセント'
  },

  // その他の言語
  'german': {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    language: 'de',
    description: 'ドイツ語 - 硬い子音が特徴的'
  },
  'italian': {
    rate: 1.0,
    pitch: 1.1,
    volume: 1.0,
    language: 'it',
    description: 'イタリア語 - 明るい発音、母音が豊富'
  },
  'russian': {
    rate: 0.9,
    pitch: 0.95,
    volume: 1.0,
    language: 'ru',
    description: 'ロシア語 - 硬い子音、独特のリズム'
  },
  'arabic': {
    rate: 0.85,
    pitch: 1.0,
    volume: 1.0,
    language: 'ar',
    description: 'アラビア語 - 喉音、複雑な子音体系'
  },
  'hindi': {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    language: 'hi',
    description: 'ヒンディー語 - 子音の組み合わせが豊富'
  },
  'korean': {
    rate: 0.9,
    pitch: 1.05,
    volume: 1.0,
    language: 'ko',
    description: '韓国語 - 高低アクセント、子音の特徴'
  },
};

// 方言設定を取得する関数
export function getDialectVoiceSettings(dialectId: string): DialectVoiceSettings {
  return DIALECT_VOICE_SETTINGS[dialectId] || {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    language: 'en',
    description: '標準的な発音'
  };
}

// エイリアス
export const getVoiceSettings = getDialectVoiceSettings;

// 利用可能な方言のリストを取得
export function getAvailableDialects(): string[] {
  return Object.keys(DIALECT_VOICE_SETTINGS);
}

// 言語別の方言を取得
export function getDialectsByLanguage(language: string): string[] {
  return Object.entries(DIALECT_VOICE_SETTINGS)
    .filter(([_, settings]) => settings.language === language)
    .map(([dialectId, _]) => dialectId);
}
