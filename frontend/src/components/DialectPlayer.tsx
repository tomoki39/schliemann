import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { convertTextToDialect, getDialectVoiceSettings } from '../services/dialectConverter';
import { aiVoiceService, VoiceConversionRequest } from '../services/aiVoiceService';

interface Dialect {
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
}

const DialectPlayer: React.FC<DialectPlayerProps> = ({ 
  dialect, 
  className = '', 
  customText = '', 
  showCustomInput = false 
}) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingCustom, setIsPlayingCustom] = useState(false);
  const [aiServiceAvailable, setAiServiceAvailable] = useState(false);

  // AI音声サービスの可用性をチェック
  useEffect(() => {
    const checkAIService = async () => {
      const available = await aiVoiceService.checkServiceStatus();
      setAiServiceAvailable(available);
    };
    checkAIService();
  }, []);

  const playText = async (text: string, isCustom: boolean = false) => {
    if (!aiServiceAvailable) {
      setError('AI音声サービスが利用できません');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // 方言変換を適用
    const conversionResult = convertTextToDialect(text, dialect.conversion_model);
    const textToSpeak = conversionResult.success ? conversionResult.convertedText : text;
    
    try {
      const voiceSettings = getDialectVoiceSettings(dialect.conversion_model);
      const request: VoiceConversionRequest = {
        text: textToSpeak,
        sourceLanguage: 'ja',
        targetDialect: dialect.conversion_model,
        voiceSettings: {
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          volume: 1.0,
        },
      };

      const response = await aiVoiceService.convertVoice(request);
      
      if (response.success && response.audioUrl) {
        // AI音声を再生
        const audio = new Audio(response.audioUrl);
        
        audio.onplay = () => {
          if (isCustom) {
            setIsPlayingCustom(true);
          } else {
            setIsPlaying(true);
          }
          setIsLoading(false);
        };
        
        audio.onended = () => {
          if (isCustom) {
            setIsPlayingCustom(false);
          } else {
            setIsPlaying(false);
          }
        };
        
        audio.onerror = () => {
          setError('AI音声再生エラー');
          setIsLoading(false);
          if (isCustom) {
            setIsPlayingCustom(false);
          } else {
            setIsPlaying(false);
          }
        };
        
        await audio.play();
      } else {
        setError(response.error || 'AI音声変換に失敗しました');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('AI voice conversion error:', error);
      setError('AI音声変換エラー');
      setIsLoading(false);
    }
  };


  const handlePlayPause = () => {
    if (isPlaying) {
      // 音声再生の停止
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
            {aiServiceAvailable && (
              <div className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                AI音声
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

      {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default DialectPlayer;
