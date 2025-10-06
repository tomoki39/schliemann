export interface Language {
  id: string;
  name_ja: string;
  // 学術的6層分類体系
  family: string;      // 語族 (Language Family)
  branch?: string;     // 語派 (Language Branch)
  group?: string;      // 語群 (Language Group)
  subgroup?: string;   // 語支 (Language Subgroup)
  language?: string;   // 言語 (Individual Language)
  dialect?: string;    // 方言 (Dialect) - オプション
  countries?: string[]; // ISO 3166-1 alpha-2 codes
  official_languages?: string[]; // 公用語として使用される国コード
  total_speakers?: number;
  center?: {
    lat: number;
    lng: number;
  };
  audio?: {
    text?: string; // 音声の内容（例：「こんにちは」）
    source?: string; // 音声の出典（例：「音声合成」）
  };
  phonetics?: {
    consonants: string[];
    vowels: string[];
    tones?: string[];
    syllable_structure?: string;
    stress_pattern?: string;
    phonetic_notes?: string;
  };
  dialects?: {
    name: string;
    region: string;
    sample_text: string;
    description?: string;
    conversion_model: string;
    custom_input_enabled: boolean;
  }[];
}

export interface LanguageArea {
  type: "Feature";
  properties: {
    id: string;
    name: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}
