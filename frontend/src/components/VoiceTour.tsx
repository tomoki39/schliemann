import React, { useState, useRef, useEffect } from 'react';
import { enhancedVoiceService, EnhancedVoiceRequest } from '../services/enhancedVoiceService';
import { Language } from '../types/Language';
import { DEMO_CONFIG, getDemoText, getDemoTour } from '../config/demo';

interface VoiceTourProps {
  languages: Language[];
  onClose: () => void;
}

interface TourItem {
  language: Language;
  dialect?: string;
  text: string;
  audioUrl?: string;
  isPlaying: boolean;
  isLoading: boolean;
  error?: string;
}

interface TourCategory {
  id: string;
  name: string;
  description: string;
  languages: Language[];
}

const VoiceTour: React.FC<VoiceTourProps> = ({ languages, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tourItems, setTourItems] = useState<TourItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ツアーカテゴリ
  const tourCategories: TourCategory[] = [
    {
      id: 'all',
      name: '全言語ツアー',
      description: 'すべての言語を順番に体験',
      languages: languages
    },
    {
      id: 'indo-european',
      name: 'インド・ヨーロッパ語族',
      description: 'ヨーロッパからインドにかけての言語群',
      languages: languages.filter(l => l.family === 'インド・ヨーロッパ')
    },
    {
      id: 'sino-tibetan',
      name: 'シナ・チベット語族',
      description: '中国語とその関連言語',
      languages: languages.filter(l => l.family === 'シナ・チベット')
    },
    {
      id: 'afro-asiatic',
      name: 'アフロ・アジア語族',
      description: 'アラビア語とその関連言語',
      languages: languages.filter(l => l.family === 'アフロ・アジア')
    },
    {
      id: 'japanese',
      name: '日本語方言',
      description: '日本の各地域の方言',
      languages: languages.filter(l => l.family === '日本語族')
    },
    {
      id: 'asian',
      name: 'アジア言語',
      description: 'アジア地域の多様な言語',
      languages: languages.filter(l => 
        ['シナ・チベット', '日本語族', '朝鮮語族', 'タイ・カダイ', 'オーストロアジア'].includes(l.family)
      )
    }
  ];

  // 選択されたカテゴリの言語を取得
  const selectedLanguages = tourCategories.find(c => c.id === selectedCategory)?.languages || languages;

  // ツアーアイテムを生成
  const generateTourItems = () => {
    const items: TourItem[] = selectedLanguages.map(language => {
      // 方言がある場合は最初の方言を選択
      const dialect = language.dialects && language.dialects.length > 0 ? language.dialects[0].name : undefined;
      
      // 言語に応じたサンプルテキスト
      const sampleText = getSampleText(language.name_ja, dialect);
      
      return {
        language,
        dialect,
        text: sampleText,
        isPlaying: false,
        isLoading: false,
        error: undefined
      };
    });

    setTourItems(items);
    setCurrentIndex(0);
  };

  // 言語に応じたサンプルテキストを取得
  const getSampleText = (languageName: string, dialect?: string): string => {
    const sampleTexts: Record<string, string> = {
      '日本語': dialect ? `こんにちは、${dialect}で話しています` : 'こんにちは、日本語です',
      '英語': 'Hello, this is English',
      '中国語': '你好，这是中文',
      'スペイン語': 'Hola, esto es español',
      'フランス語': 'Bonjour, c\'est le français',
      'ドイツ語': 'Hallo, das ist Deutsch',
      'イタリア語': 'Ciao, questo è italiano',
      'ポルトガル語': 'Olá, isto é português',
      'ロシア語': 'Привет, это русский',
      'アラビア語': 'مرحبا، هذا عربي',
      'ヒンディー語': 'नमस्ते, यह हिंदी है',
      '韓国語': '안녕하세요, 이것은 한국어입니다',
      'タイ語': 'สวัสดี นี่คือภาษาไทย',
      'ベトナム語': 'Xin chào, đây là tiếng Việt',
      'インドネシア語': 'Halo, ini bahasa Indonesia',
      'マレー語': 'Halo, ini bahasa Melayu',
      'タガログ語': 'Kumusta, ito ay Tagalog',
      'スワヒリ語': 'Hujambo, hii ni Kiswahili',
      'アムハラ語': 'ሰላም፣ ይህ አማርኛ ነው',
      'ヨルバ語': 'Bawo, eyi ni Yoruba',
      'イボ語': 'Ndewo, nke a bụ Igbo',
      'ハウサ語': 'Sannu, wannan Hausa ne',
      'ズールー語': 'Sawubona, lokhu isiZulu',
      'コサ語': 'Molo, oku kwiXhosa',
      'アフリカーンス語': 'Hallo, dit is Afrikaans',
      'マダガスカル語': 'Salama, izany dia Malagasy',
      'モンゴル語': 'Сайн байна уу, энэ бол монгол хэл',
      'グリーンランド語': 'Haluu, uuma kalaallisut'
    };

    return sampleTexts[languageName] || `Hello, this is ${languageName}`;
  };

  // 音声生成
  const generateVoice = async (item: TourItem) => {
    setTourItems(prev => prev.map(t => 
      t.language.id === item.language.id ? { ...t, isLoading: true } : t
    ));

    try {
      const request: EnhancedVoiceRequest = {
        text: item.text,
        language: getLanguageName(item.language.name_ja),
        dialect: item.dialect,
        useElevenLabs: true
      };

      const response = await enhancedVoiceService.generateVoice(request);
      
      setTourItems(prev => prev.map(t => 
        t.language.id === item.language.id ? {
          ...t,
          audioUrl: response.audioUrl,
          isLoading: false,
          error: response.error
        } : t
      ));
    } catch (error) {
      setTourItems(prev => prev.map(t => 
        t.language.id === item.language.id ? {
          ...t,
          isLoading: false,
          error: error instanceof Error ? error.message : '音声生成エラー'
        } : t
      ));
    }
  };

  // 言語名を英語名に変換
  const getLanguageName = (japaneseName: string): string => {
    const languageMap: Record<string, string> = {
      '日本語': 'japanese',
      '英語': 'english',
      '中国語': 'chinese',
      'スペイン語': 'spanish',
      'フランス語': 'french',
      'ドイツ語': 'german',
      'イタリア語': 'italian',
      'ポルトガル語': 'portuguese',
      'ロシア語': 'russian',
      'アラビア語': 'arabic',
      'ヒンディー語': 'hindi',
      '韓国語': 'korean',
      'タイ語': 'thai',
      'ベトナム語': 'vietnamese',
      'インドネシア語': 'indonesian',
      'マレー語': 'malay',
      'タガログ語': 'tagalog',
      'スワヒリ語': 'swahili',
      'アムハラ語': 'amharic',
      'ヨルバ語': 'yoruba',
      'イボ語': 'igbo',
      'ハウサ語': 'hausa',
      'ズールー語': 'zulu',
      'コサ語': 'xhosa',
      'アフリカーンス語': 'afrikaans',
      'マダガスカル語': 'malagasy',
      'モンゴル語': 'mongolian',
      'グリーンランド語': 'greenlandic'
    };

    return languageMap[japaneseName] || 'english';
  };

  // 音声再生
  const playCurrent = async () => {
    const currentItem = tourItems[currentIndex];
    if (!currentItem) return;

    // 音声が未生成の場合は生成
    if (!currentItem.audioUrl && !currentItem.isLoading) {
      await generateVoice(currentItem);
      return;
    }

    if (currentItem.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(currentItem.audioUrl);
      audio.playbackRate = playbackSpeed;
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        if (isAutoPlay && currentIndex < tourItems.length - 1) {
          setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
          }, 1000);
        }
      });

      audioRef.current = audio;
      await audio.play();
      setIsPlaying(true);
    }
  };

  // 音声停止
  const stopCurrent = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // 次の項目へ
  const nextItem = () => {
    if (currentIndex < tourItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // 前の項目へ
  const prevItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // カテゴリ変更時の処理
  useEffect(() => {
    generateTourItems();
  }, [selectedCategory]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const currentItem = tourItems[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">音声ツアー</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* カテゴリ選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ツアーカテゴリ
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {tourCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.languages.length}言語)
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {tourCategories.find(c => c.id === selectedCategory)?.description}
          </p>
        </div>

        {/* 現在の項目 */}
        {currentItem && (
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {currentItem.language.name_ja}
                  {currentItem.dialect && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ({currentItem.dialect})
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentItem.language.family} • {currentItem.language.branch}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {currentIndex + 1} / {tourItems.length}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg mb-4">
              <p className="text-lg text-gray-800">{currentItem.text}</p>
            </div>

            {/* 音声生成・再生 */}
            <div className="space-y-4">
              {currentItem.isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">音声生成中...</span>
                </div>
              )}

              {currentItem.error && (
                <div className="text-red-500 text-sm">
                  エラー: {currentItem.error}
                </div>
              )}

              {currentItem.audioUrl && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={isPlaying ? stopCurrent : playCurrent}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    {isPlaying ? '停止' : '再生'}
                  </button>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">速度:</label>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1.0}>1.0x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                    </select>
                  </div>
                </div>
              )}

              {!currentItem.audioUrl && !currentItem.isLoading && (
                <button
                  onClick={() => generateVoice(currentItem)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  音声生成
                </button>
              )}
            </div>
          </div>
        )}

        {/* コントロール */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={prevItem}
              disabled={currentIndex === 0}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
            >
              前へ
            </button>
            <button
              onClick={nextItem}
              disabled={currentIndex === tourItems.length - 1}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
            >
              次へ
            </button>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAutoPlay}
                onChange={(e) => setIsAutoPlay(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">自動再生</span>
            </label>

            <button
              onClick={isPlaying ? stopCurrent : playCurrent}
              disabled={!currentItem?.audioUrl}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium"
            >
              {isPlaying ? '停止' : '再生'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTour;