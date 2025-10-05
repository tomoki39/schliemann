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

  // 国コード→日本語名
  const countryCodeToName = (code?: string): string => {
    if (!code) return '';
    try {
      const dn = new Intl.DisplayNames(['ja'], { type: 'region' });
      return (dn.of(code) as string) || code;
    } catch {
      return code || '';
    }
  };

  const getOfficialCountryNames = (langId: string): string => {
    const original = languages.find(l => l.id === langId);
    if (!original) return '';
    const list = (original.official_languages && original.official_languages.length > 0)
      ? original.official_languages
      : (original.countries || []);
    const names = list.map(countryCodeToName);
    const max = 5;
    return names.length > max ? `${names.slice(0, max).join(', ')} …` : names.join(', ');
  };

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
    // 1) 方言のサンプルがあれば最優先
    if (dialectId && language.dialects) {
      const d = language.dialects.find(d => d.name === dialectId);
      if (d?.sample_text) return d.sample_text;
    }
    // 2) 言語のデフォルト音声テキスト
    if ((language as any).audio?.text) return (language as any).audio.text as string;
    // 3) 3-5秒の汎用あいさつ（適度に長め）
    const greetMap: Record<string, string> = {
      jpn: 'こんにちは。今日はいい天気ですね。お元気ですか？',
      eng: 'Hello! Nice to meet you today. How are you doing?',
      fra: 'Bonjour, je suis ravi de vous rencontrer aujourd’hui. Comment ça va ?',
      spa: 'Hola, mucho gusto. ¿Cómo estás hoy? Espero que todo vaya bien.',
      deu: 'Hallo, freut mich, dich heute zu treffen. Wie geht es dir?',
      ita: 'Ciao, piacere di conoscerti. Come stai oggi?',
      por: 'Olá, é um prazer falar com você hoje. Tudo bem?',
      rus: 'Здравствуйте! Рад встрече сегодня. Как ваши дела?',
      cmn: '你好！很高兴今天见到你。你最近怎么样？',
      yue: '你好呀！好開心今日見到你。你最近點呀？',
      wuu: '侬好！今朝见到侬真欢喜。侬最近好伐？',
      arb: 'مرحبًا! يسعدني لقاؤك اليوم. كيف حالك هذه الأيام؟',
      hin: 'नमस्ते! आपसे मिलकर खुशी हुई। आज आप कैसे हैं?',
      kor: '안녕하세요! 오늘 만나서 반갑습니다. 요즘 잘 지내세요?',
      vie: 'Xin chào! Rất vui được gặp bạn hôm nay. Bạn có khỏe không?',
      tha: 'สวัสดีครับ/ค่ะ ยินดีที่ได้พบวันนี้ คุณสบายดีไหมครับ/คะ?',
      ben: 'নমস্কার! আজ আপনাকে পেয়ে খুব ভালো লাগছে। কেমন আছেন?',
      tam: 'வணக்கம்! இன்று உங்களை சந்தித்ததில் மகிழ்ச்சி. எப்படி இருக்கிறீர்கள்?',
      tel: 'నమస్తే! ఈ రోజు మీను చూసి ఆనందంగా ఉంది. మీరు ఎలా ఉన్నారు?',
      mar: 'नमस्कार! आज आपली भेट होऊन आनंद झाला. आपले कसे चालले आहे?',
      pan: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਤੁਹਾਨੂੰ ਮਿਲ ਕੇ ਖੁਸ਼ੀ ਹੋਈ। ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?'
    };
    return greetMap[language.id] || `${language.name_ja}です。よろしくお願いします。`;
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
        {sortedLanguages.map((language, idx) => (
          <div key={`${language.id}_${idx}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
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
                  <span>{language.family}</span>
                  {language.branch && <span>{language.branch}</span>}
                  {language.group && <span>{language.group}</span>}
                  {language.subgroup && <span>{language.subgroup}</span>}
                  {language.language && <span>{language.language}</span>}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {language.total_speakers && (
                    <span>👥 {language.total_speakers.toLocaleString()}人</span>
                  )}
                  <span className="truncate max-w-[65%]">{getOfficialCountryNames(language.id) || '—'}</span>
                </div>

                {/* 方言一覧 */}
                {language.dialects && language.dialects.length > 0 && (
                  <div className="mt-3">
                    <div className="flex gap-2 overflow-x-auto flex-nowrap no-scrollbar">
                      {language.dialects.map((dialect, index) => {
                        const itemId = `${language.id}_${index}`;
                        const isPlaying = playingItems.has(itemId);
                        const isLoading = loadingItems.has(itemId);
                        const error = errorItems.get(itemId);
                        
                        return (
                          <div key={index} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1 shrink-0">
                            <span className="text-sm text-gray-700">{dialect.name}</span>
                            {dialect.region && (
                              <span className="text-xs text-gray-500">({dialect.region})</span>
                            )}
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
                    </div>
                  </div>
                )}
              </div>
              
              {/* 親レベルの再生ボタンは削除（方言側で再生） */}
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
