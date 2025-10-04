import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, onToggleSidebar }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md relative">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-blue-700 rounded"
            aria-label="サイドバー切り替え"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4H5a2 2 0 00-2 2v12a2 2 0 002 2h4m0-16v16m0-16l7 0m-7 16l7 0m-7-8h14" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">{t('app.title')}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder={t('nav.search.placeholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-3 py-2 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
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
