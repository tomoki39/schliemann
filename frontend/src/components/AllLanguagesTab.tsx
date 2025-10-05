import React, { useState, useRef, useMemo } from 'react';
import { Language } from '../types/Language';
import { enhancedVoiceService, EnhancedVoiceRequest } from '../services/enhancedVoiceService';

interface AllLanguagesTabProps {
  languages: Language[];
  searchQuery: string;
}

const AllLanguagesTab: React.FC<AllLanguagesTabProps> = ({ languages, searchQuery }) => {
  const [playingItems, setPlayingItems] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [errorItems, setErrorItems] = useState<Map<string, string>>(new Map());
  const [sortBy, setSortBy] = useState<'name' | 'speakers' | 'family'>('name');
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 言語をソート
  const sortedLanguages = useMemo(() => {
    const filtered = searchQuery 
      ? languages.filter(lang => 
          lang.name_ja.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lang as any).name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lang as any).name_native?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.group?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.subgroup?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lang.dialect?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : languages;

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name_ja.localeCompare(b.name_ja);
        case 'speakers':
          return (b.total_speakers || 0) - (a.total_speakers || 0);
        case 'family':
          return a.family.localeCompare(b.family);
        default:
          return 0;
      }
    });
  }, [languages, searchQuery, sortBy]);

  // 音声再生
  const playAudio = async (languageId: string, dialectId?: string) => {
    const itemId = dialectId ? `${languageId}_${dialectId}` : languageId;
    
    if (playingItems.has(itemId)) {
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

    playingItems.forEach(playingId => {
      const audio = audioRefs.current.get(playingId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingItems(new Set());

    setLoadingItems(prev => new Set(prev).add(itemId));
    setErrorItems(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });

    try {
      const language = languages.find(lang => lang.id === languageId);
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
  const getSampleText = (language: Language, dialectId?: string): string => {
    if (language.id === 'jpn') {
      if (dialectId === 'kansai') return 'こんにちは、関西弁で話しています。';
      if (dialectId === 'hakata') return 'こんにちは、博多弁で話しています。';
      if (dialectId === 'tsugaru') return 'こんにちは、津軽弁で話しています。';
      if (dialectId === 'okinawa') return 'はいさい、沖縄方言で話しています。';
      return 'こんにちは、日本語で話しています。';
    }
    
    if (language.id === 'eng') {
      if (dialectId === 'british') return 'Hello, I am speaking British English.';
      if (dialectId === 'australian') return 'G\'day mate! I am speaking Australian English.';
      return 'Hello, I am speaking English.';
    }
    
    if (language.id === 'fr') {
      if (dialectId === 'quebec') return 'Bonjour, je parle français québécois.';
      if (dialectId === 'belgian') return 'Bonjour, je parle français belge.';
      return 'Bonjour, je parle français.';
    }
    
    if (language.id === 'spa') {
      if (dialectId === 'mexican') return 'Hola, hablo español mexicano.';
      if (dialectId === 'argentine') return 'Hola, hablo español argentino.';
      return 'Hola, hablo español.';
    }
    
    if (language.id === 'deu') {
      if (dialectId === 'austrian') return 'Grüß Gott, ich spreche österreichisches Deutsch.';
      if (dialectId === 'swiss') return 'Grüezi, ich spreche Schweizerdeutsch.';
      return 'Hallo, ich spreche Deutsch.';
    }
    
    if (language.id === 'cmn') {
      if (dialectId === 'cantonese') return '你好，我講廣東話。';
      if (dialectId === 'taiwanese') return '你好，我講台語。';
      return '你好，我说普通话。';
    }
    
    return `Hello, I am speaking ${language.name_ja}.`;
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">全言語一覧</h3>
            <p className="text-gray-600">
              すべての言語をアルファベット順で表示します
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">並び順:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'speakers' | 'family')}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="name">名前順</option>
              <option value="speakers">話者数順</option>
              <option value="family">語族順</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {sortedLanguages.map((language) => (
          <div key={language.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">{language.name_ja}</h4>
                  {(language as any).name_en && (
                    <span className="text-sm text-gray-600">({(language as any).name_en})</span>
                  )}
                  {(language as any).name_native && (
                    <span className="text-sm text-gray-500">{(language as any).name_native}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span>🌳 {language.family}</span>
                  {language.branch && <span>🌿 {language.branch}</span>}
                  {language.group && <span>🌱 {language.group}</span>}
                  {language.subgroup && <span>🍃 {language.subgroup}</span>}
                  {language.language && <span>📝 {language.language}</span>}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {language.total_speakers && (
                    <span>👥 {language.total_speakers.toLocaleString()}人</span>
                  )}
                  {language.countries && language.countries.length > 0 && (
                    <span>🌍 {language.countries.slice(0, 3).join(', ')}{language.countries.length > 3 && '...'}</span>
                  )}
                </div>

                {/* 方言一覧 */}
                {language.dialects && language.dialects.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {language.dialects.slice(0, 5).map((dialect, index) => {
                        const itemId = `${language.id}_${index}`;
                        const isPlaying = playingItems.has(itemId);
                        const isLoading = loadingItems.has(itemId);
                        const error = errorItems.get(itemId);
                        
                        return (
                          <div key={index} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                            <span className="text-sm text-gray-700">{dialect.name}</span>
                            <button
                              onClick={() => playAudio(language.id, dialect.name)}
                              disabled={isLoading}
                              className={`px-2 py-1 text-xs rounded ${
                                isPlaying
                                  ? 'bg-red-500 text-white hover:bg-red-600'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              } disabled:opacity-50`}
                            >
                              {isLoading ? '...' : isPlaying ? '⏹' : '▶'}
                            </button>
                            {error && (
                              <span className="text-xs text-red-500">{error}</span>
                            )}
                          </div>
                        );
                      })}
                      {language.dialects.length > 5 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{language.dialects.length - 5}個
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="ml-4">
                <button
                  onClick={() => playAudio(language.id)}
                  disabled={loadingItems.has(language.id)}
                  className={`px-4 py-2 rounded ${
                    playingItems.has(language.id)
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  } disabled:opacity-50`}
                >
                  {loadingItems.has(language.id) ? '生成中...' : playingItems.has(language.id) ? '停止' : '再生'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedLanguages.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">検索結果が見つかりません</h3>
          <p className="text-gray-500">別のキーワードで検索してみてください</p>
        </div>
      )}
    </div>
  );
};

export default AllLanguagesTab;
