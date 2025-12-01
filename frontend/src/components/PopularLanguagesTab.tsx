import React, { useState, useRef, useMemo } from 'react';
import { Language } from '../types/Language';
import { enhancedVoiceService, EnhancedVoiceRequest } from '../services/enhancedVoiceService';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { getLanguageName, getFamilyName, getDialectName } from '../utils/languageNames';
import { getRegionName } from '../utils/countryNames';

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
    sample_text?: string;
    description?: string;
  }>;
  isPlaying: boolean;
  isLoading: boolean;
  error?: string;
}

const PopularLanguagesTab: React.FC<PopularLanguagesTabProps> = ({ languages, searchQuery }) => {
  const { t } = useTranslation();
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
  const toDialectCards = (lang: Language): { id: string; name: string; region: string; sample_text?: string }[] => {
    const items = (lang.dialects || []).map((d, i) => ({ id: d.conversion_model || String(i), name: d.name, region: d.region || '', sample_text: (d as any).sample_text }));
    if (items.length > 0) return items;
    // フォールバック: 方言未定義の場合は標準を1件
    return [{ id: 'standard', name: t('voice.standard'), region: '' }];
  };

  // 国コードを現在の言語の名前に変換
  const countryCodeToName = (code?: string): string => {
    if (!code) return '';
    try {
      const locale = i18n.language === 'en' ? 'en' : 'ja';
      const dn = new Intl.DisplayNames([locale], { type: 'region' });
      return (dn.of(code) as string) || code;
    } catch {
      return code;
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

  // データセットから話者人口TOP30を動的生成（重複言語を除外）
  const majorLanguages: LanguageCard[] = (() => {
    const seen = new Set<string>();
    const uniq = (lang: Language) => {
      const key = ((lang.language || lang.name_ja) || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    };
    return (languages || [])
      .slice()
      .sort((a, b) => (b.total_speakers || 0) - (a.total_speakers || 0))
      .filter(uniq)
      .slice(0, 30)
      .map((lang) => ({
      id: lang.id,
      name: lang.language || lang.name_ja,
      nameJa: lang.name_ja,
      nameEn: undefined,
      nameNative: undefined,
      flag: countryCodeToFlag(lang.countries?.[0]),
      region: getOfficialCountryNames(lang.id) || '—',
      speakers: lang.total_speakers || 0,
      dialects: toDialectCards(lang),
      isPlaying: false,
      isLoading: false
    }));
  })();

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
          setErrorItems(prev => new Map(prev).set(itemId, t('voice.playbackFailed')));
          setPlayingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        };
        
        await audio.play();
        setPlayingItems(prev => new Set(prev).add(itemId));
      } else {
        setErrorItems(prev => new Map(prev).set(itemId, result.error || t('voice.generationFailed')));
      }
    } catch (error) {
      setErrorItems(prev => new Map(prev).set(itemId, t('voice.generationError')));
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
    // 1) 方言のサンプル
    if (dialectId) {
      const d = language.dialects.find(di => di.id === dialectId);
      if (d?.sample_text) return d.sample_text;
    }
    // 2) 言語のデフォルト（データ側にある場合）
    const original = (languages.find(l => l.id === language.id) as any);
    if (original?.audio?.text) return original.audio.text as string;
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
      tha: 'สวัสดีครับ/ค่ะ ยินดีที่ได้พบวันนี้ คุณสบายดีไหมครับ/คะ?'
    };
    const fallbackText = i18n.language === 'en' 
      ? `Hello, this is ${getLanguageName(language.nameJa, 'en')}. Nice to meet you.`
      : `${language.nameJa}です。よろしくお願いします。`;
    return greetMap[language.id] || fallbackText;
  };

  // 検索でフィルタリング
  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return majorLanguages;
    const q = searchQuery.toLowerCase();
    return majorLanguages.filter(lang => 
      lang.nameJa.toLowerCase().includes(q) ||
      getLanguageName(lang.nameJa, 'en').toLowerCase().includes(q) ||
      lang.nameEn?.toLowerCase().includes(q) ||
      lang.nameNative?.toLowerCase().includes(q) ||
      lang.region.toLowerCase().includes(q) ||
      lang.dialects.some(dialect => 
        dialect.name.toLowerCase().includes(q) ||
        dialect.region.toLowerCase().includes(q)
      )
    );
  }, [majorLanguages, searchQuery, i18n.language]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('voice.popular.title')}</h3>
        <p className="text-gray-600">
          {t('voice.popular.description')}
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
                    <h4 className="text-lg font-semibold text-gray-800">{getLanguageName(language.nameJa, i18n.language)}</h4>
                    {i18n.language === 'ja' && language.nameEn && (
                      <p className="text-sm text-gray-600">{language.nameEn}</p>
                    )}
                  </div>
                </div>
                {/* 親レベルの再生ボタンは削除（方言側で再生） */}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="truncate max-w-[65%]">{language.region}</span>
                <span>👥 {language.speakers.toLocaleString()}{t('common.speakers')}</span>
              </div>
            </div>

            {/* 方言一覧 */}
            <div className="p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">{t('voice.dialectsVarieties')}</h5>
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
                          <span className="text-sm font-medium text-gray-800">{getDialectName(dialect.name, i18n.language)}</span>
                          {dialect.region && (
                            <span className="text-xs text-gray-500">({getRegionName(dialect.region, i18n.language)})</span>
                          )}
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
