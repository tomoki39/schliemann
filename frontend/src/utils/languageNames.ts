
const languageNameMap: Record<string, string> = {
  '日本語': 'Japanese',
  '英語': 'English',
  '中国語': 'Chinese (Mandarin)',
  'ヒンディー語': 'Hindi',
  'スペイン語': 'Spanish',
  'フランス語': 'French',
  'アラビア語': 'Arabic',
  'ベンガル語': 'Bengali',
  'ポルトガル語': 'Portuguese',
  'ロシア語': 'Russian',
  'ウルドゥー語': 'Urdu',
  'インドネシア語': 'Indonesian',
  'ドイツ語': 'German',
  'ジャワ語': 'Javanese',
  'マラーティー語': 'Marathi',
  'テルグ語': 'Telugu',
  'トルコ語': 'Turkish',
  'タミル語': 'Tamil',
  '広東語': 'Cantonese',
  'ベトナム語': 'Vietnamese',
  '韓国語': 'Korean',
  'イタリア語': 'Italian',
  'タイ語': 'Thai',
  'グジャラート語': 'Gujarati',
  'ペルシア語': 'Persian',
  'ポーランド語': 'Polish',
  'パシュトゥー語': 'Pashto',
  'カンナダ語': 'Kannada',
  'マラヤーラム語': 'Malayalam',
  'スンダ語': 'Sundanese',
  'ハウサ語': 'Hausa',
  'オディア語': 'Odia',
  'ビルマ語': 'Burmese',
  'ハッカ語': 'Hakka',
  'ウクライナ語': 'Ukrainian',
  'ボージュプリー語': 'Bhojpuri',
  'タガログ語': 'Tagalog',
  'ヨルバ語': 'Yoruba',
  'マイティリー語': 'Maithili',
  'ウズベク語': 'Uzbek',
  'シンド語': 'Sindhi',
  'アムハラ語': 'Amharic',
  'フラニ語': 'Fula',
  'ルーマニア語': 'Romanian',
  'オロモ語': 'Oromo',
  'イボ語': 'Igbo',
  'アゼルバイジャン語': 'Azerbaijani',
  'アワディー語': 'Awadhi',
  '贛語': 'Gan Chinese',
  'セブアノ語': 'Cebuano',
  'オランダ語': 'Dutch',
  'クルド語': 'Kurdish',
  'セルボ・クロアチア語': 'Serbo-Croatian',
  'マダガスカル語': 'Malagasy',
  'サライキ語': 'Saraiki',
  'ネパール語': 'Nepali',
  'シンハラ語': 'Sinhala',
  'チワン語': 'Zhuang',
  'クメール語': 'Khmer',
  'トルクメン語': 'Turkmen',
  'アッサム語': 'Assamese',
  'マドゥラ語': 'Madurese',
  'ソマリ語': 'Somali',
  'マールワーリー語': 'Marwari',
  'マギ語': 'Magahi',
  'ハリヤーンウィー語': 'Haryanvi',
  'ハンガリー語': 'Hungarian',
  'ギリシャ語': 'Greek',
  'チャッティースガリー語': 'Chhattisgarhi',
  'デカン語': 'Deccan',
  'ミニ語': 'Min Bei',
  '閩南語': 'Min Nan',
  '呉語': 'Wu Chinese',
  '湘語': 'Xiang Chinese',
  '晋語': 'Jin Chinese',
  '客家語': 'Hakka Chinese',
  'スワヒリ語': 'Swahili',
  'ズールー語': 'Zulu',
  'スウェーデン語': 'Swedish',
  'カザフ語': 'Kazakh',
  'チェコ語': 'Czech',
  'ウイグル語': 'Uyghur',
  'ルワンダ語': 'Kinyarwanda',
  'タジク語': 'Tajik',
  'ブルガリア語': 'Bulgarian',
  'スロバキア語': 'Slovak',
  'ノルウェー語': 'Norwegian',
  'フィンランド語': 'Finnish',
  'デンマーク語': 'Danish',
  'ヘブライ語': 'Hebrew',
  'モンゴル語': 'Mongolian',
  'アルメニア語': 'Armenian',
  'ジョージア語': 'Georgian',
  'ラオ語': 'Lao',
  'リトアニア語': 'Lithuanian',
  'スロベニア語': 'Slovenian',
  'ラトビア語': 'Latvian',
  'エストニア語': 'Estonian',
  'アイスランド語': 'Icelandic',
  'キルギス語': 'Kyrgyz',
  'チベット語': 'Tibetan',
  'トク・ピシン': 'Tok Pisin',
  'アフリカーンス語': 'Afrikaans',
  'コサ語': 'Xhosa',
  'マレー語': 'Malay',
  'パンジャブ語': 'Punjabi',
};

