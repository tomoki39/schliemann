import React, { useState, useRef } from 'react';
import { Language } from '../types/Language';
import { enhancedVoiceService, EnhancedVoiceRequest } from '../services/enhancedVoiceService';

interface PopularLanguagesTabProps {
  languages: Language[];
  searchQuery: string;
}

interface LanguageCard {
  id: string;
  name: string;
  nameJa: string;
  nameEn?: string;
  nameNative?: string;
  flag: string;
  region: string;
  speakers: number;
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

const PopularLanguagesTab: React.FC<PopularLanguagesTabProps> = ({ languages, searchQuery }) => {
  const [playingItems, setPlayingItems] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [errorItems, setErrorItems] = useState<Map<string, string>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 国コードから国旗絵文字を生成
  const countryCodeToFlag = (code?: string): string => {
    if (!code || code.length !== 2) return '🌍';
    const base = 127397; // 'A' regional indicator
    const upper = code.toUpperCase();
    return String.fromCodePoint(upper.charCodeAt(0) + base) + String.fromCodePoint(upper.charCodeAt(1) + base);
  };

  // デフォルト方言のフォールバック
  const toDialectCards = (lang: Language): { id: string; name: string; region: string }[] => {
    const items = (lang.dialects || []).map((d, i) => ({ id: d.conversion_model || String(i), name: d.name, region: d.region || '' }));
    if (items.length > 0) return items;
    // フォールバック: 方言未定義の場合は標準を1件
    return [{ id: 'standard', name: '標準', region: '' }];
  };

  // データセットから話者人口TOP10を動的生成
  const majorLanguages: LanguageCard[] = (languages || [])
    .slice()
    .sort((a, b) => (b.total_speakers || 0) - (a.total_speakers || 0))
    .slice(0, 10)
    .map((lang) => ({
      id: lang.id,
      name: lang.language || lang.name_ja,
      nameJa: lang.name_ja,
      nameEn: undefined,
      nameNative: undefined,
      flag: countryCodeToFlag(lang.countries?.[0]),
      region: '—',
      speakers: lang.total_speakers || 0,
      dialects: toDialectCards(lang),
      isPlaying: false,
      isLoading: false
    }));

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
      const language = majorLanguages.find(lang => lang.id === languageId);
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
  const getSampleText = (language: LanguageCard, dialectId?: string): string => {
      // const dialect = dialectId ? language.dialects.find(d => d.id === dialectId) : null;
    
    if (language.id === 'japanese') {
      if (dialectId === 'kansai') return 'こんにちは、関西弁で話しています。大阪の方言です。';
      if (dialectId === 'hakata') return 'こんにちは、博多弁で話しています。福岡の方言です。';
      if (dialectId === 'tsugaru') return 'こんにちは、津軽弁で話しています。青森の方言です。';
      if (dialectId === 'okinawa') return 'はいさい、沖縄方言で話しています。琉球語の影響を受けています。';
      return 'こんにちは、日本語で話しています。';
    }
    
    if (language.id === 'english') {
      if (dialectId === 'british') return 'Hello, I am speaking British English. Would you like a cup of tea?';
      if (dialectId === 'australian') return 'G\'day mate! I am speaking Australian English. How\'s it going?';
      if (dialectId === 'canadian') return 'Hello, I am speaking Canadian English. How are you doing, eh?';
      return 'Hello, I am speaking American English. How are you doing today?';
    }
    
    if (language.id === 'french') {
      if (dialectId === 'quebec') return 'Bonjour, je parle français québécois. Comment ça va?';
      if (dialectId === 'belgian') return 'Bonjour, je parle français belge. Comment allez-vous?';
      if (dialectId === 'swiss') return 'Bonjour, je parle français suisse. Comment ça va?';
      return 'Bonjour, je parle français standard. Comment allez-vous?';
    }
    
    if (language.id === 'spanish') {
      if (dialectId === 'mexican') return 'Hola, hablo español mexicano. ¿Cómo estás?';
      if (dialectId === 'argentine') return 'Hola, hablo español argentino. ¿Cómo andás?';
      if (dialectId === 'colombian') return 'Hola, hablo español colombiano. ¿Cómo estás?';
      return 'Hola, hablo español estándar. ¿Qué tal?';
    }
    
    if (language.id === 'german') {
      if (dialectId === 'austrian') return 'Grüß Gott, ich spreche österreichisches Deutsch. Wie geht\'s?';
      if (dialectId === 'swiss') return 'Grüezi, ich spreche Schweizerdeutsch. Wie geht\'s?';
      if (dialectId === 'bavarian') return 'Servus, i red boarisch. Wia geht\'s?';
      return 'Hallo, ich spreche Standarddeutsch. Wie geht es Ihnen?';
    }
    
    if (language.id === 'chinese') {
      if (dialectId === 'cantonese') return '你好，我講廣東話。你點樣？';
      if (dialectId === 'taiwanese') return '你好，我講台語。你好嗎？';
      if (dialectId === 'shanghainese') return '你好，我講上海話。儂好伐？';
      return '你好，我说普通话。你好吗？';
    }
    
    return `Hello, I am speaking ${language.name}.`;
  };

  // 検索でフィルタリング
  const filteredLanguages = searchQuery 
    ? majorLanguages.filter(lang => 
        lang.nameJa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nameNative?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.dialects.some(dialect => 
          dialect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dialect.region.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : majorLanguages;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">主要言語</h3>
        <p className="text-gray-600">
          話者人口TOP10の言語とその方言を探索しましょう
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLanguages.map((language) => (
          <div key={language.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* 言語ヘッダー */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{language.flag}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">{language.nameJa}</h4>
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
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>🌍 {language.region}</span>
                <span>👥 {language.speakers.toLocaleString()}人</span>
              </div>
            </div>

            {/* 方言一覧 */}
            <div className="p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">方言・変種</h5>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {language.dialects.map((dialect) => {
                  const itemId = `${language.id}_${dialect.id}`;
                  const isPlaying = playingItems.has(itemId);
                  const isLoading = loadingItems.has(itemId);
                  const error = errorItems.get(itemId);
                  
                  return (
                    <div key={dialect.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{dialect.name}</span>
                          <span className="text-xs text-gray-500">({dialect.region})</span>
                        </div>
                        {dialect.description && (
                          <p className="text-xs text-gray-600 mt-1">{dialect.description}</p>
                        )}
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
          </div>
        ))}
      </div>

      {filteredLanguages.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">検索結果が見つかりません</h3>
          <p className="text-gray-500">別のキーワードで検索してみてください</p>
        </div>
      )}
    </div>
  );
};

export default PopularLanguagesTab;
