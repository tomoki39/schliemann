export interface Language {
  id: string;
  name_ja: string;
  family: string;
  branch?: string;
  subgroup?: string;
  countries?: string[]; // ISO 3166-1 alpha-2 codes
  total_speakers?: number;
  center?: {
    lat: number;
    lng: number;
  };
  audio?: {
    text?: string; // 音声の内容（例：「こんにちは」）
    source?: string; // 音声の出典（例：「音声合成」）
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
