// デモ用設定ファイル
export const DEMO_CONFIG = {
  // デモモードの設定
  isDemoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  
  // デフォルト言語設定
  defaultLanguage: import.meta.env.VITE_DEMO_LANGUAGE || 'ja',
  
  // 音声設定
  voiceSettings: {
    rate: parseFloat(import.meta.env.VITE_VOICE_RATE || '1.0'),
    pitch: parseFloat(import.meta.env.VITE_VOICE_PITCH || '1.0'),
    volume: parseFloat(import.meta.env.VITE_VOICE_VOLUME || '1.0'),
  },
  
  // デモ用のサンプルテキスト
  sampleTexts: {
    japanese: {
      standard: 'こんにちは、標準語で話しています。',
      kansai: 'こんにちは、関西弁で話しています。大阪の方言です。',
      hakata: 'こんにちは、博多弁で話しています。福岡の方言です。',
      tsugaru: 'こんにちは、津軽弁で話しています。青森の方言です。',
      okinawa: 'はいさい、沖縄方言で話しています。琉球語の影響を受けています。'
    },
    english: {
      standard: 'Hello, I am speaking standard English.',
      british: 'Hello, I am speaking British English. Would you like a cup of tea?',
      american: 'Hello, I am speaking American English. How are you doing today?',
      australian: 'G\'day mate! I am speaking Australian English. How\'s it going?'
    },
    french: {
      standard: 'Bonjour, je parle français standard.',
      quebec: 'Bonjour, je parle français québécois. Comment ça va?',
      belgian: 'Bonjour, je parle français belge. Comment allez-vous?'
    },
    spanish: {
      standard: 'Hola, hablo español estándar.',
      mexico: 'Hola, hablo español mexicano. ¿Cómo estás?',
      spain: 'Hola, hablo español de España. ¿Qué tal?'
    }
  },
  
  // デモ用のツアー設定
  tours: [
    {
      id: 'japanese_dialects',
      title: '日本語方言ツアー',
      description: '日本の主要な方言を順番に体験しましょう',
      languages: ['japanese'],
      dialects: ['standard', 'kansai', 'hakata', 'tsugaru', 'okinawa']
    },
    {
      id: 'english_dialects',
      title: '英語方言ツアー',
      description: '世界の英語方言を比較してみましょう',
      languages: ['english'],
      dialects: ['standard', 'british', 'american', 'australian']
    },
    {
      id: 'romance_languages',
      title: 'ロマンス語族ツアー',
      description: 'フランス語とスペイン語の方言を体験しましょう',
      languages: ['french', 'spanish'],
      dialects: ['standard', 'quebec', 'belgian', 'mexico', 'spain']
    }
  ],
  
  // デモ用の比較設定
  comparisons: [
    {
      id: 'kansai_vs_hakata',
      title: '関西弁 vs 博多弁',
      description: '関西弁と博多弁を同時に聞き比べてみましょう',
      dialects: ['kansai', 'hakata']
    },
    {
      id: 'british_vs_american',
      title: 'British vs American English',
      description: 'イギリス英語とアメリカ英語を比較してみましょう',
      dialects: ['british', 'american']
    }
  ]
};

// デモ用のヘルパー関数
export const getDemoText = (language: string, dialect: string): string => {
  const langTexts = DEMO_CONFIG.sampleTexts[language as keyof typeof DEMO_CONFIG.sampleTexts];
  if (!langTexts) return 'Hello, this is a demo text.';
  
  const text = langTexts[dialect as keyof typeof langTexts];
  return text || langTexts.standard || 'Hello, this is a demo text.';
};

export const getDemoTour = (tourId: string) => {
  return DEMO_CONFIG.tours.find(tour => tour.id === tourId);
};

export const getDemoComparison = (comparisonId: string) => {
  return DEMO_CONFIG.comparisons.find(comparison => comparison.id === comparisonId);
};
