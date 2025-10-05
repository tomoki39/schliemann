import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import VoiceTour from './components/VoiceTour';
import VoiceComparison from './components/VoiceComparison';
import { useBookmarks } from './hooks/useBookmarks';
import { Language } from './types/Language';
import languagesData from './data/languages.json';

const App: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [subgroupFilter, setSubgroupFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [dialectFilter, setDialectFilter] = useState('');
  const [colorMode] = useState<'family' | 'branch' | 'group' | 'subgroup' | 'language' | 'dialect'>('family');
  const [activeTab, setActiveTab] = useState<'map' | 'voice'>('map');
  const [showVoiceTour, setShowVoiceTour] = useState(false);
  const [showVoiceComparison, setShowVoiceComparison] = useState(false);
  const [comparisonDialects, setComparisonDialects] = useState<string[]>([]);

  // 検索結果のキャッシュ
  const searchCache = useRef<Map<string, Language[]>>(new Map());
  
  const visibleLanguages = useMemo(() => {
    const cacheKey = `${searchQuery}-${familyFilter}-${branchFilter}-${groupFilter}-${subgroupFilter}-${languageFilter}-${dialectFilter}`;
    
    // キャッシュから取得
    if (searchCache.current.has(cacheKey)) {
      return searchCache.current.get(cacheKey)!;
    }
    
    const q = searchQuery.toLowerCase();
    const filtered = languages.filter((lang) => {
      // 多言語検索: 日本語名、英語名、現地語名、国名、語族・語派・語群・語支・言語名で検索
      const matchesSearch = !q || 
        lang.name_ja.toLowerCase().includes(q) ||
        (lang as any).name_en?.toLowerCase().includes(q) ||
        (lang as any).name_native?.toLowerCase().includes(q) ||
        lang.family.toLowerCase().includes(q) ||
        lang.branch?.toLowerCase().includes(q) ||
        lang.group?.toLowerCase().includes(q) ||
        lang.subgroup?.toLowerCase().includes(q) ||
        lang.language?.toLowerCase().includes(q) ||
        lang.dialect?.toLowerCase().includes(q) ||
        lang.countries?.some(country => {
          try {
            const countryName = new Intl.DisplayNames(['ja'], { type: 'region' }).of(country);
            return countryName?.toLowerCase().includes(q);
          } catch {
            return country.toLowerCase().includes(q);
          }
        });
      
      const matchesFamily = !familyFilter || lang.family === familyFilter;
      const matchesBranch = !branchFilter || lang.branch === branchFilter;
      const matchesGroup = !groupFilter || lang.group === groupFilter;
      const matchesSubgroup = !subgroupFilter || lang.subgroup === subgroupFilter;
      const matchesLanguage = !languageFilter || lang.language === languageFilter;
      const matchesDialect = !dialectFilter || (lang.dialects && lang.dialects.some(dialect => dialect.name === dialectFilter));
      return matchesSearch && matchesFamily && matchesBranch && matchesGroup && matchesSubgroup && matchesLanguage && matchesDialect;
    });
    
    // キャッシュに保存（最大100件まで）
    if (searchCache.current.size < 100) {
      searchCache.current.set(cacheKey, filtered);
    }
    
    return filtered;
  }, [languages, searchQuery, familyFilter, branchFilter, subgroupFilter]);
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

  // 階層的なフィルタのリセット処理（6層構造対応）
  const handleFamilyFilterChange = (family: string) => {
    setFamilyFilter(family);
    setBranchFilter(''); // Familyが変更されたらBranchをリセット
    setGroupFilter(''); // Groupもリセット
    setSubgroupFilter(''); // Subgroupもリセット
    setLanguageFilter(''); // Languageもリセット
    setDialectFilter(''); // Dialectもリセット
  };

  const handleBranchFilterChange = (branch: string) => {
    setBranchFilter(branch);
    setGroupFilter(''); // Branchが変更されたらGroupをリセット
    setSubgroupFilter(''); // Subgroupもリセット
    setLanguageFilter(''); // Languageもリセット
    setDialectFilter(''); // Dialectもリセット
  };

  const handleGroupFilterChange = (group: string) => {
    setGroupFilter(group);
    setSubgroupFilter(''); // Groupが変更されたらSubgroupをリセット
    setLanguageFilter(''); // Languageもリセット
    setDialectFilter(''); // Dialectもリセット
  };

  const handleSubgroupFilterChange = (subgroup: string) => {
    setSubgroupFilter(subgroup);
    setLanguageFilter(''); // Subgroupが変更されたらLanguageをリセット
    setDialectFilter(''); // Dialectもリセット
  };

  const handleLanguageFilterChange = (language: string) => {
    setLanguageFilter(language);
    setDialectFilter(''); // Languageが変更されたらDialectをリセット
  };

  const handleDialectFilterChange = (dialect: string) => {
    setDialectFilter(dialect);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleDialectSelect = (dialectId: string) => {
    setSelectedDialect(dialectId);
  };

  const handleDialectHover = () => {
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
  const japaneseDialects = japaneseLanguage?.dialects?.map((d, index) => ({
    ...d,
    id: d.conversion_model || `dialect-${index}`
  })) || [];
  const selectedDialectData = selectedDialect && japaneseDialects.find(d => d.conversion_model === selectedDialect);

  return (
    <div className="h-screen flex flex-col">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleSidebar={toggleSidebar}
          languages={languages}
        />
        
        {/* タブナビゲーション */}
        <div className="border-b bg-white">
          <div className="flex">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'map'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              地図表示
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'voice'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              音声体験
            </button>
          </div>
        </div>
      
      <div className="flex-1 flex min-h-0">
        {activeTab === 'map' && (
          <>
            {sidebarVisible && !isJapaneseDialectMode && (
              <Sidebar
            languages={languages}
            selectedLanguage={selectedLanguage}
            onLanguageSelect={handleLanguageSelect}
            onSetLeft={handleSetLeft}
            onSetRight={handleSetRight}
            searchQuery={searchQuery}
            familyFilter={familyFilter}
            branchFilter={branchFilter}
            groupFilter={groupFilter}
            subgroupFilter={subgroupFilter}
            languageFilter={languageFilter}
            dialectFilter={dialectFilter}
            onFamilyFilterChange={handleFamilyFilterChange}
            onBranchFilterChange={handleBranchFilterChange}
            onGroupFilterChange={handleGroupFilterChange}
            onSubgroupFilterChange={handleSubgroupFilterChange}
            onLanguageFilterChange={handleLanguageFilterChange}
            onDialectFilterChange={handleDialectFilterChange}
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
            languages={languages}
            selectedLanguage={selectedLanguage}
            onLanguageClick={handleLanguageSelect}
            colorMode={colorMode}
            familyFilter={familyFilter}
            branchFilter={branchFilter}
            groupFilter={groupFilter}
            subgroupFilter={subgroupFilter}
            languageFilter={languageFilter}
            dialectFilter={dialectFilter}
          />
            )}
            
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
          </>
        )}
        
        {activeTab === 'voice' && (
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setShowVoiceTour(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                音声ツアー
              </button>
              <button
                onClick={() => setShowVoiceComparison(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                音声比較
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">音声ツアー</h3>
                <p className="text-gray-600 mb-4">
                  地域別や語族別に言語を順番に体験できます。自動再生機能で連続して聞くことができます。
                </p>
                <button
                  onClick={() => setShowVoiceTour(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  ツアーを開始
                </button>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">音声比較</h3>
                <p className="text-gray-600 mb-4">
                  複数の方言や言語を同時に聞き比べることができます。違いを直感的に理解できます。
                </p>
                <button
                  onClick={() => setShowVoiceComparison(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  比較を開始
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 音声ツアーモーダル */}
        {showVoiceTour && (
          <VoiceTour
            languages={languages}
            onClose={() => setShowVoiceTour(false)}
          />
        )}

        {/* 音声比較モーダル */}
        {showVoiceComparison && (
          <VoiceComparison
            text="こんにちは、音声比較のデモです"
            language="japanese"
            dialects={['kansai', 'hakata', 'tsugaru', 'okinawa']}
            onClose={() => setShowVoiceComparison(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
