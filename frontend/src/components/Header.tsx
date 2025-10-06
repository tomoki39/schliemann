import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types/Language';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleSidebar: () => void;
  languages: Language[];
  activeTab: 'map' | 'voice' | 'insights';
  onChangeTab: (tab: 'map' | 'voice' | 'insights') => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, onToggleSidebar, languages, activeTab, onChangeTab }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 検索候補を生成（パフォーマンス最適化）
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const suggestions = new Set<string>();
    const q = searchQuery.toLowerCase();
    const maxSuggestions = 8;
    
    // 早期終了のためのカウンター
    let count = 0;
    
    for (const lang of languages) {
      if (count >= maxSuggestions) break;
      
      // 言語名で検索
      if (lang.name_ja.toLowerCase().includes(q)) {
        suggestions.add(lang.name_ja);
        count++;
      }
      
      // 語族で検索
      if (count < maxSuggestions && lang.family.toLowerCase().includes(q)) {
        suggestions.add(lang.family);
        count++;
      }
      
      // 語派で検索
      if (count < maxSuggestions && lang.branch?.toLowerCase().includes(q)) {
        suggestions.add(lang.branch);
        count++;
      }
      
      // 語群で検索
      if (count < maxSuggestions && lang.group?.toLowerCase().includes(q)) {
        suggestions.add(lang.group);
        count++;
      }
      
      // 語支で検索
      if (count < maxSuggestions && lang.subgroup?.toLowerCase().includes(q)) {
        suggestions.add(lang.subgroup);
        count++;
      }
      
      // 言語で検索
      if (count < maxSuggestions && lang.language?.toLowerCase().includes(q)) {
        suggestions.add(lang.language);
        count++;
      }
      
      // 方言で検索
      if (count < maxSuggestions && lang.dialect?.toLowerCase().includes(q)) {
        suggestions.add(lang.dialect);
        count++;
      }
      
      // 国名で検索（制限付き）
      if (count < maxSuggestions && lang.countries) {
        for (const country of lang.countries.slice(0, 2)) { // 最初の2国のみ
          try {
            const countryName = new Intl.DisplayNames(['ja'], { type: 'region' }).of(country);
            if (countryName?.toLowerCase().includes(q)) {
              suggestions.add(countryName);
              count++;
              break;
            }
          } catch {
            if (country.toLowerCase().includes(q)) {
              suggestions.add(country);
              count++;
              break;
            }
          }
        }
      }
    }
    
    return Array.from(suggestions).slice(0, maxSuggestions);
  }, [languages, searchQuery]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md relative">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-blue-700 rounded transition-colors"
            aria-label="サイドバー切り替え"
            title="メニュー"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">{t('app.title')}</h1>
        </div>
        <div className="flex items-center space-x-4 relative">
          <div className="relative">
            <input
              type="text"
              placeholder={t('nav.search.placeholder')}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="px-3 py-2 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 w-64"
            />
            
            {/* 検索候補ドロップダウン */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* ビュー切替（ヘッダー内） */}
          <div className="hidden md:flex bg-blue-500/30 rounded overflow-hidden">
            <button
              onClick={() => onChangeTab('map')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${activeTab === 'map' ? 'bg-white text-blue-700' : 'text-white hover:bg-blue-500/50'}`}
            >
              地図表示
            </button>
            <button
              onClick={() => onChangeTab('voice')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${activeTab === 'voice' ? 'bg-white text-blue-700' : 'text-white hover:bg-blue-500/50'}`}
            >
              音声体験
            </button>
            <button
              onClick={() => onChangeTab('insights')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${activeTab === 'insights' ? 'bg-white text-blue-700' : 'text-white hover:bg-blue-500/50'}`}
            >
              言語インサイト
            </button>
          </div>
          <button
            onClick={toggleMenu}
            className="p-2 hover:bg-blue-700 rounded"
            aria-label="地球メニュー"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* ハンバーガーメニュー */}
      {isMenuOpen && (
        <div className="absolute top-full right-4 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">{t('nav.language')}</h3>
            </div>
            <button
              onClick={() => {
                // 日本語選択時の処理
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <span className="mr-2">🇯🇵</span>
              日本語
            </button>
            <button
              onClick={() => {
                // 英語選択時の処理
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <span className="mr-2">🇺🇸</span>
              English
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
