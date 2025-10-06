import React, { useState } from 'react';
import { Language } from '../types/Language';

interface PhoneticFilterProps {
  languages: Language[];
  onFilteredLanguages: (languages: Language[]) => void;
}

const PhoneticFilter: React.FC<PhoneticFilterProps> = ({ languages, onFilteredLanguages }) => {
  const [filters, setFilters] = useState({
    family: '',
    hasTones: null as boolean | null,
    syllableStructure: '',
    vowelCount: '',
    consonantCount: '',
    speakerRange: { min: 0, max: 2000000000 }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const families = Array.from(new Set(languages.map(l => l.family).filter(Boolean)));
  const syllableStructures = Array.from(new Set(
    languages
      .map(l => l.phonetics?.syllable_structure)
      .filter(Boolean)
  ));

  const applyFilters = () => {
    let filtered = [...languages];

    if (filters.family) {
      filtered = filtered.filter(l => l.family === filters.family);
    }

    if (filters.hasTones !== null) {
      filtered = filtered.filter(l => {
        const hasTones = l.phonetics?.tones && l.phonetics.tones.length > 0;
        return filters.hasTones ? hasTones : !hasTones;
      });
    }

    if (filters.syllableStructure) {
      filtered = filtered.filter(l => l.phonetics?.syllable_structure === filters.syllableStructure);
    }

    if (filters.vowelCount) {
      const [min, max] = filters.vowelCount.split('-').map(Number);
      filtered = filtered.filter(l => {
        const vowelCount = l.phonetics?.vowels?.length || 0;
        return vowelCount >= min && vowelCount <= max;
      });
    }

    if (filters.consonantCount) {
      const [min, max] = filters.consonantCount.split('-').map(Number);
      filtered = filtered.filter(l => {
        const consonantCount = l.phonetics?.consonants?.length || 0;
        return consonantCount >= min && consonantCount <= max;
      });
    }

    filtered = filtered.filter(l => {
      const speakers = l.total_speakers || 0;
      return speakers >= filters.speakerRange.min && speakers <= filters.speakerRange.max;
    });

    onFilteredLanguages(filtered);
  };

  const resetFilters = () => {
    setFilters({
      family: '',
      hasTones: null,
      syllableStructure: '',
      vowelCount: '',
      consonantCount: '',
      speakerRange: { min: 0, max: 2000000000 }
    });
    onFilteredLanguages(languages);
  };

  React.useEffect(() => {
    applyFilters();
  }, [filters]);

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">言語フィルター</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-500 hover:text-blue-700 text-sm"
        >
          {showAdvanced ? 'シンプル表示' : '詳細フィルター'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">語族</label>
          <select
            value={filters.family}
            onChange={(e) => setFilters({ ...filters, family: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">すべて</option>
            {families.map(family => (
              <option key={family} value={family}>{family}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">声調</label>
          <select
            value={filters.hasTones === null ? '' : filters.hasTones.toString()}
            onChange={(e) => setFilters({ 
              ...filters, 
              hasTones: e.target.value === '' ? null : e.target.value === 'true' 
            })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">すべて</option>
            <option value="true">声調あり</option>
            <option value="false">声調なし</option>
          </select>
        </div>

        {showAdvanced && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">音節構造</label>
              <select
                value={filters.syllableStructure}
                onChange={(e) => setFilters({ ...filters, syllableStructure: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">すべて</option>
                {syllableStructures.map(structure => (
                  <option key={structure} value={structure}>{structure}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">母音数</label>
              <select
                value={filters.vowelCount}
                onChange={(e) => setFilters({ ...filters, vowelCount: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">すべて</option>
                <option value="1-5">1-5個</option>
                <option value="6-10">6-10個</option>
                <option value="11-15">11-15個</option>
                <option value="16-20">16-20個</option>
                <option value="21-">21個以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">子音数</label>
              <select
                value={filters.consonantCount}
                onChange={(e) => setFilters({ ...filters, consonantCount: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">すべて</option>
                <option value="1-10">1-10個</option>
                <option value="11-20">11-20個</option>
                <option value="21-30">21-30個</option>
                <option value="31-40">31-40個</option>
                <option value="41-">41個以上</option>
              </select>
            </div>
          </>
        )}
      </div>

      {showAdvanced && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">話者数範囲</label>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="number"
                value={filters.speakerRange.min}
                onChange={(e) => setFilters({
                  ...filters,
                  speakerRange: { ...filters.speakerRange, min: parseInt(e.target.value) || 0 }
                })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="最小値"
              />
            </div>
            <span className="text-gray-500">〜</span>
            <div className="flex-1">
              <input
                type="number"
                value={filters.speakerRange.max}
                onChange={(e) => setFilters({
                  ...filters,
                  speakerRange: { ...filters.speakerRange, max: parseInt(e.target.value) || 2000000000 }
                })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="最大値"
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={resetFilters}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mr-2"
        >
          リセット
        </button>
      </div>
    </div>
  );
};

export default PhoneticFilter;
