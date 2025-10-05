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
    sample_text?: string;
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

    const seenByBucket: Record<string, Set<string>> = { asia: new Set(), europe: new Set(), africa: new Set(), americas: new Set(), oceania: new Set(), other: new Set() };
    (languages || [])
      .filter(l => (l.total_speakers || 0) >= 10000000)
      .forEach(l => {
        const firstCountry = l.countries?.[0];
        const bucket = firstCountry ? (isoToContinent[firstCountry] || 'other') : 'other';
        const normalizedName = (l.language || l.name_ja).toLowerCase();
        if (seenByBucket[bucket].has(normalizedName)) return;
        seenByBucket[bucket].add(normalizedName);
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
            const items = (l.dialects || []).map((d, i) => ({ id: d.conversion_model || String(i), name: d.name, region: d.region || '', sample_text: (d as any).sample_text }));
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
    if (dialectId) {
      const d = language.dialects.find(di => di.id === dialectId);
      if (d?.sample_text) return d.sample_text;
    }
    const original = (languages.find(l => l.id === language.id) as any);
    if (original?.audio?.text) return original.audio.text as string;
    const greetMap: Record<string, string> = {
      jpn: 'こんにちは。今日はいい天気ですね。お元気ですか？', eng: 'Hello! Nice to meet you today. How are you doing?',
      fra: 'Bonjour, je suis ravi de vous rencontrer aujourd’hui. Comment ça va ?', spa: 'Hola, mucho gusto. ¿Cómo estás hoy?',
      deu: 'Hallo, freut mich, dich heute zu treffen. Wie geht es dir?', ita: 'Ciao, piacere di conoscerti. Come stai oggi?',
      por: 'Olá, é um prazer falar com você hoje. Tudo bem?', rus: 'Здравствуйте! Рад встрече сегодня. Как ваши дела?',
      cmn: '你好！很高兴今天见到你。你最近怎么样？', yue: '你好呀！好開心今日見到你。你最近點呀？', arb: 'مرحبًا! يسعدني لقاؤك اليوم. كيف حالك؟'
    };
    return greetMap[language.id] || language.nameJa;
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
                      {/* 親レベルの再生ボタンは削除（方言側で再生） */}
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
                                {dialect.region && (
                                  <span className="text-xs text-gray-500">({dialect.region})</span>
                                )}
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