const familyNameMap: Record<string, string> = {
  'インド・ヨーロッパ': 'Indo-European',
  'シナ・チベット': 'Sino-Tibetan',
  'アフロ・アジア': 'Afro-Asiatic',
  'オーストロネシア': 'Austronesian',
  'ニジェール・コンゴ': 'Niger-Congo',
  'ドラヴィダ': 'Dravidian',
  'テュルク': 'Turkic',
  'ジャポニック': 'Japonic',
  '朝鮮語族': 'Koreanic',
  'モンゴル': 'Mongolic',
  'オーストロアジア': 'Austroasiatic',
  'タイ・カダイ': 'Tai-Kadai',
  'ウラル': 'Uralic',
  'カルト・ザン': 'Kartvelian',
  'クレオール': 'Creole',
};

const branchNameMap: Record<string, string> = {
  'ゲルマン': 'Germanic',
  'イタリック': 'Italic',
  'インド・イラン': 'Indo-Iranian',
  'バルト・スラヴ': 'Balto-Slavic',
  'シナ': 'Sinitic',
  'セム': 'Semitic',
  'マレー・ポリネシア': 'Malayo-Polynesian',
  'バントゥー': 'Bantu',
  '南部ドラヴィダ': 'South Dravidian',
  'オグズ': 'Oghuz',
  '日本語': 'Japanese',
  '朝鮮語': 'Korean',
  'モン・クメール': 'Mon-Khmer',
  'タイ': 'Tai',
  'フィン・ウゴル': 'Finno-Ugric',
  'テュルク': 'Turkic',
};

const groupNameMap: Record<string, string> = {
  '西ゲルマン': 'West Germanic',
  '北ゲルマン': 'North Germanic',
  'ロマンス': 'Romance',
  'インド語群': 'Indo-Aryan',
  'イラン語群': 'Iranian',
  'スラヴ': 'Slavic',
  '官話': 'Mandarin',
  '呉': 'Wu',
  '広東': 'Yue',
  '閩': 'Min',
  '客家': 'Hakka',
  'アラビア語群': 'Arabic',
  'スンダ・スラウェシ': 'Sunda-Sulawesi',
  '南部バントゥー': 'Southern Bantu',
  'オグズ': 'Oghuz',
};

const subgroupNameMap: Record<string, string> = {
  'アングロ・フリジア': 'Anglo-Frisian',
  '高地ドイツ': 'High German',
  'イベロ・ロマンス': 'Ibero-Romance',
  'ガロ・ロマンス': 'Gallo-Romance',
  '中央ゾーン': 'Central Zone',
  '北西ゾーン': 'Northwest Zone',
  '東イラン': 'Eastern Iranian',
  '西イラン': 'Western Iranian',
  '東スラヴ': 'East Slavic',
  '西スラヴ': 'West Slavic',
  '南スラヴ': 'South Slavic',
  '西スカンジナビア': 'West Scandinavian',
  'オグズ': 'Oghuz',
  'インド語群': 'Indo-Aryan',
};

