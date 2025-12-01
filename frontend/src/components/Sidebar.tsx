import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types/Language';
import i18n from '../i18n';
import { getLanguageName, getFamilyName, getBranchName, getGroupName, getSubgroupName, getDialectName } from '../utils/languageNames';

interface SidebarProps {
  languages: Language[];
  selectedLanguage: Language | null;
  onLanguageSelect: (language: Language) => void;
  onSetLeft: (language: Language) => void;
  onSetRight: (language: Language) => void;
  searchQuery: string;
  familyFilter: string;
  branchFilter?: string;
  groupFilter?: string;
  subgroupFilter?: string;
  languageFilter?: string;
  dialectFilter?: string;
  onFamilyFilterChange: (family: string) => void;
  onBranchFilterChange?: (branch: string) => void;
  onGroupFilterChange?: (group: string) => void;
  onSubgroupFilterChange?: (subgroup: string) => void;
  onLanguageFilterChange?: (language: string) => void;
  onDialectFilterChange?: (dialect: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  languages,
  selectedLanguage,
  onLanguageSelect,
  onSetLeft,
  onSetRight,
  searchQuery,
  familyFilter,
  onFamilyFilterChange,
  branchFilter = '',
  groupFilter = '',
  subgroupFilter = '',
  languageFilter = '',
  dialectFilter = '',
  onBranchFilterChange,
  onGroupFilterChange,
  onSubgroupFilterChange,
  onLanguageFilterChange,
  onDialectFilterChange
}) => {
  const { t } = useTranslation();

  const formatCountry = (code: string) => {
    try {
      const locale = i18n.language === 'en' ? 'en' : 'ja';
      return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code;
    } catch {
      return code;
    }
  };

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return languages.filter(lang => {
      // 早期リターンでパフォーマンス向上
      if (q && !lang.name_ja.toLowerCase().includes(q)) return false;
      if (familyFilter && lang.family !== familyFilter) return false;
      if (branchFilter && lang.branch !== branchFilter) return false;
      if (groupFilter && lang.group !== groupFilter) return false;
      if (subgroupFilter && lang.subgroup !== subgroupFilter) return false;
      if (languageFilter && lang.language !== languageFilter) return false;
      if (dialectFilter && lang.dialect !== dialectFilter) return false;
      return true;
    }).sort((a, b) => {
      // デフォルトで言語名順でソート
      return a.name_ja.localeCompare(b.name_ja, 'ja');
    });
  }, [languages, searchQuery, familyFilter, branchFilter, groupFilter, subgroupFilter, languageFilter, dialectFilter]);

  // 実際のデータから語族を動的に抽出
  const families = useMemo(() => {
    const uniqueFamilies = Array.from(new Set(languages.map(l => l.family)));
    return uniqueFamilies.sort((a, b) => {
      const aDisplay = getFamilyName(a, i18n.language);
      const bDisplay = getFamilyName(b, i18n.language);
      return aDisplay.localeCompare(bDisplay, i18n.language === 'en' ? 'en' : 'ja');
    });
  }, [languages]);
  // Branchが使用されている言語ファミリーかどうかを判定
  const familiesWithBranches = new Set([
    'インド・ヨーロッパ',
    'シナ・チベット',
    'アフロ・アジア',
    'ウラル',
    'テュルク',
    'ドラヴィダ',
    'カルトヴェリ',
    '日本語族',
    '朝鮮語族',
    'タイ・カダイ',
    'オーストロアジア',
    'アルタイ'
  ]);
  const hasBranches = familyFilter ? familiesWithBranches.has(familyFilter) : false;
  
  const branches = hasBranches ? Array.from(new Set(languages
    .filter(l => !familyFilter || l.family === familyFilter)
    .map(l => l.branch)
    .filter(Boolean))) as string[] : [];
  
  const groups = Array.from(new Set(languages
    .filter(l => (!familyFilter || l.family === familyFilter) && (!branchFilter || l.branch === branchFilter))
    .map(l => l.group)
    .filter(Boolean))) as string[];
  
  const subgroups = Array.from(new Set(languages
    .filter(l => (!familyFilter || l.family === familyFilter) && 
                 (!branchFilter || l.branch === branchFilter) &&
                 (!groupFilter || l.group === groupFilter))
    .map(l => l.subgroup)
    .filter(Boolean))) as string[];

  const languages_list = Array.from(new Set(languages
    .filter(l => (!familyFilter || l.family === familyFilter) && 
                 (!branchFilter || l.branch === branchFilter) &&
                 (!groupFilter || l.group === groupFilter) &&
                 (!subgroupFilter || l.subgroup === subgroupFilter))
    .map(l => l.language)
    .filter(Boolean))) as string[];

  const dialects_list = Array.from(new Set(languages
    .filter(l => (!familyFilter || l.family === familyFilter) && 
                 (!branchFilter || l.branch === branchFilter) &&
                 (!groupFilter || l.group === groupFilter) &&
                 (!subgroupFilter || l.subgroup === subgroupFilter) &&
                 (!languageFilter || l.language === languageFilter))
    .flatMap(l => l.dialects || [])
    .map(dialect => dialect.name)
    .filter(Boolean))) as string[];

  return (
    <div className="w-80 bg-gray-100 p-4 h-full overflow-y-auto flex-shrink-0 min-h-0">
      <h2 className="text-lg font-semibold mb-4">{t('sidebar.title')}</h2>
      
      <div className="mb-2">
        <label className="block text-xs font-medium mb-1">{t('filter.family')}</label>
        <select
          value={familyFilter}
          onChange={(e) => onFamilyFilterChange(e.target.value)}
          className="w-full p-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">{t('filter.all')}</option>
          {families.map(family => (
            <option key={family} value={family}>{getFamilyName(family, i18n.language)}</option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="block text-xs font-medium mb-1">{t('filter.branch')}</label>
        <select
          value={branchFilter}
          onChange={(e) => onBranchFilterChange?.(e.target.value)}
          className={`w-full p-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            !familyFilter || !branches.length 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-gray-900'
          }`}
          disabled={!familyFilter || !branches.length}
        >
          <option value="">{t('filter.all')}</option>
          {branches.map(branch => (
            <option key={branch} value={branch}>{getBranchName(branch, i18n.language)}</option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="block text-xs font-medium mb-1">{t('filter.group')}</label>
        <select
          value={groupFilter}
          onChange={(e) => onGroupFilterChange?.(e.target.value)}
          className={`w-full p-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            !branchFilter || !groups.length 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-gray-900'
          }`}
          disabled={!branchFilter || !groups.length}
        >
          <option value="">{t('filter.all')}</option>
          {groups.map(group => (
            <option key={group} value={group}>{getGroupName(group, i18n.language)}</option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="block text-xs font-medium mb-1">{t('filter.subgroup')}</label>
        <select
          value={subgroupFilter}
          onChange={(e) => onSubgroupFilterChange?.(e.target.value)}
          className={`w-full p-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            !groupFilter || !subgroups.length 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-gray-900'
          }`}
          disabled={!groupFilter || !subgroups.length}
        >
          <option value="">{t('filter.all')}</option>
          {subgroups.map(sub => (
            <option key={sub} value={sub}>{getSubgroupName(sub, i18n.language)}</option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="block text-xs font-medium mb-1">{t('filter.language')}</label>
        <select
          value={languageFilter}
          onChange={(e) => onLanguageFilterChange?.(e.target.value)}
          className={`w-full p-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            !subgroupFilter || !languages_list.length 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-gray-900'
          }`}
          disabled={!subgroupFilter || !languages_list.length}
        >
          <option value="">{t('filter.all')}</option>
          {languages_list.map(lang => (
            <option key={lang} value={lang}>{getLanguageName(lang, i18n.language)}</option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="block text-xs font-medium mb-1">{t('filter.dialect')}</label>
        <select
          value={dialectFilter || ''}
          onChange={(e) => onDialectFilterChange?.(e.target.value)}
          className={`w-full p-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            !languageFilter || !dialects_list.length 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-gray-900'
          }`}
          disabled={!languageFilter || !dialects_list.length}
        >
          <option value="">{t('filter.all')}</option>
          {dialects_list.map(dialect => (
            <option key={dialect} value={dialect}>{getDialectName(dialect, i18n.language)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLanguages.map(lang => (
          <div
            key={lang.id}
            className={`p-3 rounded transition-colors ${
              selectedLanguage?.id === lang.id
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-200'
            }`}
          >
            <div 
              className="cursor-pointer"
              onClick={() => onLanguageSelect(lang)}
            >
              <div className="font-medium">{getLanguageName(lang.name_ja, i18n.language)}</div>
            <div className="text-sm opacity-75">
              {getFamilyName(lang.family, i18n.language)}
              {lang.branch ? ` / ${getBranchName(lang.branch, i18n.language)}` : ''}
              {lang.group ? ` / ${getGroupName(lang.group, i18n.language)}` : ''}
              {lang.subgroup ? ` / ${getSubgroupName(lang.subgroup, i18n.language)}` : ''}
            </div>
            {lang.countries && (
              <div className="text-xs opacity-60 truncate" title={lang.countries.map(formatCountry).join(i18n.language === 'en' ? ', ' : '、')}>
                {lang.countries.map(formatCountry).join(i18n.language === 'en' ? ', ' : '、')}
              </div>
            )}
              {lang.total_speakers && (
                <div className="text-xs opacity-60">
                  {lang.total_speakers.toLocaleString()}{t('common.speakers')}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onSetLeft(lang)}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                {t('compare.left')}
              </button>
              <button
                onClick={() => onSetRight(lang)}
                className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                {t('compare.right')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
