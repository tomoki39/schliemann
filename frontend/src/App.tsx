import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GoogleMapView from './components/GoogleMapView';
import DetailPanel from './components/DetailPanel';
import ComparePanel from './components/ComparePanel';
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

  return (
    <div className="h-screen flex flex-col">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={toggleSidebar}
        sidebarVisible={sidebarVisible}
        colorMode={colorMode}
        onChangeColorMode={setColorMode}
      />
      
      <div className="flex-1 flex min-h-0">
        {sidebarVisible && (
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
        
        <GoogleMapView
          languages={visibleLanguages}
          selectedLanguage={selectedLanguage}
          onLanguageClick={handleLanguageSelect}
          colorMode={colorMode}
          familyFilter={familyFilter}
          branchFilter={branchFilter}
          subgroupFilter={subgroupFilter}
        />
      </div>
      
      {showDetail && selectedLanguage && (
        <DetailPanel
          language={selectedLanguage}
          onClose={handleDetailClose}
          isBookmarked={isBookmarked(selectedLanguage.id)}
          onToggleBookmark={toggleBookmark}
        />
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
