// デモ用の音声サンプルデータ
export interface VoiceSample {
  id: string;
  language: string;
  dialect: string;
  text: string;
  translatedText: string;
  description: string;
  category: 'greeting' | 'common' | 'cultural' | 'numbers' | 'emotions' | 'food' | 'family';
  culturalContext?: string;
  pronunciationNotes?: string;
  region?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const DEMO_VOICE_SAMPLES: VoiceSample[] = [
  // 英語方言
  {
    id: 'en_british_hello',
    language: 'en',
    dialect: 'british',
    text: 'Hello, how are you today?',
    translatedText: 'こんにちは、今日はいかがですか？',
    description: 'イギリス英語の挨拶',
    category: 'greeting'
  },
  {
    id: 'en_american_hello',
    language: 'en',
    dialect: 'american',
    text: 'Hi, how are you doing today?',
    translatedText: 'やあ、今日はどう？',
    description: 'アメリカ英語の挨拶',
    category: 'greeting',
    culturalContext: 'カジュアルなアメリカ英語の挨拶',
    pronunciationNotes: 'R音を強く発音',
    region: 'アメリカ',
    difficulty: 'easy'
  },
  // 数字のサンプル
  {
    id: 'en_british_numbers',
    language: 'en',
    dialect: 'british',
    text: 'One, two, three, four, five',
    translatedText: '1, 2, 3, 4, 5',
    description: 'イギリス英語の数字',
    category: 'numbers',
    culturalContext: 'イギリスの教育で使用される数字の発音',
    pronunciationNotes: '「three」の発音が特徴的',
    region: 'イギリス',
    difficulty: 'easy'
  },
  {
    id: 'en_american_numbers',
    language: 'en',
    dialect: 'american',
    text: 'One, two, three, four, five',
    translatedText: '1, 2, 3, 4, 5',
    description: 'アメリカ英語の数字',
    category: 'numbers',
    culturalContext: 'アメリカの教育で使用される数字の発音',
    pronunciationNotes: '「three」のR音が強く発音される',
    region: 'アメリカ',
    difficulty: 'easy'
  },
  // 感情表現のサンプル
  {
    id: 'en_british_emotions',
    language: 'en',
    dialect: 'british',
    text: 'I\'m absolutely delighted!',
    translatedText: '本当に嬉しいです！',
    description: 'イギリス英語の感情表現',
    category: 'emotions',
    culturalContext: 'イギリスらしい丁寧な感情表現',
    pronunciationNotes: '「absolutely」の発音が特徴的',
    region: 'イギリス',
    difficulty: 'medium'
  },
  {
    id: 'en_american_emotions',
    language: 'en',
    dialect: 'american',
    text: 'I\'m so excited!',
    translatedText: 'すごく興奮してる！',
    description: 'アメリカ英語の感情表現',
    category: 'emotions',
    culturalContext: 'アメリカらしい率直な感情表現',
    pronunciationNotes: '「excited」のR音が強く発音される',
    region: 'アメリカ',
    difficulty: 'medium'
  },
  {
    id: 'en_australian_hello',
    language: 'en',
    dialect: 'australian',
    text: 'G\'day, how are you going today?',
    translatedText: 'こんにちは、今日はどう？',
    description: 'オーストラリア英語の挨拶',
    category: 'greeting'
  },
  {
    id: 'en_canadian_hello',
    language: 'en',
    dialect: 'canadian',
    text: 'Hello, how are you doing today, eh?',
    translatedText: 'こんにちは、今日はどうですか、え？',
    description: 'カナダ英語の挨拶',
    category: 'greeting'
  },

  // スペイン語方言
  {
    id: 'es_castilian_hello',
    language: 'es',
    dialect: 'castilian',
    text: 'Hola, ¿cómo estás hoy?',
    translatedText: 'こんにちは、今日はいかがですか？',
    description: 'カスティーリャ語の挨拶',
    category: 'greeting'
  },
  {
    id: 'es_mexican_hello',
    language: 'es',
    dialect: 'mexican',
    text: 'Hola, ¿cómo estás hoy?',
    translatedText: 'こんにちは、今日はいかがですか？',
    description: 'メキシコスペイン語の挨拶',
    category: 'greeting'
  },

  // フランス語方言
  {
    id: 'fr_parisian_hello',
    language: 'fr',
    dialect: 'parisian',
    text: 'Bonjour, comment allez-vous aujourd\'hui ?',
    translatedText: 'こんにちは、今日はいかがですか？',
    description: 'パリフランス語の挨拶',
    category: 'greeting'
  },
  {
    id: 'fr_quebec_hello',
    language: 'fr',
    dialect: 'quebec',
    text: 'Bonjour, comment ça va aujourd\'hui ?',
    translatedText: 'こんにちは、今日はどうですか？',
    description: 'ケベックフランス語の挨拶',
    category: 'greeting'
  },

  // 中国語方言
  {
    id: 'zh_beijing_hello',
    language: 'zh',
    dialect: 'beijing',
    text: '你好，今天天气很好。',
    translatedText: 'こんにちは、今日はいい天気ですね。',
    description: '北京官話の挨拶',
    category: 'greeting'
  },
  {
    id: 'zh_taiwan_hello',
    language: 'zh',
    dialect: 'taiwan',
    text: '你好，今天天氣很好。',
    translatedText: 'こんにちは、今日はいい天気ですね。',
    description: '台湾華語の挨拶',
    category: 'greeting'
  },

  // 日本語方言
  {
    id: 'ja_standard_hello',
    language: 'ja',
    dialect: 'standard',
    text: 'こんにちは、今日はいい天気ですね。',
    translatedText: 'こんにちは、今日はいい天気ですね。',
    description: '標準語の挨拶',
    category: 'greeting'
  },
  {
    id: 'ja_tokyo_hello',
    language: 'ja',
    dialect: 'tokyo',
    text: 'こんにちは、今日はいい天気ですね。',
    translatedText: 'こんにちは、今日はいい天気ですね。',
    description: '東京弁の挨拶',
    category: 'greeting'
  },
  {
    id: 'ja_osaka_hello',
    language: 'ja',
    dialect: 'osaka',
    text: 'こんにちは、今日はええ天気やなあ。',
    translatedText: 'こんにちは、今日はいい天気ですね。',
    description: '大阪弁の挨拶',
    category: 'greeting'
  },

  // その他の言語
  {
    id: 'de_hello',
    language: 'de',
    dialect: 'german',
    text: 'Hallo, wie geht es dir heute?',
    translatedText: 'こんにちは、今日はいかがですか？',
    description: 'ドイツ語の挨拶',
    category: 'greeting'
  },
  {
    id: 'it_hello',
    language: 'it',
    dialect: 'italian',
    text: 'Ciao, come stai oggi?',
    translatedText: 'こんにちは、今日はいかがですか？',
    description: 'イタリア語の挨拶',
    category: 'greeting'
  },
  {
    id: 'ru_hello',
    language: 'ru',
    dialect: 'russian',
    text: 'Привет, как дела сегодня?',
    translatedText: 'こんにちは、今日はいかがですか？',
    description: 'ロシア語の挨拶',
    category: 'greeting'
  },
  {
    id: 'ar_hello',
    language: 'ar',
    dialect: 'arabic',
    text: 'مرحبا، كيف حالك اليوم؟',
    translatedText: 'こんにちは、今日はいかがですか？',
    description: 'アラビア語の挨拶',
    category: 'greeting'
  },
  {
    id: 'hi_hello',
    language: 'hi',
    dialect: 'hindi',
    text: 'नमस्ते, आज आप कैसे हैं?',
    translatedText: 'こんにちは、今日はいかがですか？',
    description: 'ヒンディー語の挨拶',
    category: 'greeting'
  },
  {
    id: 'ko_hello',
    language: 'ko',
    dialect: 'korean',
    text: '안녕하세요, 오늘 어떻게 지내세요?',
    translatedText: 'こんにちは、今日はいかがですか？',
    description: '韓国語の挨拶',
    category: 'greeting'
  },
];

// カテゴリ別のサンプルを取得
export function getSamplesByCategory(category: 'greeting' | 'common' | 'cultural'): VoiceSample[] {
  return DEMO_VOICE_SAMPLES.filter(sample => sample.category === category);
}

// 言語別のサンプルを取得
export function getSamplesByLanguage(language: string): VoiceSample[] {
  return DEMO_VOICE_SAMPLES.filter(sample => sample.language === language);
}

// 方言別のサンプルを取得
export function getSamplesByDialect(dialect: string): VoiceSample[] {
  return DEMO_VOICE_SAMPLES.filter(sample => sample.dialect === dialect);
}

// デモ用の「世界の挨拶」ツアー
export const WORLD_GREETING_TOUR: VoiceSample[] = [
  DEMO_VOICE_SAMPLES.find(s => s.id === 'en_british_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'en_american_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'es_castilian_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'fr_parisian_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'de_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'it_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'ru_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'zh_beijing_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'ja_standard_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'ko_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'ar_hello')!,
  DEMO_VOICE_SAMPLES.find(s => s.id === 'hi_hello')!,
];

// デモ用の「方言の旅」
export const DIALECT_TOUR: Record<string, VoiceSample[]> = {
  'en': [
    DEMO_VOICE_SAMPLES.find(s => s.id === 'en_british_hello')!,
    DEMO_VOICE_SAMPLES.find(s => s.id === 'en_american_hello')!,
    DEMO_VOICE_SAMPLES.find(s => s.id === 'en_australian_hello')!,
    DEMO_VOICE_SAMPLES.find(s => s.id === 'en_canadian_hello')!,
  ],
  'es': [
    DEMO_VOICE_SAMPLES.find(s => s.id === 'es_castilian_hello')!,
    DEMO_VOICE_SAMPLES.find(s => s.id === 'es_mexican_hello')!,
  ],
  'fr': [
    DEMO_VOICE_SAMPLES.find(s => s.id === 'fr_parisian_hello')!,
    DEMO_VOICE_SAMPLES.find(s => s.id === 'fr_quebec_hello')!,
  ],
  'zh': [
    DEMO_VOICE_SAMPLES.find(s => s.id === 'zh_beijing_hello')!,
    DEMO_VOICE_SAMPLES.find(s => s.id === 'zh_taiwan_hello')!,
  ],
  'ja': [
    DEMO_VOICE_SAMPLES.find(s => s.id === 'ja_standard_hello')!,
    DEMO_VOICE_SAMPLES.find(s => s.id === 'ja_tokyo_hello')!,
    DEMO_VOICE_SAMPLES.find(s => s.id === 'ja_osaka_hello')!,
  ],
};
