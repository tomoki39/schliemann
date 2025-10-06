import React, { useState, useMemo } from 'react';
import { Language } from '../types/Language';

interface PhoneticMapProps {
  languages: Language[];
  onLanguageSelect: (language: Language) => void;
}

const PhoneticMap: React.FC<PhoneticMapProps> = ({ languages, onLanguageSelect }) => {
  const [mapType, setMapType] = useState<'family' | 'tones' | 'syllable' | 'vowels' | 'consonants'>('family');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  const getLanguageColor = (language: Language): string => {
    switch (mapType) {
      case 'family':
        const familyColors: { [key: string]: string } = {
          'インド・ヨーロッパ': 'bg-blue-500',
          'シナ・チベット': 'bg-red-500',
          'アフロ・アジア': 'bg-green-500',
          'ウラル': 'bg-yellow-500',
          'テュルク': 'bg-purple-500',
          '日本語族': 'bg-pink-500',
          '朝鮮語族': 'bg-indigo-500',
          'アルタイ': 'bg-orange-500',
          'エスキモー・アレウト': 'bg-cyan-500',
          'ナイジェル・コンゴ': 'bg-lime-500',
          'ニロ・サハラ': 'bg-amber-500',
          'コイサン': 'bg-emerald-500',
          'オーストロネシア': 'bg-rose-500',
          'オーストロアジア': 'bg-violet-500',
          'パプア': 'bg-sky-500',
          'オーストラリア': 'bg-fuchsia-500',
          'アメリカ': 'bg-teal-500'
        };
        return familyColors[language.family] || 'bg-gray-500';

      case 'tones':
        const hasTones = language.phonetics?.tones && language.phonetics.tones.length > 0;
        return hasTones ? 'bg-red-500' : 'bg-blue-500';

      case 'syllable':
        const structure = language.phonetics?.syllable_structure;
        if (structure?.includes('CV(C)')) return 'bg-green-500';
        if (structure?.includes('(C)(C)(C)V')) return 'bg-yellow-500';
        if (structure?.includes('(C)(C)V')) return 'bg-orange-500';
        return 'bg-gray-500';

      case 'vowels':
        const vowelCount = language.phonetics?.vowels?.length || 0;
        if (vowelCount <= 5) return 'bg-red-500';
        if (vowelCount <= 10) return 'bg-orange-500';
        if (vowelCount <= 15) return 'bg-yellow-500';
        if (vowelCount <= 20) return 'bg-green-500';
        return 'bg-blue-500';

      case 'consonants':
        const consonantCount = language.phonetics?.consonants?.length || 0;
        if (consonantCount <= 10) return 'bg-red-500';
        if (consonantCount <= 20) return 'bg-orange-500';
        if (consonantCount <= 30) return 'bg-yellow-500';
        if (consonantCount <= 40) return 'bg-green-500';
        return 'bg-blue-500';

      default:
        return 'bg-gray-500';
    }
  };

  const getMapLegend = () => {
    switch (mapType) {
      case 'family':
        return (
          <div className="space-y-2">
            <h4 className="font-medium">語族別色分け</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>インド・ヨーロッパ</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>シナ・チベット</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>アフロ・アジア</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>ウラル</span>
              </div>
            </div>
          </div>
        );

      case 'tones':
        return (
          <div className="space-y-2">
            <h4 className="font-medium">声調の有無</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>声調あり</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>声調なし</span>
              </div>
            </div>
          </div>
        );

      case 'syllable':
        return (
          <div className="space-y-2">
            <h4 className="font-medium">音節構造</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>CV(C) - 単純</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>(C)(C)V - 中程度</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>(C)(C)(C)V - 複雑</span>
              </div>
            </div>
          </div>
        );

      case 'vowels':
        return (
          <div className="space-y-2">
            <h4 className="font-medium">母音数</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>1-5個</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>6-10個</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>11-15個</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>16-20個</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>21個以上</span>
              </div>
            </div>
          </div>
        );

      case 'consonants':
        return (
          <div className="space-y-2">
            <h4 className="font-medium">子音数</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>1-10個</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>11-20個</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>21-30個</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>31-40個</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>41個以上</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const sortedLanguages = useMemo(() => {
    return [...languages].sort((a, b) => (b.total_speakers || 0) - (a.total_speakers || 0));
  }, [languages]);

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">音韻マップ</h3>
        <div className="flex space-x-2">
          {[
            { key: 'family', label: '語族', icon: '🌍' },
            { key: 'tones', label: '声調', icon: '🎵' },
            { key: 'syllable', label: '音節', icon: '🔤' },
            { key: 'vowels', label: '母音', icon: '🔊' },
            { key: 'consonants', label: '子音', icon: '📢' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setMapType(key as any)}
              className={`px-3 py-1 text-sm rounded ${
                mapType === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {sortedLanguages.slice(0, 20).map((language) => (
              <div
                key={language.id}
                className={`p-2 rounded cursor-pointer hover:shadow-md transition-all ${
                  selectedLanguage?.id === language.id ? 'ring-2 ring-blue-500' : ''
                } ${getLanguageColor(language)} text-white text-xs`}
                onClick={() => {
                  setSelectedLanguage(language);
                  onLanguageSelect(language);
                }}
              >
                <div className="font-medium truncate">{language.name_ja}</div>
                <div className="text-xs opacity-75">
                  {language.total_speakers ? 
                    `${(language.total_speakers / 1000000).toFixed(0)}M` : 
                    'N/A'
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-3 rounded">
            {getMapLegend()}
          </div>
          
          {selectedLanguage && (
            <div className="mt-4 bg-white border rounded p-3">
              <h4 className="font-medium mb-2">{selectedLanguage.name_ja}</h4>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">語族:</span> {selectedLanguage.family}</div>
                {selectedLanguage.phonetics?.consonants && (
                  <div><span className="font-medium">子音:</span> {selectedLanguage.phonetics.consonants.length}個</div>
                )}
                {selectedLanguage.phonetics?.vowels && (
                  <div><span className="font-medium">母音:</span> {selectedLanguage.phonetics.vowels.length}個</div>
                )}
                {selectedLanguage.phonetics?.tones && selectedLanguage.phonetics.tones.length > 0 && (
                  <div><span className="font-medium">声調:</span> {selectedLanguage.phonetics.tones.length}個</div>
                )}
                {selectedLanguage.phonetics?.syllable_structure && (
                  <div><span className="font-medium">音節構造:</span> {selectedLanguage.phonetics.syllable_structure}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneticMap;
