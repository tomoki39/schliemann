import React, { useState, useEffect } from 'react';
import { webSpeechService, SpeechRequest } from '../services/webSpeechService';
import { getVoiceSettings } from '../services/dialectVoiceSettings';
import { WORLD_GREETING_TOUR, DIALECT_TOUR, VoiceSample, DEMO_VOICE_SAMPLES } from '../data/demoVoiceSamples';

// カテゴリ別ツアーを取得する関数
const getCategoryTour = (category: string): VoiceSample[] => {
  return DEMO_VOICE_SAMPLES.filter(sample => sample.category === category);
};

interface VoiceTourProps {
  className?: string;
}

const VoiceTour: React.FC<VoiceTourProps> = ({ className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tourType, setTourType] = useState<'world' | 'dialect' | 'category'>('world');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [selectedCategory, setSelectedCategory] = useState<string>('greeting');
  const [isWebSpeechAvailable, setIsWebSpeechAvailable] = useState(false);

  const currentTour = tourType === 'world' 
    ? WORLD_GREETING_TOUR 
    : tourType === 'dialect' 
    ? DIALECT_TOUR[selectedLanguage] || []
    : getCategoryTour(selectedCategory);

  useEffect(() => {
    setIsWebSpeechAvailable(webSpeechService.isWebSpeechSupported());
  }, []);

  const playSample = async (sample: VoiceSample) => {
    if (!isWebSpeechAvailable) return;

    const voiceSettings = getVoiceSettings(sample.dialect);
    
    const request: SpeechRequest = {
      text: sample.text,
      language: voiceSettings.language,
      dialect: voiceSettings.dialect,
      settings: {
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
        volume: voiceSettings.volume,
      },
    };

    await webSpeechService.speak(request);
  };

  const startTour = async () => {
    if (currentTour.length === 0) return;

    setIsPlaying(true);
    setCurrentIndex(0);

    for (let i = 0; i < currentTour.length; i++) {
      setCurrentIndex(i);
      await playSample(currentTour[i]);
      
      // 各サンプルの間に少し間隔を空ける
      if (i < currentTour.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const stopTour = () => {
    webSpeechService.stop();
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const playCurrentSample = () => {
    if (currentTour[currentIndex]) {
      playSample(currentTour[currentIndex]);
    }
  };

  const nextSample = () => {
    if (currentIndex < currentTour.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSample = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!isWebSpeechAvailable) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
        <p className="text-sm text-gray-500">Web Speech APIが利用できません</p>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4">音声ツアー</h3>
      
      {/* ツアータイプ選択 */}
      <div className="mb-4">
        <div className="flex space-x-4 mb-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="tourType"
              value="world"
              checked={tourType === 'world'}
              onChange={(e) => setTourType(e.target.value as 'world')}
              className="mr-2"
            />
            世界の挨拶
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="tourType"
              value="dialect"
              checked={tourType === 'dialect'}
              onChange={(e) => setTourType(e.target.value as 'dialect')}
              className="mr-2"
            />
            方言の旅
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="tourType"
              value="category"
              checked={tourType === 'category'}
              onChange={(e) => setTourType(e.target.value as 'category')}
              className="mr-2"
            />
            カテゴリ別
          </label>
        </div>
        
        {tourType === 'dialect' && (
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="en">英語</option>
            <option value="es">スペイン語</option>
            <option value="fr">フランス語</option>
            <option value="zh">中国語</option>
            <option value="ja">日本語</option>
          </select>
        )}
        
        {tourType === 'category' && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="greeting">挨拶</option>
            <option value="numbers">数字</option>
            <option value="emotions">感情表現</option>
            <option value="food">食べ物</option>
            <option value="family">家族</option>
            <option value="cultural">文化的表現</option>
          </select>
        )}
      </div>

      {/* コントロール */}
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={isPlaying ? stopTour : startTour}
          className={`px-4 py-2 rounded text-sm font-medium ${
            isPlaying
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isPlaying ? '停止' : 'ツアー開始'}
        </button>
        
        <button
          onClick={playCurrentSample}
          disabled={currentTour.length === 0}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          現在のサンプルを再生
        </button>
      </div>

      {/* ナビゲーション */}
      {currentTour.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevSample}
            disabled={currentIndex === 0}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            ← 前
          </button>
          
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {currentTour.length}
          </span>
          
          <button
            onClick={nextSample}
            disabled={currentIndex === currentTour.length - 1}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            次 →
          </button>
        </div>
      )}

      {/* 現在のサンプル表示 */}
      {currentTour[currentIndex] && (
        <div className="p-3 bg-gray-50 rounded">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">
              {currentTour[currentIndex].description}
            </h4>
            <span className="text-xs text-gray-500">
              {currentTour[currentIndex].language.toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">原文: </span>
              {currentTour[currentIndex].text}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">訳: </span>
              {currentTour[currentIndex].translatedText}
            </div>
          </div>
        </div>
      )}

      {/* プログレスバー */}
      {isPlaying && currentTour.length > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / currentTour.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceTour;
