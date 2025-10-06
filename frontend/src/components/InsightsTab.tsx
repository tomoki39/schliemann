import React, { useState } from 'react';
import { Language } from '../types/Language';
import DialectPlayer from './DialectPlayer';
import LanguageInsightDetail from './LanguageInsightDetail';
import PhoneticFilter from './PhoneticFilter';
import PhoneticMap from './PhoneticMap';

interface InsightsTabProps {
  languages: Language[];
}

const buildOverview = (lang: Language): string => {
  const parts: string[] = [];
  if (lang.family) parts.push(`${lang.family}系`);
  if (lang.branch) parts.push(`${lang.branch}`);
  if (lang.group) parts.push(`${lang.group}`);
  if (lang.subgroup) parts.push(`${lang.subgroup}`);
  const lineage = parts.join(' / ');
  const geo = (lang.countries && lang.countries.length)
    ? `主な分布: ${lang.countries.slice(0, 5).join(', ')}${lang.countries.length > 5 ? ' …' : ''}`
    : '';
  const speakers = lang.total_speakers ? `推定話者数: ${lang.total_speakers.toLocaleString()}人` : '';
  return [lineage, geo, speakers].filter(Boolean).join(' ・ ');
};

const buildPhoneticsNote = (lang: Language): string => {
  // 簡易: 系統に応じて代表的な音韻トピックを提示（説明テキスト）
  if (lang.family?.includes('インド・ヨーロッパ')) return '特徴的な子音群・母音の体系、屈折や語幹交替の歴史的痕跡。';
  if (lang.family?.includes('シナ・チベット')) return '声調や音節構造に注目。官話系と南方諸語では音韻・語彙の差異が大きい。';
  if (lang.family?.includes('アフロ・アジア')) return '強勢・咽頭化音や三子音語根など、音韻と形態の結びつきが見られる。';
  if (lang.family?.includes('ウラル')) return '母音調和・格体系が顕著。語幹に接尾辞が連なる膠着性が強い。';
  if (lang.family?.includes('テュルク')) return '母音調和と膠着的形態論。語順はSOVが一般的。';
  return '音韻・形態・語順の相互作用に注目すると系統差が見えやすい。';
};

const InsightsTab: React.FC<InsightsTabProps> = ({ languages }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>(languages);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // 話者数順の上位を中心に提示
  const items = [...filteredLanguages]
    .sort((a, b) => (b.total_speakers || 0) - (a.total_speakers || 0))
    .slice(0, 40);

  const handleLanguageClick = (language: Language) => {
    setSelectedLanguage(language);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedLanguage(null);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">言語インサイト</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              📋 リスト
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'map' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              🗺️ マップ
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">系統・音声の観点から、差異と歴史の概観を示します（代表サンプル）。</p>
      </div>

      <PhoneticFilter
        languages={languages}
        onFilteredLanguages={setFilteredLanguages}
      />

      {viewMode === 'map' && (
        <PhoneticMap
          languages={filteredLanguages}
          onLanguageSelect={handleLanguageClick}
        />
      )}

      {viewMode === 'list' && items.map((lang) => (
        <div key={lang.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleLanguageClick(lang)}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-base font-semibold text-gray-900">{lang.name_ja}</div>
              <div className="text-xs text-gray-600 mt-1">{buildOverview(lang)}</div>
            </div>
            <div className="text-xs text-blue-600 hover:text-blue-800">詳細を見る →</div>
          </div>

          <div className="text-sm text-gray-700 mb-3">
            <span className="font-medium">音声・音韻の見どころ: </span>
            {buildPhoneticsNote(lang)}
          </div>

          {lang.dialects && lang.dialects.length > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-1">代表的な方言サンプル</div>
              <div className="space-y-2">
                {lang.dialects.slice(0, 2).map((d, i) => (
                  <DialectPlayer
                    key={i}
                    dialect={{ ...d, id: d.conversion_model || String(i) }}
                    className="w-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {viewMode === 'list' && items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          フィルター条件に一致する言語が見つかりませんでした。
        </div>
      )}

      {showDetail && selectedLanguage && (
        <LanguageInsightDetail
          language={selectedLanguage}
          onClose={handleCloseDetail}
          allLanguages={languages}
        />
      )}
    </div>
  );
};

export default InsightsTab;


