import React, { useState, useEffect } from 'react';
import { webSpeechService, SpeechRequest } from '../services/webSpeechService';
import { getVoiceSettings } from '../services/dialectVoiceSettings';
import { DEMO_VOICE_SAMPLES, VoiceSample } from '../data/demoVoiceSamples';

interface VoiceComparisonProps {
  className?: string;
}

const VoiceComparison: React.FC<VoiceComparisonProps> = ({ className = '' }) => {
  const [selectedSamples, setSelectedSamples] = useState<VoiceSample[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean[]>([]);
  const [isWebSpeechAvailable, setIsWebSpeechAvailable] = useState(false);
  const [customText, setCustomText] = useState('');
  const [simultaneousMode, setSimultaneousMode] = useState(false);

  useEffect(() => {
    setIsWebSpeechAvailable(webSpeechService.isWebSpeechSupported());
  }, []);

  const playSample = async (sample: VoiceSample, index: number) => {
    if (!isWebSpeechAvailable) return;

    const voiceSettings = getVoiceSettings(sample.dialect);
    
    const request: SpeechRequest = {
      text: customText || sample.text,
      language: voiceSettings.language,
      dialect: voiceSettings.dialect,
      settings: {
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
        volume: voiceSettings.volume,
      },
    };

    // 再生状態を更新
    const newIsPlaying = [...isPlaying];
    newIsPlaying[index] = true;
    setIsPlaying(newIsPlaying);

    await webSpeechService.speak(request);

    // 再生終了
    newIsPlaying[index] = false;
    setIsPlaying(newIsPlaying);
  };

  const addSample = (sample: VoiceSample) => {
    if (selectedSamples.length >= 3) {
      alert('最大3つまで比較できます');
      return;
    }
    setSelectedSamples([...selectedSamples, sample]);
    setIsPlaying([...isPlaying, false]);
  };

  const removeSample = (index: number) => {
    const newSamples = selectedSamples.filter((_, i) => i !== index);
    const newIsPlaying = isPlaying.filter((_, i) => i !== index);
    setSelectedSamples(newSamples);
    setIsPlaying(newIsPlaying);
  };

  const playAll = async () => {
    if (simultaneousMode) {
      // 同時再生モード
      const promises = selectedSamples.map((sample, index) => playSample(sample, index));
      await Promise.all(promises);
    } else {
      // 順次再生モード
      for (let i = 0; i < selectedSamples.length; i++) {
        await playSample(selectedSamples[i], i);
        if (i < selectedSamples.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }
  };

  const stopAll = () => {
    webSpeechService.stop();
    setIsPlaying(new Array(selectedSamples.length).fill(false));
  };

  const availableSamples = DEMO_VOICE_SAMPLES.filter(
    sample => !selectedSamples.some(selected => selected.id === sample.id)
  );

  if (!isWebSpeechAvailable) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
        <p className="text-sm text-gray-500">Web Speech APIが利用できません</p>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4">音声比較</h3>
      
      {/* カスタムテキスト入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カスタムテキスト（空の場合は各方言のデフォルトテキストを使用）
        </label>
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="比較したいテキストを入力..."
          className="w-full px-3 py-2 border rounded text-sm"
        />
      </div>

      {/* 選択されたサンプル */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          選択された方言 ({selectedSamples.length}/3)
        </h4>
        
        {selectedSamples.length === 0 ? (
          <p className="text-sm text-gray-500">比較する方言を選択してください</p>
        ) : (
          <div className="space-y-2">
            {selectedSamples.map((sample, index) => (
              <div key={sample.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{sample.description}</span>
                    <span className="text-xs text-gray-500">
                      {sample.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {customText || sample.text}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => playSample(sample, index)}
                    disabled={isPlaying[index]}
                    className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    {isPlaying[index] ? '再生中...' : '再生'}
                  </button>
                  <button
                    onClick={() => removeSample(index)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 全体コントロール */}
        {selectedSamples.length > 0 && (
          <div className="space-y-2 mt-3">
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={simultaneousMode}
                  onChange={(e) => setSimultaneousMode(e.target.checked)}
                  className="mr-2"
                />
                同時再生モード
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={playAll}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {simultaneousMode ? 'すべて同時再生' : 'すべて順番に再生'}
              </button>
              <button
                onClick={stopAll}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                停止
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 利用可能なサンプル */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          利用可能な方言
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {availableSamples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => addSample(sample)}
              className="p-2 text-left border rounded hover:bg-gray-50 text-sm"
            >
              <div className="font-medium">{sample.description}</div>
              <div className="text-xs text-gray-500">
                {sample.language.toUpperCase()} - {sample.text}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceComparison;
