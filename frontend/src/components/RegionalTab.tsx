import React, { useState, useRef, useMemo } from 'react';
import { Language } from '../types/Language';
import { enhancedVoiceService, EnhancedVoiceRequest } from '../services/enhancedVoiceService';

interface RegionalTabProps {
  languages: Language[];
  searchQuery: string;
}

interface RegionalLanguage {
  id: string;
  name: string;
  nameJa: string;
  nameEn?: string;
  nameNative?: string;
  flag: string;
  country: string;
  speakers: number;
  family: string;
  dialects: Array<{
    id: string;
    name: string;
    region: string;
    description?: string;
  }>;
  isPlaying: boolean;
  isLoading: boolean;
  error?: string;
}

interface Region {
  id: string;
  name: string;
  icon: string;
  languages: RegionalLanguage[];
}

const RegionalTab: React.FC<RegionalTabProps> = ({ languages, searchQuery }) => {
  const [playingItems, setPlayingItems] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [errorItems, setErrorItems] = useState<Map<string, string>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 国コード→国旗
  const countryCodeToFlag = (code?: string): string => {
    if (!code || code.length !== 2) return '🌍';
    const base = 127397;
    const upper = code.toUpperCase();
    return String.fromCodePoint(upper.charCodeAt(0) + base) + String.fromCodePoint(upper.charCodeAt(1) + base);
  };

  // ISO2→大陸の簡易マップ（必要分のみ・未知はその他）
  const isoToContinent: Record<string, 'asia' | 'europe' | 'africa' | 'americas' | 'oceania' | 'other'> = {
    JP: 'asia', CN: 'asia', TW: 'asia', SG: 'asia', IN: 'asia', BD: 'asia', PK: 'asia', LK: 'asia', TH: 'asia', VN: 'asia', KH: 'asia', LA: 'asia', MM: 'asia', MY: 'asia', PH: 'asia', ID: 'asia', HK: 'asia', MO: 'asia', KR: 'asia', KP: 'asia', NP: 'asia', BT: 'asia',
    TR: 'asia', AM: 'asia', AZ: 'asia', GE: 'asia', IR: 'asia', IQ: 'asia', SA: 'asia', AE: 'asia', OM: 'asia', YE: 'asia', JO: 'asia', LB: 'asia', SY: 'asia', IL: 'asia', KZ: 'asia', KG: 'asia', TJ: 'asia', UZ: 'asia', TM: 'asia',
    RU: 'europe', UA: 'europe', BY: 'europe', PL: 'europe', LT: 'europe', LV: 'europe', EE: 'europe', CZ: 'europe', SK: 'europe', HU: 'europe', RO: 'europe', BG: 'europe', HR: 'europe', BA: 'europe', RS: 'europe', ME: 'europe', SI: 'europe', IT: 'europe', ES: 'europe', PT: 'europe', FR: 'europe', DE: 'europe', AT: 'europe', CH: 'europe', BE: 'europe', NL: 'europe', LU: 'europe', LI: 'europe', MC: 'europe', SM: 'europe', VA: 'europe', AL: 'europe', MK: 'europe', GR: 'europe', SE: 'europe', NO: 'europe', FI: 'europe', IS: 'europe', IE: 'europe', GB: 'europe',
    US: 'americas', CA: 'americas', MX: 'americas', AR: 'americas', CO: 'americas', CL: 'americas', PE: 'americas', VE: 'americas', EC: 'americas', UY: 'americas', PY: 'americas', BO: 'americas', DO: 'americas', SV: 'americas', HN: 'americas', NI: 'americas', CR: 'americas', GT: 'americas', PA: 'americas', CU: 'americas', BR: 'americas',
    EG: 'africa', DZ: 'africa', MA: 'africa', TN: 'africa', LY: 'africa', SD: 'africa', SO: 'africa', MR: 'africa', PS: 'asia', DJ: 'africa', KM: 'africa', TZ: 'africa', KE: 'africa', UG: 'africa', RW: 'africa', BI: 'africa', CD: 'africa', GA: 'africa', MG: 'africa', GH: 'africa', BF: 'africa', CM: 'africa', TD: 'africa', NE: 'africa', ML: 'africa', BJ: 'africa', TG: 'africa', CF: 'africa', CG: 'africa', ZA: 'africa', SZ: 'africa', LS: 'africa', MZ: 'africa', ZW: 'africa', BW: 'africa', NG: 'africa', ET: 'africa', AO: 'africa', GW: 'africa', CV: 'africa', ST: 'africa'
  };

  const regions: Region[] = useMemo(() => {
    const result: Record<string, Region> = {
      asia: { id: 'asia', name: 'アジア', icon: '🌏', languages: [] },
      europe: { id: 'europe', name: 'ヨーロッパ', icon: '🇪🇺', languages: [] },
      africa: { id: 'africa', name: 'アフリカ', icon: '🌍', languages: [] },
      americas: { id: 'americas', name: 'アメリカ', icon: '🌎', languages: [] },
      oceania: { id: 'oceania', name: 'オセアニア', icon: '🦘', languages: [] },
      other: { id: 'other', name: 'その他', icon: '🗺️', languages: [] }
    };

    (languages || [])
      .filter(l => (l.total_speakers || 0) >= 10000000)
      .forEach(l => {
        const firstCountry = l.countries?.[0];
        const bucket = firstCountry ? (isoToContinent[firstCountry] || 'other') : 'other';
        const entry: RegionalLanguage = {
          id: l.id,
          name: l.language || l.name_ja,
          nameJa: l.name_ja,
          nameEn: undefined,
          nameNative: undefined,
          flag: countryCodeToFlag(firstCountry),
          country: firstCountry || '—',
          speakers: l.total_speakers || 0,
          family: l.family,
          dialects: (() => {
            const items = (l.dialects || []).map((d, i) => ({ id: d.conversion_model || String(i), name: d.name, region: d.region }));
            if (items.length > 0) return items;
            return [{ id: 'standard', name: '標準', region: '' }];
          })(),
          isPlaying: false,
          isLoading: false
        };
        result[bucket].languages.push(entry);
      });

    // 空地域は除外
    return Object.values(result).filter(r => r.languages.length > 0);
  }, [languages]);

  // 音声再生
  const playAudio = async (languageId: string, dialectId?: string) => {
    const itemId = dialectId ? `${languageId}_${dialectId}` : languageId;
    
    if (playingItems.has(itemId)) {
      // 停止
      const audio = audioRefs.current.get(itemId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      return;
    }

    // 他の音声を停止
    playingItems.forEach(playingId => {
      const audio = audioRefs.current.get(playingId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingItems(new Set());

    // 新しい音声を再生
    setLoadingItems(prev => new Set(prev).add(itemId));
    setErrorItems(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });

    try {
      const language = regions
        .flatMap(region => region.languages)
        .find(lang => lang.id === languageId);
      if (!language) return;

      const text = getSampleText(language, dialectId);
      const request: EnhancedVoiceRequest = {
        text,
        language: languageId,
        dialect: dialectId
      };

      const result = await enhancedVoiceService.generateVoice(request);
      
      if (result.success && result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audioRefs.current.set(itemId, audio);
        
        audio.onended = () => {
          setPlayingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        };
        
        audio.onerror = () => {
          setErrorItems(prev => new Map(prev).set(itemId, '音声の再生に失敗しました'));
          setPlayingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        };
        
        await audio.play();
        setPlayingItems(prev => new Set(prev).add(itemId));
      } else {
        setErrorItems(prev => new Map(prev).set(itemId, result.error || '音声の生成に失敗しました'));
      }
    } catch (error) {
      setErrorItems(prev => new Map(prev).set(itemId, '音声の生成中にエラーが発生しました'));
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // サンプルテキストを取得
  const getSampleText = (language: RegionalLanguage, dialectId?: string): string => {
    // const dialect = dialectId ? language.dialects.find(d => d.id === dialectId) : null;
    
    if (language.id === 'japanese') {
      if (dialectId === 'kansai') return 'こんにちは、関西弁で話しています。大阪の方言です。';
      if (dialectId === 'hakata') return 'こんにちは、博多弁で話しています。福岡の方言です。';
      if (dialectId === 'tsugaru') return 'こんにちは、津軽弁で話しています。青森の方言です。';
      if (dialectId === 'okinawa') return 'はいさい、沖縄方言で話しています。琉球語の影響を受けています。';
      return 'こんにちは、日本語で話しています。';
    }
    
    if (language.id === 'chinese') {
      if (dialectId === 'cantonese') return '你好，我講廣東話。你點樣？';
      if (dialectId === 'taiwanese') return '你好，我講台語。你好嗎？';
      if (dialectId === 'shanghainese') return '你好，我講上海話。儂好伐？';
      return '你好，我说普通话。你好吗？';
    }
    
    if (language.id === 'korean') {
      if (dialectId === 'busan') return '안녕하세요, 부산 사투리로 말하고 있습니다.';
      if (dialectId === 'jeju') return '안녕하세요, 제주 사투리로 말하고 있습니다.';
      return '안녕하세요, 한국어로 말하고 있습니다.';
    }
    
    if (language.id === 'hindi') {
      if (dialectId === 'punjabi') return 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਪੰਜਾਬੀ ਬੋਲ ਰਿਹਾ ਹਾਂ।';
      if (dialectId === 'rajasthani') return 'नमस्कार, मैं राजस्थानी बोल रहा हूं।';
      return 'नमस्कार, मैं हिंदी बोल रहा हूं।';
    }
    
    if (language.id === 'english' || language.id === 'english_us') {
      if (dialectId === 'british') return 'Hello, I am speaking British English. Would you like a cup of tea?';
      if (dialectId === 'irish') return 'Hello, I am speaking Irish English. How are you doing?';
      if (dialectId === 'scottish') return 'Hello, I am speaking Scottish English. How are you doing?';
      if (dialectId === 'southern') return 'Howdy, I am speaking Southern English. How are y\'all doing?';
      if (dialectId === 'new_york') return 'Hello, I am speaking New York English. How are you doing?';
      if (dialectId === 'california') return 'Hey, I am speaking California English. How are you doing?';
      return 'Hello, I am speaking American English. How are you doing today?';
    }
    
    if (language.id === 'french') {
      if (dialectId === 'quebec') return 'Bonjour, je parle français québécois. Comment ça va?';
      if (dialectId === 'belgian') return 'Bonjour, je parle français belge. Comment allez-vous?';
      if (dialectId === 'swiss') return 'Bonjour, je parle français suisse. Comment ça va?';
      return 'Bonjour, je parle français standard. Comment allez-vous?';
    }
    
    if (language.id === 'german') {
      if (dialectId === 'austrian') return 'Grüß Gott, ich spreche österreichisches Deutsch. Wie geht\'s?';
      if (dialectId === 'swiss') return 'Grüezi, ich spreche Schweizerdeutsch. Wie geht\'s?';
      if (dialectId === 'bavarian') return 'Servus, i red boarisch. Wia geht\'s?';
      return 'Hallo, ich spreche Standarddeutsch. Wie geht es Ihnen?';
    }
    
    if (language.id === 'spanish' || language.id === 'spanish_americas') {
      if (dialectId === 'castilian') return 'Hola, hablo español estándar. ¿Qué tal?';
      if (dialectId === 'catalan') return 'Hola, parlo català. Com estàs?';
      if (dialectId === 'galician') return 'Ola, falo galego. Como estás?';
      if (dialectId === 'mexican') return 'Hola, hablo español mexicano. ¿Cómo estás?';
      if (dialectId === 'argentine') return 'Hola, hablo español argentino. ¿Cómo andás?';
      if (dialectId === 'colombian') return 'Hola, hablo español colombiano. ¿Cómo estás?';
      if (dialectId === 'peruvian') return 'Hola, hablo español peruano. ¿Cómo estás?';
      return 'Hola, hablo español. ¿Qué tal?';
    }
    
    if (language.id === 'portuguese') {
      if (dialectId === 'brazilian') return 'Olá, eu falo português brasileiro. Como você está?';
      if (dialectId === 'european') return 'Olá, eu falo português europeu. Como está?';
      if (dialectId === 'angolan') return 'Olá, eu falo português angolano. Como está?';
      return 'Olá, eu falo português. Como está?';
    }
    
    if (language.id === 'arabic') {
      if (dialectId === 'egyptian') return 'أهلاً وسهلاً، أنا أتكلم باللهجة المصرية. إزيك؟';
      if (dialectId === 'moroccan') return 'أهلاً وسهلاً، أنا أتكلم باللهجة المغربية. كيف حالك؟';
      if (dialectId === 'lebanese') return 'أهلاً وسهلاً، أنا أتكلم باللهجة اللبنانية. كيفك؟';
      return 'أهلاً وسهلاً، أنا أتكلم بالعربية الفصحى. كيف حالك؟';
    }
    
    if (language.id === 'swahili') {
      if (dialectId === 'kenyan') return 'Hujambo, ninazungumza Kiswahili cha Kenya. Habari yako?';
      if (dialectId === 'ugandan') return 'Hujambo, ninazungumza Kiswahili cha Uganda. Habari yako?';
      return 'Hujambo, ninazungumza Kiswahili. Habari yako?';
    }
    
    if (language.id === 'hausa') {
      if (dialectId === 'niger') return 'Sannu, ina magana da Hausa na Nijar. Yaya kuke?';
      if (dialectId === 'ghana') return 'Sannu, ina magana da Hausa na Ghana. Yaya kuke?';
      return 'Sannu, ina magana da Hausa. Yaya kuke?';
    }
    
    return `Hello, I am speaking ${language.name}.`;
  };

  // 検索でフィルタリング
  const filteredRegions = useMemo(() => {
    if (!searchQuery) return regions;
    
    return regions.map(region => ({
      ...region,
      languages: region.languages.filter(lang => 
        lang.nameJa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nameNative?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.dialects.some(dialect => 
          dialect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dialect.region.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    })).filter(region => region.languages.length > 0);
  }, [regions, searchQuery]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">地域別言語</h3>
        <p className="text-gray-600">
          各地域で話者人口1000万人以上の言語を表示します
        </p>
      </div>

      <div className="space-y-8">
        {filteredRegions.map((region) => (
          <div key={region.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* 地域ヘッダー */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{region.icon}</span>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">{region.name}</h4>
                  <p className="text-sm text-gray-600">{region.languages.length}言語</p>
                </div>
              </div>
            </div>

            {/* 言語一覧 */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {region.languages.map((language) => (
                  <div key={language.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    {/* 言語ヘッダー */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{language.flag}</span>
                        <div>
                          <h5 className="font-semibold text-gray-800">{language.nameJa}</h5>
                          <p className="text-sm text-gray-600">{language.nameEn}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => playAudio(language.id)}
                        disabled={loadingItems.has(language.id)}
                        className={`px-3 py-1 text-sm rounded ${
                          playingItems.has(language.id)
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        } disabled:opacity-50`}
                      >
                        {loadingItems.has(language.id) ? '生成中...' : playingItems.has(language.id) ? '停止' : '再生'}
                      </button>
                    </div>

                    {/* 言語情報 */}
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center justify-between">
                        <span>🌍 {language.country}</span>
                        <span>👥 {language.speakers.toLocaleString()}人</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">{language.family}</span>
                      </div>
                    </div>

                    {/* 方言一覧 */}
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {language.dialects.map((dialect) => {
                        const itemId = `${language.id}_${dialect.id}`;
                        const isPlaying = playingItems.has(itemId);
                        const isLoading = loadingItems.has(itemId);
                        const error = errorItems.get(itemId);
                        
                        return (
                          <div key={dialect.id} className="flex items-center justify-between p-2 bg-white rounded hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">{dialect.name}</span>
                                <span className="text-xs text-gray-500">({dialect.region})</span>
                              </div>
                              {error && (
                                <p className="text-xs text-red-500 mt-1">{error}</p>
                              )}
                            </div>
                            <button
                              onClick={() => playAudio(language.id, dialect.id)}
                              disabled={isLoading}
                              className={`px-2 py-1 text-xs rounded ${
                                isPlaying
                                  ? 'bg-red-500 text-white hover:bg-red-600'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              } disabled:opacity-50`}
                            >
                              {isLoading ? '...' : isPlaying ? '⏹' : '▶'}
                            </button>
                          </div>
                        );
                      })}
                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRegions.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">検索結果が見つかりません</h3>
          <p className="text-gray-500">別のキーワードで検索してみてください</p>
        </div>
      )}
    </div>
  );
};

export default RegionalTab;
