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

  // conversion_modelから言語コード（ISO 639-3）を取得 - 完全版
  const getLanguageCodeFromConversionModel = (conversionModel: string): string => {
    const modelToLanguage: Record<string, string> = {
      // 日本語
      'standard': 'jpn', 'tokyo': 'jpn', 'osaka': 'jpn', 'kyoto': 'jpn', 'kansai': 'jpn',
      'hakata': 'jpn', 'tsugaru': 'jpn', 'nagoya': 'jpn', 'hiroshima': 'jpn', 
      'kagoshima': 'jpn', 'okinawa': 'jpn', 'sendai': 'jpn', 'sapporo': 'jpn',
      
      // 英語
      'british': 'eng', 'american': 'eng', 'australian': 'eng', 'canadian': 'eng',
      'english_indian': 'eng',
      
      // 中国語
      'beijing': 'cmn', 'taiwan': 'cmn', 'singapore': 'cmn', 'mandarin': 'cmn',
      'cantonese': 'yue', 'cantonese_standard': 'yue',
      
      // スペイン語
      'castilian': 'spa', 'mexican': 'spa', 'argentine': 'spa', 
      'spanish_colombia': 'spa', 'spanish_andalusian': 'spa', 'spanish_caribbean': 'spa',
      
      // フランス語
      'parisian': 'fra', 'quebec': 'fra', 'african': 'fra',
      'french_belgian': 'fra', 'french_swiss': 'fra',
      
      // ポルトガル語
      'portuguese_br': 'por', 'portuguese_pt': 'por', 'portuguese_angola': 'por',
      'portuguese_mozambique': 'por',
      
      // アラビア語
      'egyptian': 'arb', 'gulf': 'arb', 'levantine': 'arb', 'arabic_maghrebi': 'arb',
      
      // ロシア語
      'russian_standard': 'rus', 'russian_spb': 'rus', 'russian_south': 'rus',
      
      // ドイツ語
      'german_standard': 'deu', 'german_austrian': 'deu', 'german_swiss': 'deu',
      'german_bavarian': 'deu',
      
      // イタリア語
      'italian_standard': 'ita', 'italian_neapolitan': 'ita', 'italian_romanesco': 'ita',
      'italian_sicilian': 'ita', 'italian_venetian': 'ita', 'italian_milanese': 'ita',
      'italian_sardinian': 'ita',
      
      // 韓国語
      'korean_seoul': 'kor', 'korean_busan': 'kor', 'korean_jeju': 'kor',
      
      // ヒンディー語
      'hindi_standard': 'hin', 'hindi_bhojpuri': 'hin', 'hindi_awadhi': 'hin',
      
      // ベトナム語
      'vietnamese_hanoi': 'vie', 'vietnamese_saigon': 'vie', 'vietnamese_hue': 'vie',
      
      // タイ語
      'thai_central': 'tha', 'thai_northern': 'tha', 'thai_isan': 'tha',
      
      // インドネシア語
      'indonesian_jakarta': 'ind', 'indonesian_javanese': 'ind', 'indonesian_surabaya': 'ind',
      
      // トルコ語
      'turkish_istanbul': 'tur', 'turkish_anatolian': 'tur',
      
      // ベンガル語
      'bengali_standard': 'ben', 'bengali_sylheti': 'ben',
      
      // インド諸語
      'punjabi_standard': 'pan', 'tamil_standard': 'tam', 'telugu_standard': 'tel',
      'marathi_standard': 'mar', 'urdu_standard': 'urd', 'gujarati_standard': 'guj',
      'kannada_standard': 'kan', 'malayalam_standard': 'mal', 'oriya_standard': 'ori',
      'assamese_standard': 'asm',
      
      // その他アジア
      'mongolian_khalkha': 'mon', 'tibetan_lhasa': 'bod', 'burmese_yangon': 'mya',
      'khmer_standard': 'khm', 'lao_standard': 'lao',
      
      // 中央アジア
      'azerbaijani_baku': 'aze', 'kazakh_standard': 'kaz', 'uzbek_tashkent': 'uzb',
      'pashto_standard': 'pus', 'kurdish_kurmanji': 'kur',
      
      // アフリカ
      'amharic_standard': 'amh', 'swahili_standard': 'swa', 'yoruba_standard': 'yor',
      'igbo_standard': 'ibo', 'zulu_standard': 'zul', 'xhosa_standard': 'xho',
      'afrikaans_standard': 'afr', 'hausa_standard': 'hau', 'somali_standard': 'som',
      
      // その他
      'malagasy_standard': 'mlg', 'icelandic_standard': 'isl', 'tok_pisin': 'tpi',
      'greenlandic_west': 'kal', 'maori_standard': 'mri',
      
      // ヨーロッパ諸語
      'polish_standard': 'pol', 'ukrainian_standard': 'ukr', 'czech_standard': 'ces',
      'hungarian_standard': 'hun', 'romanian_standard': 'ron', 'greek_standard': 'ell',
      'swedish_standard': 'swe', 'danish_standard': 'dan', 'norwegian_standard': 'nor',
      'finnish_standard': 'fin', 'dutch_standard': 'nld', 'catalan_standard': 'cat',
      'lithuanian_standard': 'lit', 'latvian_standard': 'lav', 'estonian_standard': 'est',
      'albanian_standard': 'sqi', 'bulgarian_standard': 'bul', 'croatian_standard': 'hrv',
      'serbian_standard': 'srp', 'slovenian_standard': 'slv', 'macedonian_standard': 'mkd',
      'slovak_standard': 'slk', 'basque_standard': 'eus', 'galician_standard': 'glg',
      
      // 東南アジア
      'malay_standard': 'msa', 'filipino_standard': 'fil', 'javanese_standard': 'jav',
      'sundanese_standard': 'sun', 'cebuano_standard': 'ceb',
      
      // 中東
      'hebrew_standard': 'heb', 'persian_standard': 'fas', 'armenian_standard': 'hye',
      'georgian_standard': 'kat'
    };
    
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
