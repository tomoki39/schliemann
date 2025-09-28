import React, { useMemo, useState } from 'react';

interface Dialect {
  id: string;
  name: string;
  region: string;
  sample_text: string;
  description: string;
  conversion_model: string;
}

interface JapaneseDialectSidebarProps {
  dialects: Dialect[];
  selectedDialect: string | null;
  onDialectSelect: (dialectId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBackToWorld: () => void;
  onDialectDetailOpen?: (dialectId: string) => void;
}

interface FilterState {
  region: string;
  feature: string;
}

const JapaneseDialectSidebar: React.FC<JapaneseDialectSidebarProps> = ({
  dialects,
  selectedDialect,
  onDialectSelect,
  searchQuery,
  onSearchChange,
  onBackToWorld,
  onDialectDetailOpen
}) => {
  const [filters, setFilters] = useState<FilterState>({
    region: '',
    feature: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 地域リストを取得
  const regions = useMemo(() => {
    const regionSet = new Set(dialects.map(d => d.region));
    return Array.from(regionSet).sort();
  }, [dialects]);

  // フィルタされた方言リスト
  const filteredDialects = useMemo(() => {
    return dialects.filter(dialect => {
      const matchesSearch = !searchQuery || 
        dialect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dialect.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dialect.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRegion = !filters.region || dialect.region === filters.region;
      
      const matchesFeature = !filters.feature || 
        (filters.feature === 'recent' && false); // 最近使用した方言（実装予定）
      
      return matchesSearch && matchesRegion && matchesFeature;
    });
  }, [dialects, searchQuery, filters]);

  const clearFilters = () => {
    setFilters({ region: '', feature: '' });
    onSearchChange('');
  };

  // 検索候補を生成
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const suggestions = new Set<string>();
    dialects.forEach(dialect => {
      if (dialect.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.add(dialect.name);
      }
      if (dialect.region.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.add(dialect.region);
      }
    });
    
    return Array.from(suggestions).slice(0, 5);
  }, [dialects, searchQuery]);

  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
    addToSearchHistory(suggestion);
  };

  const addToSearchHistory = (query: string) => {
    if (query.trim() && !searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev].slice(0, 5));
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">日本方言</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>フィルタ</span>
            </button>
            <button
              onClick={onBackToWorld}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>戻る</span>
            </button>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="方言を検索..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* 検索候補ドロップダウン */}
          {showSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0) && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {/* 検索候補 */}
              {searchSuggestions.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                    検索候補
                  </div>
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {suggestion}
                    </button>
                  ))}
                </>
              )}
              
              {/* 検索履歴 */}
              {searchHistory.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b flex items-center justify-between">
                    <span>検索履歴</span>
                    <button
                      onClick={clearSearchHistory}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      クリア
                    </button>
                  </div>
                  {searchHistory.map((history, index) => (
                    <button
                      key={`history-${index}`}
                      onClick={() => handleSuggestionClick(history)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center"
                    >
                      <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {history}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        
        {/* フィルタパネル */}
        {showFilters && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">フィルタ</h3>
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                クリア
              </button>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">地域</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">すべての地域</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">特徴</label>
              <select
                value={filters.feature}
                onChange={(e) => setFilters(prev => ({ ...prev, feature: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">すべて</option>
                <option value="recent">最近使用</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* 検索結果の統計情報 */}
          <div className="mb-4 text-sm text-gray-600">
            {searchQuery || filters.region || filters.feature ? (
              <div className="flex items-center justify-between">
                <span>
                  {filteredDialects.length}件の方言が見つかりました
                </span>
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  フィルタをクリア
                </button>
              </div>
            ) : (
              <span>全{filteredDialects.length}件の方言</span>
            )}
          </div>
          
          <div className="space-y-2">
            {filteredDialects.length > 0 ? (
              filteredDialects.map((dialect) => (
                <div
                  key={dialect.id}
                  onClick={() => onDialectSelect(dialect.conversion_model)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDialect === dialect.conversion_model
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-800">{dialect.name}</h3>
                        {onDialectDetailOpen && dialect.detailed_info && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDialectDetailOpen(dialect.conversion_model);
                            }}
                            className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                            title="詳細情報"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{dialect.region}</p>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {dialect.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 p-2 bg-white rounded border text-sm text-gray-700">
                    <div className="font-medium text-xs text-gray-500 mb-1">例文:</div>
                    <div className="italic">"{dialect.sample_text}"</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 4c-2.34 0-4.29 1.009-5.824 2.709" />
                </svg>
                <p>該当する方言が見つかりません</p>
                <p className="text-sm mt-1">検索条件を変更してみてください</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p>💡 方言をクリックして音声を聞いてみましょう</p>
          <p className="mt-1">地図上のマーカーからも選択できます</p>
        </div>
      </div>
    </div>
  );
};

export default JapaneseDialectSidebar;
