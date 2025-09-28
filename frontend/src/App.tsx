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
import DialectDetailPanel from './components/DialectDetailPanel';
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
  const [isJapaneseDialectMode, setIsJapaneseDialectMode] = useState(false);
  const [selectedDialect, setSelectedDialect] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [dialectSearchQuery, setDialectSearchQuery] = useState('');
  const [showDialectDetail, setShowDialectDetail] = useState(false);
  
  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    setLanguages(languagesData as Language[]);
  }, []);

  const handleLanguageSelect = (language: Language) => {
    // 日本を選択した場合は方言モードに切り替え
    if (language.id === 'jpn') {
      setIsJapaneseDialectMode(true);
      setSelectedLanguage(null);
      setShowDetail(false);
    } else {
      // その他の国は従来通り言語詳細表示
      setSelectedLanguage(language);
      setShowDetail(true);
      setIsJapaneseDialectMode(false);
    }
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

  const handleBackToWorld = () => {
    setIsJapaneseDialectMode(false);
    setSelectedDialect(null);
    setCustomText('');
    setShowDialectDetail(false);
  };

  const handleDialectDetailOpen = () => {
    setShowDialectDetail(true);
  };

  const handleDialectDetailClose = () => {
    setShowDialectDetail(false);
  };

  const handlePlaySample = (text: string) => {
    // サンプル音声を再生する処理（既存の音声再生機能を使用）
    if (selectedDialectData) {
      // 一時的にカスタムテキストを変更して音声再生
      const originalText = customText;
      setCustomText(text);
      // 音声再生はDialectPlayerコンポーネントで処理される
    }
  };

  const handlePlayCustom = (text: string) => {
    // カスタム音声を再生する処理
    setCustomText(text);
    // 音声再生はDialectPlayerコンポーネントで処理される
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
      />
      
      <div className="flex-1 flex min-h-0">
        {sidebarVisible && !isJapaneseDialectMode && (
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
        
               {sidebarVisible && isJapaneseDialectMode && (
                 <JapaneseDialectSidebar
                   dialects={japaneseDialects}
                   selectedDialect={selectedDialect}
                   onDialectSelect={handleDialectSelect}
                   searchQuery={dialectSearchQuery}
                   onSearchChange={setDialectSearchQuery}
                   onBackToWorld={handleBackToWorld}
                   onDialectDetailOpen={handleDialectDetailOpen}
                 />
               )}
        
        {isJapaneseDialectMode ? (
          <div className="flex-1 relative">
            <JapaneseDialectMap
              selectedDialect={selectedDialect}
              onDialectSelect={handleDialectSelect}
              onDialectHover={handleDialectHover}
            />
            {/* 戻るボタン */}
            <button
              onClick={handleBackToWorld}
              className="absolute top-4 left-4 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center space-x-2 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>世界地図に戻る</span>
            </button>
          </div>
        ) : (
          <GoogleMapView
            languages={visibleLanguages}
            selectedLanguage={selectedLanguage}
            onLanguageClick={handleLanguageSelect}
            colorMode={colorMode}
            familyFilter={familyFilter}
            branchFilter={branchFilter}
            subgroupFilter={subgroupFilter}
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
             {isJapaneseDialectMode && selectedDialect && selectedDialectData && !showDialectDetail && (
               <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-md z-50">
                 <div className="flex justify-between items-center mb-3">
                   <h3 className="text-lg font-semibold text-gray-800">
                     {selectedDialectData.name}
                   </h3>
                   <div className="flex items-center space-x-2">
                     <button
                       onClick={handleDialectDetailOpen}
                       className="text-blue-600 hover:text-blue-800 text-sm"
                     >
                       詳細
                     </button>
                     <button
                       onClick={() => setSelectedDialect(null)}
                       className="text-gray-500 hover:text-gray-700"
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </button>
                   </div>
                 </div>
                 
                 <div className="space-y-4">
                   <DialectPlayer
                     dialect={selectedDialectData}
                     customText={customText}
                     onCustomTextChange={setCustomText}
                   />
                   
                   {/* カスタム文章入力欄 */}
                   <div className="bg-gray-50 rounded-lg p-3">
                     <h4 className="text-sm font-medium text-gray-700 mb-2">カスタム文章</h4>
                     <textarea
                       value={customText}
                       onChange={(e) => setCustomText(e.target.value)}
                       placeholder="ここにテキストを入力してください..."
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                       rows={2}
                     />
                     <button
                       onClick={() => {
                         if (customText.trim()) {
                           // カスタム音声を再生
                           console.log('Playing custom:', customText);
                         }
                       }}
                       disabled={!customText.trim()}
                       className="mt-2 w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center space-x-2"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                       </svg>
                       <span>カスタム音声を再生</span>
                     </button>
                   </div>
                 </div>
               </div>
             )}

             {/* 方言詳細パネル */}
             {isJapaneseDialectMode && selectedDialect && selectedDialectData && showDialectDetail && (
               <DialectDetailPanel
                 dialect={selectedDialectData}
                 onClose={handleDialectDetailClose}
                 onPlaySample={handlePlaySample}
                 onPlayCustom={handlePlayCustom}
                 customText={customText}
                 onCustomTextChange={setCustomText}
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
