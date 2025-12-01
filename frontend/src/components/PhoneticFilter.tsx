import React, { useState } from 'react';
import { Language } from '../types/Language';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { getFamilyName } from '../utils/languageNames';

interface PhoneticFilterProps {
  languages: Language[];
  onFilteredLanguages: (languages: Language[]) => void;
}

const PhoneticFilter: React.FC<PhoneticFilterProps> = ({ languages, onFilteredLanguages }) => {
  const { t } = useTranslation();
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
        <h3 className="text-lg font-semibold">{t('filter.title')}</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-500 hover:text-blue-700 text-sm"
        >
          {showAdvanced ? t('filter.simpleView') : t('filter.advanced')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('filter.family')}</label>
          <select
            value={filters.family}
            onChange={(e) => setFilters({ ...filters, family: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">{t('filter.all')}</option>
            {families.map(family => (
              <option key={family} value={family}>{getFamilyName(family, i18n.language)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('filter.hasTones')}</label>
          <select
            value={filters.hasTones === null ? '' : filters.hasTones.toString()}
            onChange={(e) => setFilters({ 
              ...filters, 
              hasTones: e.target.value === '' ? null : e.target.value === 'true' 
            })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">{t('filter.all')}</option>
            <option value="true">{t('filter.hasTones.true')}</option>
            <option value="false">{t('filter.hasTones.false')}</option>
          </select>
        </div>

        {showAdvanced && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('filter.syllableStructure')}</label>
              <select
                value={filters.syllableStructure}
                onChange={(e) => setFilters({ ...filters, syllableStructure: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">{t('filter.all')}</option>
                {syllableStructures.map(structure => (
                  <option key={structure} value={structure}>{structure}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('filter.vowelCount')}</label>
              <select
                value={filters.vowelCount}
                onChange={(e) => setFilters({ ...filters, vowelCount: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">{t('filter.all')}</option>
                <option value="1-5">1-5{t('filter.count.suffix')}</option>
                <option value="6-10">6-10{t('filter.count.suffix')}</option>
                <option value="11-15">11-15{t('filter.count.suffix')}</option>
                <option value="16-20">16-20{t('filter.count.suffix')}</option>
                <option value="21-">21{t('filter.count.moreThan')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('filter.consonantCount')}</label>
              <select
                value={filters.consonantCount}
                onChange={(e) => setFilters({ ...filters, consonantCount: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">{t('filter.all')}</option>
                <option value="1-10">1-10{t('filter.count.suffix')}</option>
                <option value="11-20">11-20{t('filter.count.suffix')}</option>
                <option value="21-30">21-30{t('filter.count.suffix')}</option>
                <option value="31-40">31-40{t('filter.count.suffix')}</option>
                <option value="41-">41{t('filter.count.moreThan')}</option>
              </select>
            </div>
          </>
        )}
      </div>

      {showAdvanced && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('filter.speakers')}</label>
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
                placeholder={t('filter.min')}
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
                placeholder={t('filter.max')}
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
          {t('filter.reset')}
        </button>
      </div>
    </div>
  );
};

export default PhoneticFilter;
