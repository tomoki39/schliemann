import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import JapaneseDialectSidebar from './components/JapaneseDialectSidebar';
import GoogleMapView from './components/GoogleMapView';
import JapaneseDialectMap from './components/JapaneseDialectMap';
import DetailPanel from './components/DetailPanel';
import ComparePanel from './components/ComparePanel';
import DialectPlayer from './components/DialectPlayer';
import { useBookmarks } from './hooks/useBookmarks';
import { Language } from './types/Language';
import languagesData from './data/languages.json';
import countryOfficialMap from './data/countries_official_languages.json';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [subgroupFilter, setSubgroupFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [colorMode, setColorMode] = useState<'family' | 'branch' | 'subgroup'>('family');
  const countryOfficialSet = useMemo(() => {
    if (!countryFilter) return new Set<string>();
    const entry = (countryOfficialMap as Record<string, { official_languages: string[] }>)[countryFilter];
    return new Set(entry ? entry.official_languages : []);
  }, [countryFilter]);

  const visibleLanguages = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return languages.filter((lang) => {
      const matchesSearch = !q || lang.name_ja.toLowerCase().includes(q);
      const matchesFamily = !familyFilter || lang.family === familyFilter;
      const matchesBranch = !branchFilter || lang.branch === branchFilter;
      const matchesSubgroup = !subgroupFilter || lang.subgroup === subgroupFilter;
      const matchesCountry = !countryFilter || (lang.countries?.includes(countryFilter) || countryOfficialSet.has(lang.id));
      return matchesSearch && matchesFamily && matchesBranch && matchesSubgroup && matchesCountry;
    });
  }, [languages, searchQuery, familyFilter, branchFilter, subgroupFilter, countryFilter, countryOfficialSet]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [leftLanguage, setLeftLanguage] = useState<Language | null>(null);
  const [rightLanguage, setRightLanguage] = useState<Language | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // 方言地図用の状態
  const [viewMode, setViewMode] = useState<'world' | 'japan'>('japan');
  const [selectedDialect, setSelectedDialect] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [dialectSearchQuery, setDialectSearchQuery] = useState('');
  
  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    setLanguages(languagesData as Language[]);
  }, []);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setShowDetail(true);
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setSelectedLanguage(null);
  };

  const handleCompareClose = () => {
    setShowCompare(false);
  };

  const handleSetLeft = (language: Language) => {
    setLeftLanguage(language);
    if (!showCompare) setShowCompare(true);
  };

  const handleSetRight = (language: Language) => {
    setRightLanguage(language);
    if (!showCompare) setShowCompare(true);
  };

  const handleClearLeft = () => {
    setLeftLanguage(null);
  };

  const handleClearRight = () => {
    setRightLanguage(null);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleDialectSelect = (dialectId: string) => {
    setSelectedDialect(dialectId);
  };

  const handleDialectHover = (dialectId: string | null) => {
    // ホバー時の処理（必要に応じて実装）
  };

  // 日本語の方言データを取得
  const japaneseLanguage = languages.find(lang => lang.id === 'jpn');
  const japaneseDialects = japaneseLanguage?.dialects || [];
  const selectedDialectData = selectedDialect && japaneseDialects.find(d => d.conversion_model === selectedDialect);

  return (
    <div className="h-screen flex flex-col">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={toggleSidebar}
        sidebarVisible={sidebarVisible}
        colorMode={colorMode}
        onChangeColorMode={setColorMode}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />
      
      <div className="flex-1 flex min-h-0">
        {sidebarVisible && viewMode === 'world' && (
          <Sidebar
            languages={visibleLanguages}
            selectedLanguage={selectedLanguage}
            onLanguageSelect={handleLanguageSelect}
            onSetLeft={handleSetLeft}
            onSetRight={handleSetRight}
            searchQuery={searchQuery}
            familyFilter={familyFilter}
            branchFilter={branchFilter}
            subgroupFilter={subgroupFilter}
            onFamilyFilterChange={(v) => { setFamilyFilter(v); setBranchFilter(''); setSubgroupFilter(''); setCountryFilter(''); }}
            onBranchFilterChange={(v) => { setBranchFilter(v); setSubgroupFilter(''); setCountryFilter(''); }}
            onSubgroupFilterChange={(v) => { setSubgroupFilter(v); setCountryFilter(''); }}
            countryFilter={countryFilter}
            onCountryFilterChange={setCountryFilter}
          />
        )}
        
        {sidebarVisible && viewMode === 'japan' && (
          <JapaneseDialectSidebar
            dialects={japaneseDialects}
            selectedDialect={selectedDialect}
            onDialectSelect={handleDialectSelect}
            searchQuery={dialectSearchQuery}
            onSearchChange={setDialectSearchQuery}
          />
        )}
        
        {viewMode === 'world' ? (
          <GoogleMapView
            languages={visibleLanguages}
            selectedLanguage={selectedLanguage}
            onLanguageClick={handleLanguageSelect}
            colorMode={colorMode}
            familyFilter={familyFilter}
            branchFilter={branchFilter}
            subgroupFilter={subgroupFilter}
          />
        ) : (
          <JapaneseDialectMap
            selectedDialect={selectedDialect}
            onDialectSelect={handleDialectSelect}
            onDialectHover={handleDialectHover}
          />
        )}
      </div>
      
      {showDetail && selectedLanguage && (
        <DetailPanel
          language={selectedLanguage}
          onClose={handleDetailClose}
          isBookmarked={isBookmarked(selectedLanguage.id)}
          onToggleBookmark={toggleBookmark}
        />
      )}
      
      {/* 方言選択時の音声パネル */}
      {viewMode === 'japan' && selectedDialect && selectedDialectData && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-md z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedDialectData.name}
            </h3>
            <button
              onClick={() => setSelectedDialect(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <DialectPlayer
            dialect={selectedDialectData}
            customText={customText}
            onCustomTextChange={setCustomText}
          />
        </div>
      )}
      
      {showCompare && (
        <ComparePanel
          leftLanguage={leftLanguage}
          rightLanguage={rightLanguage}
          onClose={handleCompareClose}
          onSetLeft={handleSetLeft}
          onSetRight={handleSetRight}
          onClearLeft={handleClearLeft}
          onClearRight={handleClearRight}
        />
      )}
    </div>
  );
};

export default App;
