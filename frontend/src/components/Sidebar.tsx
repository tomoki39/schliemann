import React from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types/Language';
import { LANGUAGE_TAXONOMY } from '../types/Taxonomy';

interface SidebarProps {
  languages: Language[];
  selectedLanguage: Language | null;
  onLanguageSelect: (language: Language) => void;
  onSetLeft: (language: Language) => void;
  onSetRight: (language: Language) => void;
  searchQuery: string;
  familyFilter: string;
  branchFilter?: string;
  subgroupFilter?: string;
  onFamilyFilterChange: (family: string) => void;
  onBranchFilterChange?: (branch: string) => void;
  onSubgroupFilterChange?: (subgroup: string) => void;
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
  subgroupFilter = '',
  onBranchFilterChange,
  onSubgroupFilterChange
}) => {
  const { t } = useTranslation();

  const formatCountry = (code: string) => {
    try {
      return new Intl.DisplayNames(['ja'], { type: 'region' }).of(code) || code;
    } catch {
      return code;
    }
  };

  const filteredLanguages = languages.filter(lang => {
    const matchesSearch = lang.name_ja.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFamily = !familyFilter || lang.family === familyFilter;
    const matchesBranch = !branchFilter || lang.branch === branchFilter;
    const matchesSubgroup = !subgroupFilter || lang.subgroup === subgroupFilter;
    return matchesSearch && matchesFamily && matchesBranch && matchesSubgroup;
  });

  // 仕様に合わせた固定のファミリー一覧（重複無し・順序固定）
  const families = [
    'インド・ヨーロッパ',
    'シナ・チベット',
    'ニジェール・コンゴ',
    'アフロ・アジア',
    'オーストロネシア',
    'アルタイ',
    'ドラヴィダ',
    'その他'
  ];
  // Family が選択されていれば、定義済みの枝を優先表示。未選択時はデータから集約
  const branches = familyFilter
    ? Object.keys(LANGUAGE_TAXONOMY[familyFilter]?.branches || {})
    : Array.from(new Set(languages.map(l => l.branch).filter(Boolean))) as string[];
  const subgroupFromTaxonomy = (family: string, branch: string): string[] => {
    const sg = LANGUAGE_TAXONOMY[family]?.branches?.[branch] || [];
    return sg;
  };
  const subgroups = (familyFilter && branchFilter)
    ? subgroupFromTaxonomy(familyFilter, branchFilter)
    : Array.from(new Set(languages
        .filter(l => (!familyFilter || l.family === familyFilter) && (!branchFilter || l.branch === branchFilter))
        .map(l => l.subgroup)
        .filter(Boolean))) as string[];

  return (
    <div className="w-80 bg-gray-100 p-4 h-full overflow-y-auto flex-shrink-0 min-h-0">
      <h2 className="text-lg font-semibold mb-4">{t('sidebar.title')}</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">{t('filter.family')}</label>
        <select
          value={familyFilter}
          onChange={(e) => onFamilyFilterChange(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">すべて</option>
          {families.map(family => (
            <option key={family} value={family}>{family}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">{t('filter.branch')}</label>
        <select
          value={branchFilter}
          onChange={(e) => onBranchFilterChange?.(e.target.value)}
          className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            !familyFilter || !branches.length 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-gray-900'
          }`}
          disabled={!familyFilter || !branches.length}
        >
          <option value="">すべて</option>
          {branches.map(branch => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">{t('filter.subgroup')}</label>
        <select
          value={subgroupFilter}
          onChange={(e) => onSubgroupFilterChange?.(e.target.value)}
          className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            !branchFilter || !subgroups.length 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-gray-900'
          }`}
          disabled={!branchFilter || !subgroups.length}
        >
          <option value="">すべて</option>
          {subgroups.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
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
              <div className="font-medium">{lang.name_ja}</div>
            <div className="text-sm opacity-75">
              {lang.family}
              {lang.branch ? ` / ${lang.branch}` : ''}
              {lang.subgroup ? ` / ${lang.subgroup}` : ''}
            </div>
            {lang.countries && (
              <div className="text-xs opacity-60 truncate" title={lang.countries.map(formatCountry).join('、')}>
                {lang.countries.map(formatCountry).join('、')}
              </div>
            )}
              {lang.total_speakers && (
                <div className="text-xs opacity-60">
                  {lang.total_speakers.toLocaleString()}人
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onSetLeft(lang)}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                比較A
              </button>
              <button
                onClick={() => onSetRight(lang)}
                className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                比較B
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
