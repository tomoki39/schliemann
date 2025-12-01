import React, { useState } from 'react';
import { Language } from '../types/Language';
import DialectPlayer from './DialectPlayer';
import LanguageInsightDetail from './LanguageInsightDetail';
import PhoneticFilter from './PhoneticFilter';
import PhoneticMap from './PhoneticMap';
import EmptyState from './EmptyState';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { getLanguageName, getFamilyName, getBranchName, getGroupName, getSubgroupName, getDialectName, getDialectDescription } from '../utils/languageNames';
import { getRegionName } from '../utils/countryNames';

interface InsightsTabProps {
  languages: Language[];
}

// 国コード→現在の言語の名前に変換
const countryCodeToName = (code?: string): string => {
  if (!code) return '';
  try {
    const locale = i18n.language === 'en' ? 'en' : 'ja';
    const dn = new Intl.DisplayNames([locale], { type: 'region' });
    return (dn.of(code) as string) || code;
  } catch {
    return code;
  }
};

const getOfficialCountryNames = (lang: Language): string => {
  const list = (lang.official_languages && lang.official_languages.length > 0)
    ? lang.official_languages
    : (lang.countries || []);
  const names = list.map(countryCodeToName);
  const max = 5;
  return names.length > max ? `${names.slice(0, max).join(', ')} …` : names.join(', ');
};

const InsightsTab: React.FC<InsightsTabProps> = ({ languages }) => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>(languages);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const buildOverview = (lang: Language): string => {
    const parts: string[] = [];
    if (lang.family) parts.push(`${getFamilyName(lang.family, i18n.language)}${t('insights.familySuffix')}`);
    if (lang.branch) parts.push(getBranchName(lang.branch, i18n.language));
    if (lang.group) parts.push(getGroupName(lang.group, i18n.language));
    if (lang.subgroup) parts.push(getSubgroupName(lang.subgroup, i18n.language));
    const lineage = parts.join(' / ');
    const geo = (lang.countries && lang.countries.length)
      ? `${t('insights.distribution')}${getOfficialCountryNames(lang)}`
      : '';
    const speakers = lang.total_speakers ? `${t('insights.speakers')}${lang.total_speakers.toLocaleString()}${t('common.speakers')}` : '';
    return [lineage, geo, speakers].filter(Boolean).join(' ・ ');
  };

  const buildPhoneticsNote = (lang: Language): string => {
    if (lang.family?.includes('インド・ヨーロッパ')) return t('insights.phoneticsNote.indoEuropean');
    if (lang.family?.includes('シナ・チベット')) return t('insights.phoneticsNote.sinoTibetan');
    if (lang.family?.includes('アフロ・アジア')) return t('insights.phoneticsNote.afroAsiatic');
    if (lang.family?.includes('ウラル')) return t('insights.phoneticsNote.uralic');
    if (lang.family?.includes('テュルク')) return t('insights.phoneticsNote.turkic');
    return t('insights.phoneticsNote.default');
  };

  // 話者数順の上位を中心に提示
  const items = [...filteredLanguages]
    .sort((a, b) => (b.total_speakers || 0) - (a.total_speakers || 0))
    .slice(0, 40);

  const handleLanguageClick = (language: Language) => {
    setSelectedLanguage(language);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedLanguage(null);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{t('insights.title')}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              📋 {t('insights.viewMode.list')}
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'map' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              🗺️ {t('insights.viewMode.map')}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">{t('insights.description')}</p>
      </div>

      <PhoneticFilter
        languages={languages}
        onFilteredLanguages={setFilteredLanguages}
      />

      {viewMode === 'map' && (
        <PhoneticMap
          languages={filteredLanguages}
          onLanguageSelect={handleLanguageClick}
        />
      )}

      {viewMode === 'list' && items.map((lang) => (
        <div key={lang.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleLanguageClick(lang)}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-base font-semibold text-gray-900">{getLanguageName(lang.name_ja, i18n.language)}</div>
              <div className="text-xs text-gray-600 mt-1">{buildOverview(lang)}</div>
            </div>
            <div className="text-xs text-blue-600 hover:text-blue-800">{t('insights.viewDetails')}</div>
          </div>

          <div className="text-sm text-gray-700 mb-3">
            <span className="font-medium">{t('insights.phoneticsHighlight')} </span>
            {buildPhoneticsNote(lang)}
          </div>

          {lang.dialects && lang.dialects.length > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-1">{t('insights.dialectSamples')}</div>
              <div className="space-y-2">
                {lang.dialects.slice(0, 2).map((d, i) => (
                  <DialectPlayer
                    key={i}
                    dialect={{ 
                      ...d, 
                      id: d.conversion_model || String(i),
                      name: getDialectName(d.name, i18n.language),
                      region: getRegionName(d.region || '', i18n.language),
                      description: getDialectDescription(d.description, i18n.language)
                    }}
                    className="w-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {viewMode === 'list' && items.length === 0 && (
        <EmptyState
          icon="🔍"
          title={t('insights.empty.title')}
          description={t('insights.empty.description')}
          action={{
            label: t('insights.empty.reset'),
            onClick: () => setFilteredLanguages(languages)
          }}
        />
      )}

      {showDetail && selectedLanguage && (
        <LanguageInsightDetail
          language={selectedLanguage}
          onClose={handleCloseDetail}
          allLanguages={languages}
        />
      )}
    </div>
  );
};

export default InsightsTab;