const dialectNameMap: Record<string, string> = {
  '標準語': 'Standard Language',
  '標準': 'Standard',
  '東京弁': 'Tokyo Dialect',
  '大阪弁': 'Osaka Dialect',
  '京都弁': 'Kyoto Dialect',
  '東北弁': 'Tohoku Dialect',
  '博多弁': 'Hakata Dialect',
  'イギリス英語': 'British English',
  'アメリカ英語': 'American English',
  'オーストラリア英語': 'Australian English',
  'カナダ英語': 'Canadian English',
  'インド英語': 'Indian English',
  '標準官話（普通話）': 'Standard Mandarin (Putonghua)',
  '標準官話 (普通話)': 'Standard Mandarin (Putonghua)',
  '台湾華語': 'Taiwanese Mandarin',
  'シンガポール華語': 'Singaporean Mandarin',
  '広東語': 'Cantonese',
  '上海語': 'Shanghainese',
  '客家語': 'Hakka',
  '福建語': 'Hokkien',
  '標準ヒンディー語（カーリー・ボーリー）': 'Standard Hindi (Khariboli)',
  '標準ヒンディー語 (カーリー・ボーリー)': 'Standard Hindi (Khariboli)',
  'ボージュプリー': 'Bhojpuri',
  'アワディー': 'Awadhi',
  'エジプトアラビア語': 'Egyptian Arabic',
  '湾岸アラビア語': 'Gulf Arabic',
  'レバントアラビア語': 'Levantine Arabic',
  'マグリブ・アラビア語': 'Maghrebi Arabic',
  '標準スペイン語': 'Standard Spanish',
  'メキシコスペイン語': 'Mexican Spanish',
  'アルゼンチンスペイン語': 'Argentine Spanish',
  '標準フランス語': 'Standard French',
  'ケベックフランス語': 'Quebec French',
  'アフリカフランス語': 'African French',
  '標準ドイツ語': 'Standard German',
  'スイスドイツ語': 'Swiss German',
  'オーストリアドイツ語': 'Austrian German',
  '標準ロシア語': 'Standard Russian',
  '南部ロシア語': 'Southern Russian',
  'ブラジル・ポルトガル語': 'Brazilian Portuguese',
  'ヨーロッパ・ポルトガル語': 'European Portuguese',
  '標準イタリア語': 'Standard Italian',
  'ナポリ語': 'Neapolitan',
  'シチリア語': 'Sicilian',
  '標準韓国語': 'Standard Korean',
  '釜山方言': 'Busan Dialect',
  '済州方言': 'Jeju Dialect',
  '北部パシュトゥー語': 'Northern Pashto',
  '南部パシュトゥー語': 'Southern Pashto',
  '標準インドネシア語': 'Standard Indonesian',
  'ジャカルタ語': 'Jakarta Dialect',
  '標準ベトナム語': 'Standard Vietnamese',
  '南部ベトナム語': 'Southern Vietnamese',
  '標準タイ語': 'Standard Thai',
  '北部タイ語': 'Northern Thai',
  '東北タイ語': 'Isan',
  '南部タイ語': 'Southern Thai',
  '標準トルコ語': 'Standard Turkish',
  '標準ベンガル語': 'Standard Bengali',
  '標準ウルドゥー語': 'Standard Urdu',
  '標準タミル語': 'Standard Tamil',
  '標準テルグ語': 'Standard Telugu',
  '標準マラーティー語': 'Standard Marathi',
  '標準パンジャブ語': 'Standard Punjabi',
  '標準ペルシア語': 'Standard Persian',
  'ダリー語': 'Dari',
  'タジク語': 'Tajiki',
  '標準ポーランド語': 'Standard Polish',
  '標準ウクライナ語': 'Standard Ukrainian',
  '標準オランダ語': 'Standard Dutch',
  '標準マレー語': 'Standard Malay',
  '標準スワヒリ語': 'Standard Swahili',
  '標準ヨルバ語': 'Standard Yoruba',
  '標準イボ語': 'Standard Igbo',
  '標準ハウサ語': 'Standard Hausa',
  '標準アムハラ語': 'Standard Amharic',
};

const dialectDescriptionMap: Record<string, string> = {
  '標準的な発音': 'Standard pronunciation',
  '北部の主要変種': 'Major Northern variety',
  '南部の主要変種': 'Major Southern variety',
  'イギリスの標準的な英語': 'Standard British English',
  'アメリカの標準的な英語': 'Standard American English',
  '北京を基準とする標準官話（普通話）': 'Standard Mandarin based on Beijing dialect (Putonghua)',
  '台湾で使用される中国語': 'Mandarin Chinese used in Taiwan',
  'インド全土で公用語として使用される標準的なヒンディー語': 'Standard Hindi used as an official language throughout India',
  'シンガポールで使用される中国語': 'Mandarin Chinese used in Singapore'
};

export function getLanguageName(nameJa: string, currentLang: string = 'ja'): string {
  if (currentLang === 'en') {
    return languageNameMap[nameJa] || nameJa;
  }
  return nameJa;
}

export function getFamilyName(nameJa: string, currentLang: string = 'ja'): string {
  if (currentLang === 'en') {
    return familyNameMap[nameJa] || nameJa;
  }
  return nameJa;
}

export function getBranchName(nameJa: string, currentLang: string = 'ja'): string {
  if (currentLang === 'en') {
    return branchNameMap[nameJa] || nameJa;
  }
  return nameJa;
}

export function getGroupName(nameJa: string, currentLang: string = 'ja'): string {
  if (currentLang === 'en') {
    return groupNameMap[nameJa] || nameJa;
  }
  return nameJa;
}

export function getSubgroupName(nameJa: string, currentLang: string = 'ja'): string {
  if (currentLang === 'en') {
    return subgroupNameMap[nameJa] || nameJa;
  }
  return nameJa;
}

export function getDialectName(nameJa: string, currentLang: string = 'ja'): string {
  if (currentLang === 'en') {
    return dialectNameMap[nameJa] || nameJa;
  }
  return nameJa;
}

export function getDialectDescription(description: string | undefined, currentLang: string = 'ja'): string {
  if (!description) return '';
  if (currentLang === 'en') {
    return dialectDescriptionMap[description] || description;
  }
  return description;
}
