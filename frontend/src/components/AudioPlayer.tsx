import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AudioPlayerProps {
  audioUrl?: string;
  languageName: string;
  text?: string; // 音声の内容（例：「こんにちは」）
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  languageName,
  text,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError(t('audio.error'));
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [t]);

  const handlePlayPause = () => {
    if (isPlaying) {
      // 音声合成の停止
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    } else {
      // 音声合成で再生
      if ('speechSynthesis' in window && text) {
        setIsLoading(true);
        setError(null);
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 言語設定
        if (languageName === '日本語') {
          utterance.lang = 'ja-JP';
        } else if (languageName === '英語') {
          utterance.lang = 'en-US';
        } else if (languageName === 'フランス語') {
          utterance.lang = 'fr-FR';
        }
        
        utterance.onstart = () => {
          setIsPlaying(true);
          setIsLoading(false);
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setError('音声合成エラー');
          setIsLoading(false);
          setIsPlaying(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        setError('音声合成がサポートされていません');
      }
    }
  };

  if (!text) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <button
          disabled
          className="p-2 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed"
          title={t('audio.noSample')}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="text-sm">{t('audio.noSample')}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      
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
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        {text && (
          <div className="text-sm font-medium text-gray-900 truncate">
            "{text}"
          </div>
        )}
        <div className="text-xs text-gray-500">
          {languageName}
          {error && <span className="text-red-500 ml-2">({error})</span>}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
