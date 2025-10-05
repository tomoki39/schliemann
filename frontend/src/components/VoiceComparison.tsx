import React, { useState, useRef, useEffect } from 'react';
import { enhancedVoiceService, EnhancedVoiceRequest } from '../services/enhancedVoiceService';

interface VoiceComparisonProps {
  text: string;
  language: string;
  dialects: string[];
  onClose: () => void;
}

interface VoiceItem {
  dialect: string;
  audioUrl?: string;
  isPlaying: boolean;
  isLoading: boolean;
  error?: string;
  provider: string;
}

const VoiceComparison: React.FC<VoiceComparisonProps> = ({
  text,
  language,
  dialects,
  onClose
}) => {
  const [voiceItems, setVoiceItems] = useState<VoiceItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [simultaneousPlayback, setSimultaneousPlayback] = useState(false);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 音声生成
  const generateVoices = async () => {
    setIsGenerating(true);
    const items: VoiceItem[] = dialects.map(dialect => ({
      dialect,
      isPlaying: false,
      isLoading: true,
      provider: 'unknown'
    }));

    setVoiceItems(items);

    // 並列で音声生成
    const promises = dialects.map(async (dialect, index) => {
      try {
        const request: EnhancedVoiceRequest = {
          text,
          language,
          dialect,
          useElevenLabs: true
        };

        const response = await enhancedVoiceService.generateVoice(request);
        
        setVoiceItems(prev => prev.map((item, i) => 
          i === index ? {
            ...item,
            audioUrl: response.audioUrl,
            isLoading: false,
            provider: response.provider,
            error: response.error
          } : item
        ));
      } catch (error) {
        setVoiceItems(prev => prev.map((item, i) => 
          i === index ? {
            ...item,
            isLoading: false,
            error: error instanceof Error ? error.message : '音声生成エラー'
          } : item
        ));
      }
    });

    await Promise.all(promises);
    setIsGenerating(false);
  };

  // 音声再生
  const playVoice = async (dialect: string) => {
    const item = voiceItems.find(v => v.dialect === dialect);
    if (!item?.audioUrl) return;

    // 他の音声を停止
    if (!simultaneousPlayback) {
      stopAllVoices();
    }

    const audio = audioRefs.current.get(dialect);
    if (audio) {
      try {
        await audio.play();
        setVoiceItems(prev => prev.map(v => 
          v.dialect === dialect ? { ...v, isPlaying: true } : v
        ));
      } catch (error) {
        console.error('Playback error:', error);
      }
    }
  };

  // 音声停止
  const stopVoice = (dialect: string) => {
    const audio = audioRefs.current.get(dialect);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setVoiceItems(prev => prev.map(v => 
        v.dialect === dialect ? { ...v, isPlaying: false } : v
      ));
    }
  };

  // 全音声停止
  const stopAllVoices = () => {
    voiceItems.forEach(item => {
      if (item.isPlaying) {
        stopVoice(item.dialect);
      }
    });
  };

  // 同時再生切り替え
  const toggleSimultaneousPlayback = () => {
    if (simultaneousPlayback) {
      stopAllVoices();
    }
    setSimultaneousPlayback(!simultaneousPlayback);
  };

  // 音声URLが変更されたときにAudio要素を更新
  useEffect(() => {
    voiceItems.forEach(item => {
      if (item.audioUrl && !audioRefs.current.has(item.dialect)) {
        const audio = new Audio(item.audioUrl);
        audio.addEventListener('ended', () => {
          setVoiceItems(prev => prev.map(v => 
            v.dialect === item.dialect ? { ...v, isPlaying: false } : v
          ));
        });
        audioRefs.current.set(item.dialect, audio);
      }
    });
  }, [voiceItems]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      audioRefs.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">音声比較</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-lg font-medium text-gray-800 mb-2">テキスト:</p>
            <p className="text-gray-700">{text}</p>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={generateVoices}
              disabled={isGenerating}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
            >
              {isGenerating ? '生成中...' : '音声生成'}
            </button>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={simultaneousPlayback}
                onChange={toggleSimultaneousPlayback}
                className="rounded"
              />
              <span className="text-sm text-gray-700">同時再生</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {voiceItems.map((item) => (
            <div key={item.dialect} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-800">{item.dialect}</h3>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  {item.provider}
                </span>
              </div>

              {item.isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}

              {item.error && (
                <div className="text-red-500 text-sm py-2">
                  {item.error}
                </div>
              )}

              {item.audioUrl && !item.isLoading && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => item.isPlaying ? stopVoice(item.dialect) : playVoice(item.dialect)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium"
                    >
                      {item.isPlaying ? '停止' : '再生'}
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    <div>プロバイダー: {item.provider}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {voiceItems.length === 0 && !isGenerating && (
          <div className="text-center py-8 text-gray-500">
            音声を生成してください
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceComparison;