import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { convertTextToDialect } from '../services/dialectConverter';
import { webSpeechService, SpeechRequest } from '../services/webSpeechService';
import { getDialectVoiceSettings as getVoiceSettings } from '../services/dialectVoiceSettings';
import { VoiceQualityService } from '../services/ssmlBuilder';
import { enhancedVoiceService, EnhancedVoiceRequest } from '../services/enhancedVoiceService';

interface Dialect {
  id: string;
  name: string;
  region: string;
  sample_text: string;
  description?: string;
  conversion_model: string;
  custom_input_enabled: boolean;
}

interface DialectPlayerProps {
  dialect: Dialect;
  className?: string;
  customText?: string;
  showCustomInput?: boolean;
  onCustomTextChange?: (text: string) => void;
  showQualitySettings?: boolean;
  showProviderSelection?: boolean;
}

const DialectPlayer: React.FC<DialectPlayerProps> = ({ 
  dialect, 
  className = '', 
  customText = '', 
  showCustomInput = false,
  onCustomTextChange,
  showQualitySettings = false,
  showProviderSelection = false
}) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingCustom, setIsPlayingCustom] = useState(false);
  const [webSpeechAvailable, setWebSpeechAvailable] = useState(false);
  const [styleDegree, setStyleDegree] = useState(1.5); // 方言の強度
  const [useSSML, setUseSSML] = useState(true); // SSML使用
  const [volume, setVolume] = useState(1.0); // 音量
  const [playbackRate, setPlaybackRate] = useState(1.0); // 再生速度
  const [selectedProvider, setSelectedProvider] = useState<'elevenlabs' | 'webspeech'>('elevenlabs');
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  // Web Speech APIの可用性をチェック
  useEffect(() => {
    const checkWebSpeech = () => {
      const available = webSpeechService.isWebSpeechSupported();
      setWebSpeechAvailable(available);
    };
    checkWebSpeech();
  }, []);

  // 利用可能な音声プロバイダーを取得
  useEffect(() => {
    const providers = enhancedVoiceService.getAvailableProviders();
    setAvailableProviders(providers);
    
    // デフォルトプロバイダーを設定
    if (providers.includes('elevenlabs')) {
      setSelectedProvider('elevenlabs');
    } else if (providers.includes('webspeech')) {
      setSelectedProvider('webspeech');
    }
  }, []);

  const playText = async (text: string, isCustom: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 方言変換
      const enhancedText = VoiceQualityService.applyDialectDictionary(text, dialect.conversion_model);
      const conversionResult = convertTextToDialect(enhancedText, dialect.conversion_model);
      const textToSpeak = conversionResult.success ? conversionResult.convertedText : enhancedText;
      
      // 再生状態の設定
      if (isCustom) {
        setIsPlayingCustom(true);
      } else {
        setIsPlaying(true);
      }

      // enhancedVoiceServiceを使用（自動的に最適なプロバイダーを選択）
      // 優先順位: Google Cloud TTS > ElevenLabs > Web Speech API
      const languageCode = getLanguageCodeFromConversionModel(dialect.conversion_model);
      
      const request: EnhancedVoiceRequest = {
        text: textToSpeak,
        language: languageCode,
        dialect: dialect.conversion_model,
        useElevenLabs: selectedProvider === 'elevenlabs',
        voiceSettings: {
          stability: 0.5 + styleDegree * 0.2,
          similarity_boost: 0.5 + styleDegree * 0.3,
          style: styleDegree * 0.5,
          use_speaker_boost: true
        }
      };

      const response = await enhancedVoiceService.generateVoice(request);
      
      if (response.success) {
        console.log(`✅ 音声生成成功 (${response.provider}): ${dialect.name}`);
        
        // Google Cloud TTS または ElevenLabs の場合
        if (response.audioUrl) {
          const audio = new Audio(response.audioUrl);
          audio.playbackRate = playbackRate;
          audio.volume = volume;
          audio.addEventListener('ended', () => {
            if (isCustom) {
              setIsPlayingCustom(false);
            } else {
              setIsPlaying(false);
            }
          });
          await audio.play();
        }
        // Web Speech APIの場合は既に再生済み
      } else {
        throw new Error(response.error || '音声生成に失敗しました');
      }
      
      setIsLoading(false);
    } catch (error: unknown) {
      console.error('Voice generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`音声再生エラー: ${errorMessage}`);
      setIsLoading(false);
      if (isCustom) {
        setIsPlayingCustom(false);
      } else {
        setIsPlaying(false);
      }
    }
  };

  // conversion_modelから言語コード（ISO 639-3）を取得 - 完全版（138個全対応）
  const getLanguageCodeFromConversionModel = (conversionModel: string): string => {
    const modelToLanguage: Record<string, string> = {
      // 日本語（13方言）
      'standard': 'jpn', 'tokyo': 'jpn', 'osaka': 'jpn', 'kyoto': 'jpn', 'kansai': 'jpn',
      'hakata': 'jpn', 'tsugaru': 'jpn', 'nagoya': 'jpn', 'hiroshima': 'jpn', 
      'kagoshima': 'jpn', 'okinawa': 'jpn', 'sendai': 'jpn', 'sapporo': 'jpn',
      
      // 英語（5方言）
      'british': 'eng', 'american': 'eng', 'australian': 'eng', 'canadian': 'eng',
      'english_indian': 'eng',
      
      // 中国語（3方言）
      'beijing': 'cmn', 'taiwan': 'cmn', 'singapore': 'cmn',
      
      // スペイン語（6方言）
      'castilian': 'spa', 'mexican': 'spa', 'argentine': 'spa', 
      'spanish_colombia': 'spa', 'spanish_andalusian': 'spa', 'spanish_caribbean': 'spa',
      
      // フランス語（5方言）
      'parisian': 'fra', 'quebec': 'fra', 'african': 'fra',
      'french_belgian': 'fra', 'french_swiss': 'fra',
      
      // ポルトガル語（4方言）
      'portuguese_br': 'por', 'portuguese_pt': 'por', 'portuguese_angola': 'por',
      'portuguese_mozambique': 'por',
      
      // アラビア語（4方言）
      'egyptian': 'arb', 'gulf': 'arb', 'levantine': 'arb', 'arabic_maghrebi': 'arb',
      
      // ロシア語（3方言）
      'russian_standard': 'rus', 'russian_spb': 'rus', 'russian_south': 'rus',
      
      // ドイツ語（4方言）
      'german_standard': 'deu', 'german_austrian': 'deu', 'german_swiss': 'deu',
      'german_bavarian': 'deu',
      
      // イタリア語（7方言）
      'italian_standard': 'ita', 'italian_neapolitan': 'ita', 'italian_romanesco': 'ita',
      'italian_sicilian': 'ita', 'italian_venetian': 'ita', 'italian_milanese': 'ita',
      'italian_sardinian': 'ita',
      
      // 韓国語（3方言）
      'korean_seoul': 'kor', 'korean_busan': 'kor', 'korean_jeju': 'kor',
      
      // ヒンディー語（3方言）
      'hindi_standard': 'hin', 'hindi_bhojpuri': 'hin', 'hindi_awadhi': 'hin',
      
      // ベトナム語（3方言）
      'vietnamese_hanoi': 'vie', 'vietnamese_saigon': 'vie', 'vietnamese_hue': 'vie',
      
      // タイ語（3方言）
      'thai_standard': 'tha', 'thai_northern': 'tha', 'thai_southern': 'tha',
      
      // インドネシア語（3方言）
      'indonesian_standard': 'ind', 'indonesian_jakarta': 'ind', 'indonesian_surabaya': 'ind',
      
      // トルコ語（3方言）
      'turkish_istanbul': 'tur', 'turkish_aegean': 'tur', 'turkish_east_anatolia': 'tur',
      
      // ベンガル語（3方言）
      'bengali_in': 'ben', 'bengali_bd': 'ben', 'bengali_sylheti': 'ben',
      
      // パンジャブ語（2方言）
      'punjabi_east': 'pan', 'punjabi_west': 'pan',
      
      // タミル語（2方言）
      'tamil_standard': 'tam', 'tamil_jaffna': 'tam',
      
      // テルグ語（2方言）
      'telugu_standard': 'tel', 'telugu_telangana': 'tel',
      
      // マラーティー語（2方言）
      'marathi_standard': 'mar', 'marathi_varhadi': 'mar',
      
      // ウルドゥー語（2方言）
      'urdu_standard': 'urd', 'urdu_delhi': 'urd',
      
      // グジャラート語（2方言）
      'gujarati_standard': 'guj', 'gujarati_surti': 'guj',
      
      // カンナダ語（2方言）
      'kannada_standard': 'kan', 'kannada_mysore': 'kan',
      
      // マラヤーラム語（2方言）
      'malayalam_standard': 'mal', 'malayalam_malabar': 'mal',
      
      // オディア語（1方言）
      'odia_standard': 'ori',
      
      // アッサム語（1方言）
      'assamese_standard': 'asm',
      
      // ビルマ語（2方言）
      'burmese_rangoon': 'mya', 'burmese_mandalay': 'mya',
      
      // モンゴル語（1方言）
      'mongolian_khalkha': 'mon',
      
      // チベット語（1方言）
      'tibetan_lhasa': 'bod',
      
      // アゼルバイジャン語（2方言）
      'azerbaijani_north': 'aze', 'azerbaijani_south': 'aze',
      
      // カザフ語（1方言）
      'kazakh_standard': 'kaz',
      
      // ウズベク語（1方言）
      'uzbek_standard': 'uzb',
      
      // タジク語（1方言）
      'tajik_standard': 'tgk',
      
      // パシュトー語（2方言）
      'pashto_north': 'pus', 'pashto_south': 'pus',
      
      // クルド語（2方言）
      'kurdish_kurmanji': 'kur', 'kurdish_sorani': 'kur',
      
      // アムハラ語（1方言）
      'amharic_standard': 'amh',
      
      // スワヒリ語（2方言）
      'swahili_standard': 'swa', 'swahili_kenya': 'swa',
      
      // ヨルバ語（5方言）
      'yoruba_standard': 'yor', 'yoruba_egba': 'yor', 'yoruba_ekiti': 'yor',
      'yoruba_ijebu': 'yor', 'yoruba_ondo': 'yor',
      
      // イボ語（1方言）
      'igbo_standard': 'ibo',
      
      // ズールー語（3方言）
      'zulu_standard': 'zul', 'zulu_north': 'zul', 'zulu_urban': 'zul',
      
      // コサ語（3方言）
      'xhosa_standard': 'xho', 'xhosa_ngq': 'xho', 'xhosa_west': 'xho',
      
      // アフリカーンス語（1方言）
      'afrikaans_standard': 'afr',
      
      // ハウサ語（2方言）
      'hausa_standard': 'hau', 'hausa_niger': 'hau',
      
      // マダガスカル語（1方言）
      'malagasy_merina': 'mlg',
      
      // アイスランド語（1方言）
      'icelandic_standard': 'isl',
      
      // トクピシン（1方言）
      'tokpisin_standard': 'tpi',
      
      // グリーンランド語（1方言）
      'greenlandic_west': 'kal',
      
      // ポーランド語（2方言）
      'polish_standard': 'pol', 'polish_lesser': 'pol',
      
      // ウクライナ語（2方言）
      'ukrainian_standard': 'ukr', 'ukrainian_west': 'ukr',
      
      // チェコ語（1方言）
      'czech_standard': 'ces',
      
      // ハンガリー語（1方言）
      'hungarian_standard': 'hun',
      
      // ルーマニア語（1方言）
      'romanian_standard': 'ron',
      
      // ギリシャ語（2方言）
      'greek_standard': 'ell', 'greek_cyprus': 'ell',
      
      // スウェーデン語（2方言）
      'swedish_standard': 'swe', 'swedish_finland': 'swe',
      
      // デンマーク語（2方言）
      'danish_standard': 'dan', 'danish_jutland': 'dan',
      
      // ノルウェー語（2方言）
      'norwegian_bokmal': 'nor', 'norwegian_nynorsk': 'nor',
      
      // フィンランド語（2方言）
      'finnish_standard': 'fin', 'finnish_west': 'fin',
      
      // オランダ語（2方言）
      'dutch_standard': 'nld', 'dutch_flemish': 'nld',
      
      // カタルーニャ語（1方言）
      'catalan_standard': 'cat',
      
      // リトアニア語（1方言）
      'lithuanian_standard': 'lit',
      
      // ラトビア語（1方言）
      'latvian_standard': 'lav',
      
      // エストニア語（1方言）
      'estonian_standard': 'est',
      
      // アルバニア語（2方言）
      'albanian_gheg': 'sqi', 'albanian_tosk': 'sqi',
      
      // ブルガリア語（1方言）
      'bulgarian_standard': 'bul',
      
      // クロアチア語（1方言）
      'croatian_standard': 'hrv',
      
      // セルビア語（1方言）
      'serbian_standard': 'srp',
      
      // スロベニア語（1方言）
      'slovene_standard': 'slv',
      
      // マケドニア語（1方言）
      'macedonian_standard': 'mkd',
      
      // スロバキア語（1方言）
      'slovak_standard': 'slk',
      
      // バスク語（1方言）
      'basque_standard': 'eus',
      
      // ガリシア語（1方言）
      'galician_standard': 'glg',
      
      // マレー語（1方言）
      'malay_standard': 'msa',
      
      // フィリピン語（1方言）
      'filipino_standard': 'fil',
      
      // ジャワ語（1方言）
      'javanese_standard': 'jav',
      
      // スンダ語（1方言）
      'sundanese_standard': 'sun',
      
      // セブアノ語（1方言）
      'cebuano_standard': 'ceb',
      
      // ヘブライ語（1方言）
      'hebrew_standard': 'heb',
      
      // ペルシャ語（2方言）
      'persian_tehran': 'fas', 'persian_dari': 'fas',
      
      // アルメニア語（2方言）
      'armenian_eastern': 'hye', 'armenian_western': 'hye',
      
      // グルジア語（1方言）
      'georgian_standard': 'kat',
      
      // マオリ語（1方言）
      'maori_standard': 'mri'
    };
    
    // マッピングがない場合は警告してデフォルト
    if (!modelToLanguage[conversionModel]) {
      console.warn(`⚠️ Unknown conversion_model: "${conversionModel}" - using default 'eng'`);
    }
    
    return modelToLanguage[conversionModel] || 'eng';
  };

  // 方言名から言語名を取得（後方互換性のため残す）
  const getLanguageName = (conversionModel: string): string => {
    const dialectToLanguage: Record<string, string> = {
      'kansai': 'japanese',
      'hakata': 'japanese',
      'tsugaru': 'japanese',
      'okinawa': 'japanese',
      'british': 'english',
      'american': 'english',
      'australian': 'english',
      'mandarin': 'chinese',
      'cantonese': 'chinese',
      'castilian': 'spanish',
      'mexican': 'spanish',
      'parisian': 'french',
      'quebec': 'french'
    };

    return dialectToLanguage[conversionModel] || 'japanese';
  };


  const handlePlayPause = () => {
    if (isPlaying) {
      // 音声再生の停止
      webSpeechService.stop();
      setIsPlaying(false);
    } else {
      playText(dialect.sample_text, false);
    }
  };

  const handlePlayCustom = () => {
    if (!customText.trim()) {
      setError('テキストを入力してください');
      return;
    }

    if (isPlayingCustom) {
      // 音声再生の停止
      webSpeechService.stop();
      setIsPlayingCustom(false);
    } else {
      playText(customText, true);
    }
  };

  return (
    <div className={`p-3 border rounded-lg ${className}`}>
      {/* 方言情報 */}
      <div className="flex items-center space-x-3 mb-3">
        <button
          onClick={handlePlayPause}
          disabled={isLoading || !!error}
          className={`p-2 rounded-full transition-colors ${
            error
              ? 'bg-red-100 text-red-500 cursor-not-allowed'
              : isPlaying
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
          title={isPlaying ? t('audio.pause') : t('audio.play')}
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">{dialect.name}</span>
              <span className="text-xs text-gray-500">({dialect.region})</span>
            </div>
            <div className="flex items-center gap-2">
              {showProviderSelection && availableProviders.length > 1 && (
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as 'elevenlabs' | 'webspeech')}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  {availableProviders.map(provider => (
                    <option key={provider} value={provider}>
                      {provider === 'elevenlabs' ? 'ElevenLabs' : 'Web Speech API'}
                    </option>
                  ))}
                </select>
              )}
              <div className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                {selectedProvider === 'elevenlabs' ? 'ElevenLabs' : 'Web Speech API'}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-700">
            "{(() => {
              const conversionResult = convertTextToDialect(dialect.sample_text, dialect.conversion_model);
              return conversionResult.success ? conversionResult.convertedText : dialect.sample_text;
            })()}"
          </div>
          {dialect.description && (
            <div className="text-xs text-gray-500">{dialect.description}</div>
          )}
        </div>
      </div>

      {/* カスタムテキスト再生セクション */}
      {showCustomInput && customText && (
        <div className="border-t pt-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePlayCustom}
                disabled={isLoading || !customText.trim()}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  !customText.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isPlayingCustom
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
              >
                {isPlayingCustom ? '停止' : '再生'}
              </button>
              <span className="text-xs text-gray-600">カスタムテキスト:</span>
            </div>
            <div className="text-xs text-gray-500">
              {(() => {
                const conversionResult = convertTextToDialect(customText, dialect.conversion_model);
                return conversionResult.success ? conversionResult.convertedText : customText;
              })()}
            </div>
          </div>
        </div>
      )}

      {showQualitySettings && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              方言の強度: {styleDegree.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={styleDegree}
              onChange={(e) => setStyleDegree(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>標準</span>
              <span>中程度</span>
              <span>強烈</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音量: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              再生速度: {playbackRate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useSSML"
              checked={useSSML}
              onChange={(e) => setUseSSML(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useSSML" className="text-sm text-gray-700">
              SSML高品質音声を使用
            </label>
          </div>
        </div>
      )}

      {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default DialectPlayer;
