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
