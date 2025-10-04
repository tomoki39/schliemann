import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { convertTextToDialect } from '../services/dialectConverter';
import { webSpeechService, SpeechRequest } from '../services/webSpeechService';
import { getDialectVoiceSettings as getVoiceSettings } from '../services/dialectVoiceSettings';
import { VoiceQualityService } from '../services/ssmlBuilder';

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
}

const DialectPlayer: React.FC<DialectPlayerProps> = ({ 
  dialect, 
  className = '', 
  customText = '', 
  showCustomInput = false,
  onCustomTextChange,
  showQualitySettings = false
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

  // Web Speech APIの可用性をチェック
  useEffect(() => {
    const checkWebSpeech = () => {
      const available = webSpeechService.isWebSpeechSupported();
      setWebSpeechAvailable(available);
    };
    checkWebSpeech();
  }, []);

  const playText = async (text: string, isCustom: boolean = false) => {
    if (!webSpeechAvailable) {
      setError('Web Speech APIが利用できません');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // 方言変換
      const enhancedText = VoiceQualityService.applyDialectDictionary(text, dialect.conversion_model);
      const conversionResult = convertTextToDialect(enhancedText, dialect.conversion_model);
      const textToSpeak = conversionResult.success ? conversionResult.convertedText : enhancedText;
      
      // 音声設定の取得
      const voiceSettings = getVoiceSettings(dialect.conversion_model);
      
      // 方言の強度に基づく設定調整
      const adjustedRate = voiceSettings.rate * (0.8 + styleDegree * 0.2);
      const adjustedPitch = voiceSettings.pitch * (0.9 + styleDegree * 0.1);
      
      const request: SpeechRequest = {
        text: textToSpeak,
        language: voiceSettings.language,
        dialect: voiceSettings.dialect,
        settings: {
          rate: adjustedRate * playbackRate,
          pitch: adjustedPitch,
          volume: voiceSettings.volume * volume,
        },
      };

      // 再生状態の設定
      if (isCustom) {
        setIsPlayingCustom(true);
      } else {
        setIsPlaying(true);
      }
      
      const success = await webSpeechService.speak(request);
      
      if (success) {
        console.log('Speech started successfully');
      } else {
        setError('音声再生に失敗しました');
        if (isCustom) {
          setIsPlayingCustom(false);
        } else {
          setIsPlaying(false);
        }
      }
      
      setIsLoading(false);
    } catch (error: unknown) {
      console.error('Web Speech error:', error);
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
            {webSpeechAvailable && (
              <div className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                Web Speech API
              </div>
            )}
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
