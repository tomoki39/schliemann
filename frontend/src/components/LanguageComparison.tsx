import React, { useState, useEffect } from 'react';
import { Language } from '../types/Language';

interface LanguageComparisonProps {
  languages: Language[];
  onClose: () => void;
}

const LanguageComparison: React.FC<LanguageComparisonProps> = ({ languages, onClose }) => {
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [comparisonType, setComparisonType] = useState<'phonetics' | 'structure' | 'dialects'>('phonetics');

  useEffect(() => {
    if (languages.length > 0) {
      setSelectedLanguages(languages.slice(0, Math.min(3, languages.length)));
    }
  }, [languages]);

  const addLanguage = (language: Language) => {
    if (selectedLanguages.length < 4 && !selectedLanguages.find(l => l.id === language.id)) {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const removeLanguage = (languageId: string) => {
    setSelectedLanguages(selectedLanguages.filter(l => l.id !== languageId));
  };

  const renderPhoneticComparison = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {selectedLanguages.map((language) => (
          <div key={language.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{language.name_ja}</h3>
              <button
                onClick={() => removeLanguage(language.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ×
              </button>
            </div>
            
            {language.phonetics ? (
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">子音</h4>
                  <div className="text-xs bg-gray-50 p-2 rounded">
                    /{language.phonetics.consonants.join(', ')}/
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">母音</h4>
                  <div className="text-xs bg-gray-50 p-2 rounded">
                    /{language.phonetics.vowels.join(', ')}/
                  </div>
                </div>
                
                {language.phonetics.tones && language.phonetics.tones.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">声調</h4>
                    <div className="text-xs bg-gray-50 p-2 rounded">
                      {language.phonetics.tones.join(', ')}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">音節構造</h4>
                  <div className="text-xs bg-gray-50 p-2 rounded">
                    {language.phonetics.syllable_structure}
                  </div>
                </div>
                
                {language.phonetics.phonetic_notes && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">特徴</h4>
                    <div className="text-xs bg-gray-50 p-2 rounded">
                      {language.phonetics.phonetic_notes}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                音韻データがありません
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStructureComparison = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {selectedLanguages.map((language) => (
          <div key={language.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{language.name_ja}</h3>
              <button
                onClick={() => removeLanguage(language.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">語族</h4>
                <div className="text-xs bg-blue-50 p-2 rounded">
                  {language.family}
                </div>
              </div>
              
              {language.branch && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">語派</h4>
                  <div className="text-xs bg-green-50 p-2 rounded">
                    {language.branch}
                  </div>
                </div>
              )}
              
              {language.group && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">語群</h4>
                  <div className="text-xs bg-yellow-50 p-2 rounded">
                    {language.group}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">話者数</h4>
                <div className="text-xs bg-purple-50 p-2 rounded">
                  {language.total_speakers ? language.total_speakers.toLocaleString() : '不明'}人
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">使用国</h4>
                <div className="text-xs bg-orange-50 p-2 rounded">
                  {language.countries?.join(', ') || '不明'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDialectComparison = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {selectedLanguages.map((language) => (
          <div key={language.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{language.name_ja}</h3>
              <button
                onClick={() => removeLanguage(language.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-1">方言数</h4>
                <div className="text-xs bg-blue-50 p-2 rounded">
                  {language.dialects?.length || 0}個
                </div>
              </div>
              
              {language.dialects && language.dialects.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">主要方言</h4>
                  <div className="space-y-1">
                    {language.dialects.slice(0, 3).map((dialect, index) => (
                      <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                        <div className="font-medium">{dialect.name}</div>
                        <div className="text-gray-600">{dialect.region}</div>
                      </div>
                    ))}
                    {language.dialects.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{language.dialects.length - 3}個の方言
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">言語比較</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setComparisonType('phonetics')}
                className={`px-4 py-2 rounded ${
                  comparisonType === 'phonetics'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                音韻比較
              </button>
              <button
                onClick={() => setComparisonType('structure')}
                className={`px-4 py-2 rounded ${
                  comparisonType === 'structure'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                構造比較
              </button>
              <button
                onClick={() => setComparisonType('dialects')}
                className={`px-4 py-2 rounded ${
                  comparisonType === 'dialects'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                方言比較
              </button>
            </div>
            
            {selectedLanguages.length < 4 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">言語を追加:</h3>
                <div className="flex flex-wrap gap-2">
                  {languages
                    .filter(lang => !selectedLanguages.find(l => l.id === lang.id))
                    .slice(0, 10)
                    .map((language) => (
                      <button
                        key={language.id}
                        onClick={() => addLanguage(language)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        {language.name_ja}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="overflow-y-auto max-h-[60vh]">
            {comparisonType === 'phonetics' && renderPhoneticComparison()}
            {comparisonType === 'structure' && renderStructureComparison()}
            {comparisonType === 'dialects' && renderDialectComparison()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageComparison;
