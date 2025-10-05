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

const RegionalTab: React.FC<RegionalTabProps> = ({ searchQuery }) => {
  const [playingItems, setPlayingItems] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [errorItems, setErrorItems] = useState<Map<string, string>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 地域別の言語データを定義
  const regions: Region[] = useMemo(() => [
    {
      id: 'asia',
      name: 'アジア',
      icon: '🌏',
      languages: [
        {
          id: 'japanese',
          name: '日本語',
          nameJa: '日本語',
          nameEn: 'Japanese',
          nameNative: '日本語',
          flag: '🇯🇵',
          country: '日本',
          speakers: 125000000,
          family: '日本語族',
          dialects: [
            { id: 'standard', name: '標準語', region: '東京', description: '日本の標準語' },
            { id: 'kansai', name: '関西弁', region: '関西地方', description: '大阪、京都、神戸で話される方言' },
            { id: 'hakata', name: '博多弁', region: '福岡', description: '福岡県で話される方言' },
            { id: 'tsugaru', name: '津軽弁', region: '青森', description: '青森県津軽地方の方言' },
            { id: 'okinawa', name: '沖縄方言', region: '沖縄', description: '沖縄県で話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'chinese',
          name: '中国語',
          nameJa: '中国語',
          nameEn: 'Chinese',
          nameNative: '中文',
          flag: '🇨🇳',
          country: '中国',
          speakers: 1200000000,
          family: 'シナ・チベット',
          dialects: [
            { id: 'mandarin', name: '北京語', region: '北京', description: '中国の標準語' },
            { id: 'cantonese', name: '広東語', region: '広東', description: '香港、広東省で話される方言' },
            { id: 'taiwanese', name: '台湾語', region: '台湾', description: '台湾で話される方言' },
            { id: 'shanghainese', name: '上海語', region: '上海', description: '上海で話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'korean',
          name: '韓国語',
          nameJa: '韓国語',
          nameEn: 'Korean',
          nameNative: '한국어',
          flag: '🇰🇷',
          country: '韓国',
          speakers: 77000000,
          family: 'その他',
          dialects: [
            { id: 'standard', name: '標準語', region: 'ソウル', description: '韓国の標準語' },
            { id: 'busan', name: '釜山方言', region: '釜山', description: '釜山で話される方言' },
            { id: 'jeju', name: '済州方言', region: '済州島', description: '済州島で話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'vietnamese',
          name: 'ベトナム語',
          nameJa: 'ベトナム語',
          nameEn: 'Vietnamese',
          nameNative: 'Tiếng Việt',
          flag: '🇻🇳',
          country: 'ベトナム',
          speakers: 95000000,
          family: 'オーストロアジア',
          dialects: [
            { id: 'standard', name: '標準ベトナム語', region: 'ハノイ', description: 'ベトナムの標準語' },
            { id: 'hochiminh', name: 'ホーチミン方言', region: 'ホーチミン', description: 'ホーチミン市で話される方言' },
            { id: 'hue', name: 'フエ方言', region: 'フエ', description: 'フエで話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'thai',
          name: 'タイ語',
          nameJa: 'タイ語',
          nameEn: 'Thai',
          nameNative: 'ไทย',
          flag: '🇹🇭',
          country: 'タイ',
          speakers: 60000000,
          family: 'タイ・カダイ',
          dialects: [
            { id: 'standard', name: '標準タイ語', region: 'バンコク', description: 'タイの標準語' },
            { id: 'northern', name: '北部タイ語', region: 'チェンマイ', description: '北部で話される方言' },
            { id: 'southern', name: '南部タイ語', region: 'プーケット', description: '南部で話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'hindi',
          name: 'ヒンディー語',
          nameJa: 'ヒンディー語',
          nameEn: 'Hindi',
          nameNative: 'हिन्दी',
          flag: '🇮🇳',
          country: 'インド',
          speakers: 600000000,
          family: 'インド・ヨーロッパ',
          dialects: [
            { id: 'standard', name: '標準ヒンディー語', region: 'デリー', description: 'インドの標準語' },
            { id: 'punjabi', name: 'パンジャブ語', region: 'パンジャブ', description: 'パンジャブ州で話される方言' },
            { id: 'rajasthani', name: 'ラージャスターン語', region: 'ラージャスターン', description: 'ラージャスターン州で話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        }
      ]
    },
    {
      id: 'europe',
      name: 'ヨーロッパ',
      icon: '🇪🇺',
      languages: [
        {
          id: 'english',
          name: '英語',
          nameJa: '英語',
          nameEn: 'English',
          nameNative: 'English',
          flag: '🇬🇧',
          country: 'イギリス',
          speakers: 1500000000,
          family: 'インド・ヨーロッパ',
          dialects: [
            { id: 'british', name: 'イギリス英語', region: 'イギリス', description: 'イギリスで話される英語' },
            { id: 'irish', name: 'アイルランド英語', region: 'アイルランド', description: 'アイルランドで話される英語' },
            { id: 'scottish', name: 'スコットランド英語', region: 'スコットランド', description: 'スコットランドで話される英語' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'french',
          name: 'フランス語',
          nameJa: 'フランス語',
          nameEn: 'French',
          nameNative: 'français',
          flag: '🇫🇷',
          country: 'フランス',
          speakers: 280000000,
          family: 'インド・ヨーロッパ',
          dialects: [
            { id: 'standard', name: '標準フランス語', region: 'フランス', description: 'フランスの標準語' },
            { id: 'quebec', name: 'ケベック・フランス語', region: 'カナダ', description: 'ケベック州で話されるフランス語' },
            { id: 'belgian', name: 'ベルギー・フランス語', region: 'ベルギー', description: 'ベルギーで話されるフランス語' },
            { id: 'swiss', name: 'スイス・フランス語', region: 'スイス', description: 'スイスで話されるフランス語' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'german',
          name: 'ドイツ語',
          nameJa: 'ドイツ語',
          nameEn: 'German',
          nameNative: 'Deutsch',
          flag: '🇩🇪',
          country: 'ドイツ',
          speakers: 100000000,
          family: 'インド・ヨーロッパ',
          dialects: [
            { id: 'standard', name: '標準ドイツ語', region: 'ドイツ', description: 'ドイツの標準語' },
            { id: 'austrian', name: 'オーストリア・ドイツ語', region: 'オーストリア', description: 'オーストリアで話されるドイツ語' },
            { id: 'swiss', name: 'スイス・ドイツ語', region: 'スイス', description: 'スイスで話されるドイツ語' },
            { id: 'bavarian', name: 'バイエルン方言', region: 'バイエルン', description: 'バイエルン州で話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'spanish',
          name: 'スペイン語',
          nameJa: 'スペイン語',
          nameEn: 'Spanish',
          nameNative: 'español',
          flag: '🇪🇸',
          country: 'スペイン',
          speakers: 500000000,
          family: 'インド・ヨーロッパ',
          dialects: [
            { id: 'castilian', name: 'カスティーリャ語', region: 'スペイン', description: 'スペインの標準語' },
            { id: 'catalan', name: 'カタルーニャ語', region: 'カタルーニャ', description: 'カタルーニャ州で話される言語' },
            { id: 'galician', name: 'ガリシア語', region: 'ガリシア', description: 'ガリシア州で話される言語' }
          ],
          isPlaying: false,
          isLoading: false
        }
      ]
    },
    {
      id: 'africa',
      name: 'アフリカ',
      icon: '🌍',
      languages: [
        {
          id: 'arabic',
          name: 'アラビア語',
          nameJa: 'アラビア語',
          nameEn: 'Arabic',
          nameNative: 'العربية',
          flag: '🇸🇦',
          country: 'サウジアラビア',
          speakers: 400000000,
          family: 'アフロ・アジア',
          dialects: [
            { id: 'standard', name: '標準アラビア語', region: '中東', description: 'アラビア語の標準語' },
            { id: 'egyptian', name: 'エジプト・アラビア語', region: 'エジプト', description: 'エジプトで話される方言' },
            { id: 'moroccan', name: 'モロッコ・アラビア語', region: 'モロッコ', description: 'モロッコで話される方言' },
            { id: 'lebanese', name: 'レバノン・アラビア語', region: 'レバノン', description: 'レバノンで話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'swahili',
          name: 'スワヒリ語',
          nameJa: 'スワヒリ語',
          nameEn: 'Swahili',
          nameNative: 'Kiswahili',
          flag: '🇹🇿',
          country: 'タンザニア',
          speakers: 200000000,
          family: 'ニジェール・コンゴ',
          dialects: [
            { id: 'standard', name: '標準スワヒリ語', region: 'タンザニア', description: 'スワヒリ語の標準語' },
            { id: 'kenyan', name: 'ケニア・スワヒリ語', region: 'ケニア', description: 'ケニアで話される方言' },
            { id: 'ugandan', name: 'ウガンダ・スワヒリ語', region: 'ウガンダ', description: 'ウガンダで話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'hausa',
          name: 'ハウサ語',
          nameJa: 'ハウサ語',
          nameEn: 'Hausa',
          nameNative: 'Hausa',
          flag: '🇳🇬',
          country: 'ナイジェリア',
          speakers: 80000000,
          family: 'ニジェール・コンゴ',
          dialects: [
            { id: 'standard', name: '標準ハウサ語', region: 'ナイジェリア', description: 'ハウサ語の標準語' },
            { id: 'niger', name: 'ニジェール・ハウサ語', region: 'ニジェール', description: 'ニジェールで話される方言' },
            { id: 'ghana', name: 'ガーナ・ハウサ語', region: 'ガーナ', description: 'ガーナで話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        }
      ]
    },
    {
      id: 'americas',
      name: 'アメリカ',
      icon: '🌎',
      languages: [
        {
          id: 'english_us',
          name: '英語（アメリカ）',
          nameJa: '英語（アメリカ）',
          nameEn: 'American English',
          nameNative: 'English',
          flag: '🇺🇸',
          country: 'アメリカ',
          speakers: 300000000,
          family: 'インド・ヨーロッパ',
          dialects: [
            { id: 'general', name: '一般アメリカ英語', region: 'アメリカ', description: 'アメリカの標準語' },
            { id: 'southern', name: '南部英語', region: '南部', description: 'アメリカ南部で話される方言' },
            { id: 'new_york', name: 'ニューヨーク英語', region: 'ニューヨーク', description: 'ニューヨークで話される方言' },
            { id: 'california', name: 'カリフォルニア英語', region: 'カリフォルニア', description: 'カリフォルニアで話される方言' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'spanish_americas',
          name: 'スペイン語（アメリカ）',
          nameJa: 'スペイン語（アメリカ）',
          nameEn: 'American Spanish',
          nameNative: 'español',
          flag: '🇲🇽',
          country: 'メキシコ',
          speakers: 400000000,
          family: 'インド・ヨーロッパ',
          dialects: [
            { id: 'mexican', name: 'メキシコ・スペイン語', region: 'メキシコ', description: 'メキシコで話されるスペイン語' },
            { id: 'argentine', name: 'アルゼンチン・スペイン語', region: 'アルゼンチン', description: 'アルゼンチンで話されるスペイン語' },
            { id: 'colombian', name: 'コロンビア・スペイン語', region: 'コロンビア', description: 'コロンビアで話されるスペイン語' },
            { id: 'peruvian', name: 'ペルー・スペイン語', region: 'ペルー', description: 'ペルーで話されるスペイン語' }
          ],
          isPlaying: false,
          isLoading: false
        },
        {
          id: 'portuguese',
          name: 'ポルトガル語',
          nameJa: 'ポルトガル語',
          nameEn: 'Portuguese',
          nameNative: 'português',
          flag: '🇧🇷',
          country: 'ブラジル',
          speakers: 260000000,
          family: 'インド・ヨーロッパ',
          dialects: [
            { id: 'brazilian', name: 'ブラジル・ポルトガル語', region: 'ブラジル', description: 'ブラジルで話されるポルトガル語' },
            { id: 'european', name: 'ヨーロッパ・ポルトガル語', region: 'ポルトガル', description: 'ポルトガルで話されるポルトガル語' },
            { id: 'angolan', name: 'アンゴラ・ポルトガル語', region: 'アンゴラ', description: 'アンゴラで話されるポルトガル語' }
          ],
          isPlaying: false,
          isLoading: false
        }
      ]
    }
  ], []);

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
                    <div className="space-y-1">
                      {language.dialects.slice(0, 3).map((dialect) => {
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
                      {language.dialects.length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-1">
                          +{language.dialects.length - 3}個の方言
                        </div>
                      )}
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
