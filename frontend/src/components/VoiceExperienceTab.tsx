import React, { useState, useMemo } from 'react';
import { Language } from '../types/Language';
import PopularLanguagesTab from './PopularLanguagesTab';
import RegionalTab from './RegionalTab';
import LanguageFamilyTab from './LanguageFamilyTab';
import AllLanguagesTab from './AllLanguagesTab';

interface VoiceExperienceTabProps {
  languages: Language[];
}

type TabType = 'popular' | 'regional' | 'family' | 'all';

const VoiceExperienceTab: React.FC<VoiceExperienceTabProps> = ({ languages }) => {
  const [activeTab, setActiveTab] = useState<TabType>('popular');
  const [searchQuery, setSearchQuery] = useState('');

  // 検索機能
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return languages;
    
    const query = searchQuery.toLowerCase();
    return languages.filter(lang => {
      // 多言語検索: 日本語名、英語名、現地語名、国名で検索
      return (
        lang.name_ja.toLowerCase().includes(query) ||
        (lang as any).name_en?.toLowerCase().includes(query) ||
        (lang as any).name_native?.toLowerCase().includes(query) ||
        lang.family.toLowerCase().includes(query) ||
        lang.branch?.toLowerCase().includes(query) ||
        lang.group?.toLowerCase().includes(query) ||
        lang.subgroup?.toLowerCase().includes(query) ||
        lang.language?.toLowerCase().includes(query) ||
        lang.dialect?.toLowerCase().includes(query) ||
        lang.countries?.some(country => {
          try {
            const countryName = new Intl.DisplayNames(['ja'], { type: 'region' }).of(country);
            return countryName?.toLowerCase().includes(query);
          } catch {
            return country.toLowerCase().includes(query);
          }
        })
      );
    });
  }, [languages, searchQuery]);

  const tabs = [
    { id: 'popular', label: '主要言語' },
    { id: 'regional', label: '地域別' },
    { id: 'family', label: '語族別' },
    { id: 'all', label: '全言語一覧' }
  ] as const;

  const renderActiveTab = () => {
    const commonProps = {
      languages: searchQuery ? filteredLanguages : languages,
      searchQuery
    };

    switch (activeTab) {
      case 'popular':
        return <PopularLanguagesTab {...commonProps} />;
      case 'regional':
        return <RegionalTab {...commonProps} />;
      case 'family':
        return <LanguageFamilyTab {...commonProps} />;
      case 'all':
        return <AllLanguagesTab {...commonProps} />;
      default:
        return <PopularLanguagesTab {...commonProps} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ヘッダー */}
      <div className="px-3 py-1.5 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-gray-800">音声体験</h2>
          <div className="text-xs text-gray-600">世界の言語と方言を探索</div>
        </div>
        
        {/* 検索バー */}
        <div className="relative">
          <input
            type="text"
            placeholder="言語名、国名、語族名で検索... (例: フランス語, French, français)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2.5 py-1 pl-6 pr-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
          />
          <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
            <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-1.5 flex items-center"
            >
              <svg className="h-3 w-3 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b bg-white">
        <nav className="flex space-x-4 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 px-1 border-b-2 font-medium text-xs flex items-center transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-hidden">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default VoiceExperienceTab;
